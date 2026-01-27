/**
 *
 * Usage:
 *   npx ts-node load-test/load-test.ts
 *
 * Environment variables:
 *   BASE_URL        - API base URL (default: http://localhost:3001)
 *   TOTAL_URLS      - Number of URLs to send (default: 5000)
 *   BATCH_SIZE      - URLs per request batch (default: 50)
 *   POLL_INTERVAL   - Seconds between status polls (default: 5)
 *   POLL_TIMEOUT    - Max seconds to wait for completion (default: 600)
 */

import { Queue } from 'bullmq';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TOTAL_URLS = parseInt(process.env.TOTAL_URLS || '5000', 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000', 10);
const POLL_INTERVAL_SEC = parseInt(process.env.POLL_INTERVAL || '5', 10);
const POLL_TIMEOUT_SEC = parseInt(process.env.POLL_TIMEOUT || '600', 10);

interface ScrapeResponse {
  message: string;
  urlsQueued: number;
}

interface SourceMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SourcesResponse {
  data: { id: string; url: string; status: string }[];
  meta: SourceMeta;
}

function generateTestUrls(count: number): string[] {
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    // Use httpbin.org/html which returns a small, predictable HTML page
    // Add unique query param to create distinct source entries
    urls.push(`https://httpbin.org/html?id=${i}`);
  }
  return urls;
}

async function sendBatch(urls: string[]): Promise<{ ok: boolean; timeMs: number; queued: number }> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/api/scraper/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });

    const timeMs = performance.now() - start;
    if (!res.ok) {
      console.error(`Batch failed: HTTP ${res.status} ${res.statusText}`);
      return { ok: false, timeMs, queued: 0 };
    }

    const body = (await res.json()) as ScrapeResponse;
    return { ok: true, timeMs, queued: body.urlsQueued };
  } catch (err) {
    const timeMs = performance.now() - start;
    console.error(`Batch error:`, err);
    return { ok: false, timeMs, queued: 0 };
  }
}

async function getSourceStatusCountsByAPI(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const statuses = ['pending', 'scraping', 'completed', 'failed'];

  await Promise.all(
    statuses.map(async (status) => {
      try {
        const res = await fetch(`${BASE_URL}/api/scraper/sources?status=${status}&limit=1`);
        if (res.ok) {
          const body = (await res.json()) as SourcesResponse;
          counts[status] = body.meta.total;
        }
      } catch {
        counts[status] = -1;
      }
    })
  );

  return counts;
}

async function getSourceStatusCountsByRedis(): Promise<Record<string, number>> {
  const queue = new Queue('scraper', {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  });

  const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

  await queue.close();
  return counts;
}

async function pollUntilComplete(
  totalExpected: number
): Promise<{ completed: number; failed: number; elapsedSec: number }> {
  const start = performance.now();
  const timeoutMs = POLL_TIMEOUT_SEC * 1000;

  while (performance.now() - start < timeoutMs) {
    const stats = await getSourceStatusCountsByAPI();
    // const stats = await getSourceStatusCountsByRedis();
    const completed = stats['completed'] || 0;
    const failed = stats['failed'] || 0;
    const pending = stats['pending'] || stats['waiting'] || 0;
    const scraping = stats['scraping'] || stats['active'] || 0;
    const elapsedSec = ((performance.now() - start) / 1000).toFixed(1);

    console.log(
      `[${elapsedSec}s] pending=${pending} scraping=${scraping} completed=${completed} failed=${failed} (total processed: ${completed + failed}/${totalExpected})`
    );

    if (completed + failed >= totalExpected) {
      return { completed, failed, elapsedSec: parseFloat(elapsedSec) };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_SEC * 1000));
  }

  const statsFromAPI = await getSourceStatusCountsByAPI();
  const statsFromRedis = await getSourceStatusCountsByRedis();
  const elapsedSec = (performance.now() - start) / 1000;
  if (
    statsFromAPI['completed'] !== statsFromRedis['completed'] ||
    statsFromAPI['failed'] !== statsFromRedis['failed']
  ) {
    console.error('Final stats from API:', statsFromAPI);
    console.error('Final stats from Redis:', statsFromRedis);
  }
  const stats = statsFromRedis;
  return {
    completed: stats['completed'] || 0,
    failed: stats['failed'] || 0,
    elapsedSec,
  };
}

async function main() {
  const initialStats = await getSourceStatusCountsByRedis();
  console.log('Initial queue status from Redis:', initialStats);

  console.log('=== Media Scraper Load Test ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Total URLs: ${TOTAL_URLS}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log('');

  // Phase 1: Generate test URLs
  const urls = generateTestUrls(TOTAL_URLS);
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }
  console.log(`Generated ${urls.length} URLs in ${batches.length} batches`);

  // Phase 2: Send all batches concurrently
  console.log('\n--- Phase 1: Sending requests ---');
  const sendStart = performance.now();

  const results = await Promise.all(batches.map((batch) => sendBatch(batch)));

  const sendElapsed = ((performance.now() - sendStart) / 1000).toFixed(2);
  const successful = results.filter((r) => r.ok);
  const totalNewQueued = results.reduce((sum, r) => sum + r.queued, 0);
  const avgTime = (results.reduce((sum, r) => sum + r.timeMs, 0) / results.length).toFixed(1);
  const maxTime = Math.max(...results.map((r) => r.timeMs)).toFixed(1);
  const minTime = Math.min(...results.map((r) => r.timeMs)).toFixed(1);

  console.log(`\nAll batches sent in ${sendElapsed}s`);
  console.log(`  Successful batches: ${successful.length}/${batches.length}`);
  console.log(`  Total New URLs queued: ${totalNewQueued}`);
  console.log(`  Response times - avg: ${avgTime}ms, min: ${minTime}ms, max: ${maxTime}ms`);

  if (totalNewQueued === 0) {
    console.error('\nNo URLs were queued. Aborting.');
    process.exit(1);
  }

  // Phase 3: Poll until all processing completes
  console.log('\n--- Phase 2: Polling for completion ---');
  const totalExpected = totalNewQueued + Object.values(initialStats).reduce((a, b) => a + b, 0);
  const pollResult = await pollUntilComplete(totalExpected);

  // Phase 4: Summary
  console.log('\n=== Load Test Results ===');
  console.log(`Total URLs submitted:   ${TOTAL_URLS}`);
  console.log(`Total URLs queued:      ${totalNewQueued}`);
  console.log(`Completed:              ${pollResult.completed}`);
  console.log(`Failed:                 ${pollResult.failed}`);
  console.log(`Queue acceptance time:  ${sendElapsed}s`);
  console.log(`Total processing time:  ${pollResult.elapsedSec}s`);
  console.log(
    `Throughput:             ${((pollResult.completed + pollResult.failed) / pollResult.elapsedSec).toFixed(1)} URLs/sec`
  );

  const successRate = ((pollResult.completed / totalNewQueued) * 100).toFixed(1);
  console.log(`Success rate:           ${successRate}%`);

  if (pollResult.completed + pollResult.failed < totalNewQueued) {
    console.log(
      `\nWARNING: Timed out before all jobs completed. ${totalNewQueued - pollResult.completed - pollResult.failed} jobs still processing.`
    );
  }
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});

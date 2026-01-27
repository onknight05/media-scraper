import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ScrapeStatus {
  PENDING = 'pending',
  SCRAPING = 'scraping',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('scrape_sources')
@Index(['status'])
@Index(['createdAt'])
export class ScrapeSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  url: string;

  @Column({
    type: 'enum',
    enum: ScrapeStatus,
    default: ScrapeStatus.PENDING,
  })
  status: ScrapeStatus;

  @Column({ type: 'int', default: 0 })
  mediaCount: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

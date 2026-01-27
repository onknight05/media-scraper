import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('scraped_media')
@Index(['sourceUrl'])
@Index(['type'])
@Index(['createdAt'], {})
export class ScrapedMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  url: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @Column({ type: 'text' })
  sourceUrl: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  alt: string;

  // @Column({ type: 'int', nullable: true })
  // width: number;

  // @Column({ type: 'int', nullable: true })
  // height: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

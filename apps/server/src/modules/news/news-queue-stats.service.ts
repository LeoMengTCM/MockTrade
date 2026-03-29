import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NEWS_BUFFER_QUEUE, NEWS_SCHEDULER_QUEUE } from './news.constants';

export interface QueueStats {
    waiting: number;
    delayed: number;
    completed: number;
    failed: number;
    active: number;
}

export interface NewsQueueStatsResult {
    buffer: QueueStats;
    scheduler: QueueStats;
}

@Injectable()
export class NewsQueueStatsService {
    constructor(
        @InjectQueue(NEWS_BUFFER_QUEUE) private readonly bufferQueue: Queue,
        @InjectQueue(NEWS_SCHEDULER_QUEUE) private readonly schedulerQueue: Queue,
    ) { }

    async getStats(): Promise<NewsQueueStatsResult> {
        const [buffer, scheduler] = await Promise.all([
            this.getQueueStats(this.bufferQueue),
            this.getQueueStats(this.schedulerQueue),
        ]);
        return { buffer, scheduler };
    }

    private async getQueueStats(queue: Queue): Promise<QueueStats> {
        const [waiting, delayed, completed, failed, active] = await Promise.all([
            queue.getWaitingCount(),
            queue.getDelayedCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getActiveCount(),
        ]);
        return { waiting, delayed, completed, failed, active };
    }
}

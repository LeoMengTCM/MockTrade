import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NEWS_PUBLISH_JOB, NEWS_SCHEDULER_QUEUE, PublishNewsJobData } from './news.constants';
import { NewsPublisherService } from './news-publisher.service';

@Processor(NEWS_SCHEDULER_QUEUE)
export class NewsQueueProcessor {
  constructor(private readonly newsPublisher: NewsPublisherService) {}

  @Process({ name: NEWS_PUBLISH_JOB, concurrency: 1 })
  async handleScheduledPublish(job: Job<PublishNewsJobData>) {
    return this.newsPublisher.publishOne({
      scheduled: true,
      cycle: job.data.cycle,
    });
  }
}

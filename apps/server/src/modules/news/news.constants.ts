export const NEWS_BUFFER_QUEUE = 'news-buffer';
export const NEWS_SCHEDULER_QUEUE = 'news-scheduler';

export const NEWS_BUFFER_JOB = 'pending-news-item';
export const NEWS_PUBLISH_JOB = 'publish-pending-news';

export interface PublishNewsJobData {
  cycle: number;
  index: number;
}

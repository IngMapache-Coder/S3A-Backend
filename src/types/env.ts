export interface Env {
  DB: D1Database;
  FIRMAS_BUCKET: R2Bucket;
  JWT_SECRET: string;
  PUSHER_APP_ID?: string;
  PUSHER_KEY?: string;
  PUSHER_SECRET?: string;
  PUSHER_CLUSTER?: string;
}

export type { Variables } from './index.js';

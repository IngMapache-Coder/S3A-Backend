export interface Env {
  DB: D1Database;
  FIRMAS_BUCKET: R2Bucket;
  JWT_SECRET: string;
}

export type { Variables } from './index.js';

import type { ConnectionOptions } from 'bullmq';
import type { RedisOptions } from 'ioredis';

/**
 * Parses REDIS_URL (Upstash format: rediss://... or redis://...)
 * and returns BullMQ-compatible connection options.
 * Returns null when REDIS_URL is not set so callers can fall back to sync mode.
 */
export function getRedisConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[Redis] REDIS_URL not set — queue disabled');
    return null;
  }

  if (url.startsWith('https://') || url.startsWith('http://')) {
    console.error('[Redis] REDIS_URL looks like an HTTP URL. Upstash Redis URL must start with rediss:// or redis://');
    return null;
  }

  try {
    const parsed = new URL(url);
    const tls = parsed.protocol === 'rediss:';
    const config: RedisOptions = {
      host: parsed.hostname,
      port: parseInt(parsed.port || (tls ? '6380' : '6379'), 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: tls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
    };
    console.log(`[Redis] Connecting to ${config.host}:${config.port} (tls=${tls})`);
    return config as ConnectionOptions;
  } catch {
    console.warn('[Redis] Invalid REDIS_URL — queue disabled, falling back to sync processing');
    return null;
  }
}

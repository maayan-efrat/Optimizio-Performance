import type { ConnectionOptions } from 'bullmq';

interface RedisNodeOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: { rejectUnauthorized: boolean };
  maxRetriesPerRequest: null;
}

export function getRedisConnection(): ConnectionOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('[Redis] REDIS_URL not set — queue disabled');
    return null;
  }

  if (url.startsWith('https://') || url.startsWith('http://')) {
    console.error('[Redis] REDIS_URL looks like an HTTP URL. Use rediss:// or redis://');
    return null;
  }

  try {
    const parsed = new URL(url);
    const tls = parsed.protocol === 'rediss:';
    const opts: RedisNodeOptions = {
      host: parsed.hostname,
      port: parseInt(parsed.port || (tls ? '6380' : '6379'), 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: tls ? { rejectUnauthorized: false } : undefined,
      maxRetriesPerRequest: null,
    };
    console.log(`[Redis] Connecting to ${opts.host}:${opts.port} (tls=${tls})`);
    return opts as unknown as ConnectionOptions;
  } catch {
    console.warn('[Redis] Invalid REDIS_URL — queue disabled');
    return null;
  }
}

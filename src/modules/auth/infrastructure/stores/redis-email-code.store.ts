import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  EmailCodeStoreEntry,
  EmailCodeStorePort,
} from '../../application/ports/email-code-store.port';

@Injectable()
export class RedisEmailCodeStore
  implements EmailCodeStorePort, OnModuleDestroy
{
  private readonly keyPrefix = 'auth:email-code:';
  private readonly redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { lazyConnect: true });
      return;
    }

    const rawPort = Number(process.env.REDIS_PORT ?? 6379);
    const redisPort = Number.isInteger(rawPort) && rawPort > 0 ? rawPort : 6379;

    this.redis = new Redis({
      host: process.env.REDIS_HOST?.trim() || '127.0.0.1',
      port: redisPort,
      username: process.env.REDIS_USERNAME?.trim() || undefined,
      password: process.env.REDIS_PASSWORD?.trim() || undefined,
      lazyConnect: true,
    });
  }

  private toKey(email: string): string {
    return `${this.keyPrefix}${email}`;
  }

  private async getRedisClient(): Promise<Redis> {
    if (this.redis.status === 'wait') {
      await this.redis.connect();
    }
    return this.redis;
  }

  async get(email: string): Promise<EmailCodeStoreEntry | null> {
    const key = this.toKey(email);
    const client = await this.getRedisClient();
    const raw = await client.get(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as EmailCodeStoreEntry;
      return parsed;
    } catch {
      await client.del(key);
      return null;
    }
  }

  async set(email: string, entry: EmailCodeStoreEntry): Promise<void> {
    const key = this.toKey(email);
    const ttlMs = entry.expiresAt - Date.now();
    const client = await this.getRedisClient();

    if (ttlMs <= 0) {
      await client.del(key);
      return;
    }

    await client.set(key, JSON.stringify(entry), 'PX', ttlMs);
  }

  async delete(email: string): Promise<void> {
    const client = await this.getRedisClient();
    await client.del(this.toKey(email));
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}

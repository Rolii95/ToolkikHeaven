import Redis from 'ioredis';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
}

class RedisCache {
  private client: Redis;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.client = new Redis({
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'aurora:',
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('⚠️ Redis connection closed');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Advanced operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isConnected) return keys.map(() => null);
      
      const values = await this.client.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const pipeline = this.client.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          pipeline.setex(key, ttlSeconds, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      return await this.client.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      console.error(`Cache lpush error for key ${key}:`, error);
      return 0;
    }
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      if (!this.isConnected) return [];
      const values = await this.client.lrange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      console.error(`Cache lrange error for key ${key}:`, error);
      return [];
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.hset(key, field, JSON.stringify(value));
      return result === 1;
    } catch (error) {
      console.error(`Cache hset error for key ${key}:`, error);
      return false;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      if (!this.isConnected) return {};
      const hash = await this.client.hgetall(key);
      const result: Record<string, T> = {};
      
      Object.entries(hash).forEach(([field, value]) => {
        result[field] = JSON.parse(value);
      });
      
      return result;
    } catch (error) {
      console.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // Cache patterns for common use cases
  async cacheWithTTL<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlSeconds: number = 300
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch from source
      const fresh = await fetchFunction();
      
      // Store in cache for future requests
      await this.set(key, fresh, ttlSeconds);
      
      return fresh;
    } catch (error) {
      console.error(`Cache with TTL error for key ${key}:`, error);
      // Fallback to direct fetch if cache fails
      return await fetchFunction();
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) return 0;
      
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.client.del(...keys);
    } catch (error) {
      console.error(`Cache clear by pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  // Get keys by pattern
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      
      const keys = await this.client.keys(pattern);
      return keys || [];
    } catch (error) {
      console.error(`Get keys by pattern error for ${pattern}:`, error);
      return [];
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache ping error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keyspace: Record<string, any>;
    uptime: number;
  }> {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          memory: '0',
          keyspace: {},
          uptime: 0,
        };
      }

      const info = await this.client.info();
      const memory = await this.client.info('memory');
      
      return {
        connected: true,
        memory: this.parseInfoSection(memory, 'used_memory_human'),
        keyspace: this.parseKeyspace(info),
        uptime: parseInt(this.parseInfoSection(info, 'uptime_in_seconds')),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memory: '0',
        keyspace: {},
        uptime: 0,
      };
    }
  }

  private parseInfoSection(info: string, key: string): string {
    const lines = info.split('\r\n');
    const line = lines.find(l => l.startsWith(key));
    return line ? line.split(':')[1] : '0';
  }

  private parseKeyspace(info: string): Record<string, any> {
    const keyspace: Record<string, any> = {};
    const lines = info.split('\r\n');
    
    lines.forEach(line => {
      if (line.startsWith('db')) {
        const [db, stats] = line.split(':');
        keyspace[db] = stats;
      }
    });
    
    return keyspace;
  }
}

// Create singleton instance
const cacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'aurora:',
};

export const cache = new RedisCache(cacheConfig);

// Cache key generators
export const CacheKeys = {
  PRODUCTS: 'products:all',
  PRODUCT_BY_ID: (id: string) => `product:${id}`,
  PRODUCT_SEARCH: (query: string) => `search:${encodeURIComponent(query)}`,
  CATEGORIES: 'categories:all',
  USER_CART: (userId: string) => `cart:${userId}`,
  USER_ORDERS: (userId: string) => `orders:${userId}`,
  ORDER_BY_ID: (id: string) => `order:${id}`,
  ANALYTICS_DAILY: (date: string) => `analytics:daily:${date}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  RATE_LIMIT: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  API_RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
};

export default cache;
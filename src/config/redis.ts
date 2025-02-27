import { RedisOptions } from 'ioredis'
import config from '../config/config'


export const redisConnection: RedisOptions = {
    host: config.REDIS_HOST || 'localhost',
    port: parseInt(config.REDIS_PORT as string) || 6379,
    enableAutoPipelining: true, 
}
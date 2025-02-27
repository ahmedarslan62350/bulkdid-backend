import Redis from 'ioredis'
import { redisConnection } from '../config/redis'

export const redis = new Redis({ ...redisConnection })
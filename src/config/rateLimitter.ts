import {  RateLimiterRedis } from 'rate-limiter-flexible'
import config from './config'
import { redisConnection } from './redis'
import Redis from 'ioredis'

export let rateLimitterRedis: RateLimiterRedis | null = null

const redisClient = new Redis(redisConnection)

export const initRateLimitter = () => {
    rateLimitterRedis = new RateLimiterRedis({
        storeClient: redisClient,
        points: parseInt(config.POINTS_PER_SECOND as string),
        duration: parseInt(config.DURATION as string)
    })
}

import { Connection } from 'mongoose'
import { RateLimiterMongo, RateLimiterRedis } from 'rate-limiter-flexible'
import config from './config'
import { redisConnection } from './redis'
import Redis from 'ioredis'

export let rateLimitterMongo: RateLimiterMongo | null = null
export let rateLimitterRedis: RateLimiterRedis | null = null

const redisClient = new Redis(redisConnection)

export const initRateLimitter = (mongooseConnection: Connection) => {
    rateLimitterMongo = new RateLimiterMongo({
        storeClient: mongooseConnection,
        points: parseInt(config.POINTS_PER_SECOND as string),
        duration: parseInt(config.DURATION as string)
    })
    rateLimitterRedis = new RateLimiterRedis({
        storeClient: redisClient,
        points: parseInt(config.POINTS_PER_SECOND as string),
        duration: parseInt(config.DURATION as string)
    })
}

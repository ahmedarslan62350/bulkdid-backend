/* eslint-disable @typescript-eslint/no-unsafe-return */
import Redis from 'ioredis'
import { redisConnection } from '../config/redis'

export const redis = new Redis({ ...redisConnection })

export class RedisStore {
    async sessionExists({ session }: { session: string }): Promise<boolean> {
        const exists = await redis.exists(`whatsapp:session:${session}`)
        return exists === 1
    }

    async save({ session }: { session: string }) {
        const data = await redis.get(`whatsapp:session:${session}`)
        if (data) {
            return JSON.parse(data)
        }
        return null
    }

    async delete({ session }: { session: string }) {
        return await redis.del(`whatsapp:session:${session}`)
    }

    async extract({ session, path }: { session: string; path: string }) {
        const data = await redis.get(`whatsapp:session:${session}`)
        if (data) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const jsonData = JSON.parse(data)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            return jsonData[path] || null
        }
        return null
    }
}

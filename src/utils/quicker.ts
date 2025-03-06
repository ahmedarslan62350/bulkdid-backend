import os from 'os'
import config from '../config/config'
import axios from 'axios'
import { IGeoIP } from '../types/types'
import { redis } from '../service/redisInstance'

const ipDetailsUrl = config.GEOLOCATION_API_URL || 'http://ip-api.com/json'

export default {
    getSystemDetails: () => {
        return {
            cpuUsage: os.loadavg(),
            totalmemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`
        }
    },

    getApplicationDetails: () => {
        return {
            environment: config.ENV,
            uptime: `${process.uptime().toFixed(2)} Seconds`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
            }
        }
    },
    extractStatusCode(callerId: string): number {
        const ans = callerId.length === 11 ? parseInt(callerId.slice(1, 4)) : parseInt(callerId.slice(0, 3))
        return Number(ans)
    },
    getIpDetails: async (ip: string): Promise<IGeoIP> => {
        const res = await axios.get(`${ipDetailsUrl}/${ip}`)
        return res.data as IGeoIP
    },
    getIndexByRedisValue: async (listKey: string, value: string) => {
        const list = await redis.lrange(listKey, 0, -1)

        const index = list.indexOf(value)

        return index !== -1 ? index : null
    }
}

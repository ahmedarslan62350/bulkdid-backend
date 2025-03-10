/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import os from 'os'
import config from '../config/config'
import axios from 'axios'
import { IGeoIP, IMongoDBStats } from '../types/types'
import { redis } from '../service/redisInstance'
import { databaseConnection } from '../service/databaseService'
import logger from './logger'

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
    },
    databeseDetails: async () => {
        try {
            if (databaseConnection) {
                const stats = await databaseConnection.db?.stats()
                const adminDb = databaseConnection.db?.admin()

                const info = await adminDb?.serverStatus()

                const infoStats: IMongoDBStats = {
                    version: info?.version || '',
                    uptime: info?.uptime || '', // in seconds
                    connections: {
                        current: info?.connections.current || 0,
                        available: info?.connections.available || 0
                    },
                    memoryUsage: {
                        resident: `${info?.mem.resident || 0} MB`, // Physical RAM used
                        virtual: `${info?.mem.virtual || 0} MB` // Virtual memory
                    },
                    network: {
                        bytesIn: `${((info?.network.bytesIn || 0) / 1024 / 1024).toFixed(2)} MB`,
                        bytesOut: `${((info?.network.bytesOut || 0) / 1024 / 1024).toFixed(2)} MB`,
                        numRequests: info?.network.numRequests || 0
                    },
                    operations: {
                        insert: info?.opcounters.insert || 0,
                        query: info?.opcounters.query || 0,
                        update: info?.opcounters.update || 0,
                        delete: info?.opcounters.delete || 0
                    },
                    storageEngine: info?.storageEngine?.name || ''
                }

                const obj = {
                    stats,
                    infoStats
                }

                return obj
            }
        } catch (error) {
            logger.error(error)
            return null
        }
    }
}

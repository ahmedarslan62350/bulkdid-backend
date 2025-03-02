import { NextFunction, Request, Response } from 'express'
import logger from '../utils/logger'
import { redis } from '../service/redisInstance'
import { IStore, StoreModel } from '../models/Store'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'

export interface IGeoIP {
    country: string
    countryCode: string
    region: string
    regionName: string
    city: string
    zip: string
    lat: number
    lon: number
    timezone: string
    isp: string
    org: string
}

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { storeId } = req.params
        const redisKey = `users:stores:${storeId}`
        let strStoreDets = await redis.get(redisKey)
        // If data is not in redis
        if (!strStoreDets) {
            const store = await StoreModel.findById(storeId)
            if (!store) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('store'))
                return
            }
            const strStore = JSON.stringify(store)
            await Promise.all([redis.set(redisKey, strStore), store.save()])
            strStoreDets = strStore
        }

        // If data is from redis
        const storeDets = JSON.parse(strStoreDets) as IStore
        let agent = storeDets.agents.find((agent) => agent.ip === req.ip)
        if (!agent) {
            agent = { ip: req.ip!, isAlowed: false }
            storeDets.agents.push(agent)
            await Promise.all([redis.set(redisKey, JSON.stringify(storeDets))])
        }

        if (!agent.isAlowed) {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }
        next()
    } catch (error) {
        logger.error(error)
    }
}

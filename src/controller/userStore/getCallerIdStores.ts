import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import { REDIS_CALLERID_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'
import { ICallerIdStore, IGetLengthByIndex } from '../../types/types'
import httpResponse from '../../utils/httpResponse'
import { CallerIdStoreModel } from '../../models/CallerIdStore'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const redisCallerIdStoresKey = REDIS_CALLERID_KEY(user.email)
        let redisCallerIdStores = await redis.lrange(redisCallerIdStoresKey, 0, -1)

        if (!redisCallerIdStores) {
            const stores = await CallerIdStoreModel.find({ ownerId: user._id })
            if (stores.length) {
                redisCallerIdStores = stores.map((store) => JSON.stringify(store))
                await redis.rpush(redisCallerIdStoresKey, ...redisCallerIdStores)
            }
        }

        const stores = redisCallerIdStores.map((store) => JSON.parse(store) as ICallerIdStore)
        const startNumber = Number(index) * Number(length)

        const callerIdStores = stores.slice(startNumber, startNumber + length)
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { callerIdStores })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

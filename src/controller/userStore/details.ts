import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import { REDIS_USERS_STORE_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'
import { StoreModel } from '../../models/Store'
import { IStore } from '../../types/types'
import httpResponse from '../../utils/httpResponse'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const redisStoreKey = REDIS_USERS_STORE_KEY(JSON.parse(JSON.stringify(user.store)) as string)

        let redisStore = await redis.get(redisStoreKey)
        if (!redisStore) {
            redisStore = JSON.stringify(await StoreModel.findById(user.store))
            await redis.set(redisStoreKey, redisStore)
        }

        const store = JSON.parse(redisStore) as IStore
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { store })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

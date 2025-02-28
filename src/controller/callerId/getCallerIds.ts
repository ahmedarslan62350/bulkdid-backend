import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import { CallerIdStoreModel, ICallerIdStore } from '../../models/CallerIdStore'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'

export interface IGetCallerIdsByStateName {
    stateName: string
}

export async function getAllCallerIds(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const callerIdsToSend = []
         const redisKey = `user:callerIds:${user.email}`
        const redisStores = await redis.lrange(redisKey, 0, -1)

        if (!redisStores.length) {
            const stores = await CallerIdStoreModel.find({ ownerId: user._id })
            if (!stores.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerIds'))
                return
            }
            for (const store of stores) {
                callerIdsToSend.push(...store.callerIds)
            }
            const strCallerIdStores = stores.map((e) => JSON.stringify(e))
            await redis.rpush(redisKey, ...strCallerIdStores)

            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, callerIdsToSend)
            return
        }

        for (const redisStore of redisStores) {
            const callerIdStore = JSON.parse(redisStore) as ICallerIdStore
            callerIdsToSend.push(...callerIdStore.callerIds)
        }
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, callerIdsToSend)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

export async function getCallerIdsByStateName(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const { stateName } = (await req.body) as IGetCallerIdsByStateName
        if (!stateName) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const callerIdsToSend: number[] = []
         const redisKey = `user:callerIds:${user.email}`
        const redisStores = await redis.lrange(redisKey, 0, -1)

        if (!redisStores.length) {
            const stores = await CallerIdStoreModel.find({ ownerId: user._id })
            if (!stores.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerIds'))
                return
            }

            const store = stores.find((store) => store.name === stateName)
            if (!store) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerIds for state name'))
                return
            }
            callerIdsToSend.push(...store.callerIds)

            const strCallerIdStores = stores.map((e) => JSON.stringify(e))
            await redis.rpush(redisKey, ...strCallerIdStores)

            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, callerIdsToSend)
            return
        }
        redisStores.forEach((redisStore) => {
            const store = JSON.parse(redisStore) as ICallerIdStore
            if (store.name === stateName) {
                callerIdsToSend.push(...store.callerIds)
            }
        })

        if (!callerIdsToSend.length) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerIds for state name'))
            return
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, callerIdsToSend)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

// PENDING implemment average response time in database

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import quicker from '../../utils/quicker'
import { CallerIdStoreModel, ICallerIdStore } from '../../models/CallerIdStore'
import { redis } from '../../service/redisInstance'

export default async function fetchCalllerId(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params
        if (!id) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const user = req.user!
        const stateCode = quicker.extractStatusCode(id)
        const redisKey = `users:${user.email}`
        const redisCallerIdStores = await redis.lrange(redisKey, 0, -1)

        if (!redisCallerIdStores.length) {
            const callerIdStores = await CallerIdStoreModel.find({ ownerId: user._id })
            if (!callerIdStores.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerId store'))
                return
            }
            const strCallerIdStores = callerIdStores.map((e) => JSON.stringify(e))
            const callerIdStore = callerIdStores.find((e) => e.statusCodes.includes(stateCode))!

            await redis.rpush(redisKey, ...strCallerIdStores)

            let callerIdToSend
            if (callerIdStore.index <= callerIdStore.callerIds.length - 1) {
                callerIdToSend = callerIdStore.callerIds[callerIdStore.index]
                callerIdStore.index++
            } else {
                callerIdToSend = callerIdStore.callerIds[0]
                callerIdStore.index = 1
            }

            callerIdStore.fetchRequests++
            await callerIdStore.save()

            httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
            return
        }
        const callerIdStores = redisCallerIdStores.map((e) => JSON.parse(e) as ICallerIdStore)
        const callerIdStore = callerIdStores.find((e) => e.statusCodes.includes(stateCode))!
        const index = callerIdStores.findIndex((store) => store._id === callerIdStore._id)

        let callerIdToSend

        if (callerIdStore.index <= callerIdStore.callerIds.length - 1) {
            callerIdToSend = callerIdStore.callerIds[callerIdStore.index]
            callerIdStore.index++
        } else {
            callerIdToSend = callerIdStore.callerIds[0]
            callerIdStore.index = 1
        }

        callerIdStore.fetchRequests++

        if (index !== -1) {
            await redis.lset(redisKey, index, JSON.stringify(callerIdStore))
        } else {
            await redis.rpush(redisKey, JSON.stringify(callerIdStore)) // If not found, add it
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        return
    }
}

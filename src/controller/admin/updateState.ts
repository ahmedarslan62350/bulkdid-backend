// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { StateModel } from '../../models/State'
import IUpdateStateBody, { IState } from '../../types/types'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { stateId, stateName, codes } = req.body as IUpdateStateBody

        const state = await StateModel.findByIdAndUpdate(stateId, { $set: { name: stateName, code: codes } }, { new: true })

        if (!state) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('state'))
            return
        }

        const strStates = await redis.lrange('STATES', 0, -1)

        for (const state of strStates) {
            const parsedState = JSON.parse(state) as IState
            if (JSON.stringify(parsedState._id) == stateId) {
                parsedState.name = stateName
                parsedState.statusCodes = [...codes]
                const index = await redis.lpos('STATES', state)
                await redis.lset('STATES', index as number, JSON.stringify(parsedState))
            }
        }

        await Promise.all([state.save()])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { state })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

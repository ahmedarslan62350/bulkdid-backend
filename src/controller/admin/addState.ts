// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { IAddNewStateBody } from '../../types/types'
import { StateModel } from '../../models/State'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { stateName, codes } = req.body as IAddNewStateBody
        if (!stateName || !codes) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }
        
        const state = new StateModel({
            name: stateName,
            statusCodes: [...codes]
        })

        await Promise.all([state.save(), redis.lpush('STATES', JSON.stringify({ name: stateName, statusCodes: [...codes] }))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { state })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

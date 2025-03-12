import { NextFunction, Request, Response } from 'express'
import { rateLimitterMongo, rateLimitterRedis } from '../config/rateLimitter'
import httpError from '../utils/httpError'
import responseMessage from '../constants/responseMessage'

export default (req: Request, _: Response, next: NextFunction) => {
    if (!rateLimitterRedis) {
        if (rateLimitterMongo) {
            rateLimitterMongo
                .consume(req.ip as string, 1)
                .then(() => {
                    next()
                })
                .catch(() => {
                    httpError(next, new Error(responseMessage.TOO_MANY_REQUESTS.message), req, responseMessage.TOO_MANY_REQUESTS.code)
                })
        }
    } else {
        rateLimitterRedis
            .consume(req.ip as string, 1)
            .then(() => {
                next()
            })
            .catch(() => {
                httpError(next, new Error(responseMessage.TOO_MANY_REQUESTS.message), req, responseMessage.TOO_MANY_REQUESTS.code)
            })
    }
}

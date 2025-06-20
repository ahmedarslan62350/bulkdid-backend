import { NextFunction, Request, Response } from 'express'
import { rateLimitterMongo, rateLimitterRedis } from '../config/rateLimitter'
import httpError from '../utils/httpError'
import responseMessage from '../constants/responseMessage'

export default (req: Request, _: Response, next: NextFunction) => {
    const rawIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp

    if (!ip) return httpError(next, new Error(responseMessage.BAD_REQUEST.message), req, responseMessage.BAD_REQUEST.code)

    if (!rateLimitterRedis) {
        if (rateLimitterMongo) {
            rateLimitterMongo
                .consume(ip, 1)
                .then(() => {
                    next()
                })
                .catch(() => {
                    httpError(next, new Error(responseMessage.TOO_MANY_REQUESTS.message), req, responseMessage.TOO_MANY_REQUESTS.code)
                })
        }
    } else {
        rateLimitterRedis
            .consume(ip, 1)
            .then(() => {
                next()
            })
            .catch(() => {
                httpError(next, new Error(responseMessage.TOO_MANY_REQUESTS.message), req, responseMessage.TOO_MANY_REQUESTS.code)
            })
    }
}

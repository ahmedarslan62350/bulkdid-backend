import { NextFunction, Response } from 'express'
import logger from '../utils/logger'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import jwtVerification from '../utils/jwtVerification'
import { Request } from 'express'
import { IAccessTokenData, IUser } from '../types/types'
import { REDIS_USER_KEY } from '../constants/redisKeys'
import { redis } from '../service/redisInstance'
import { UserModel } from '../models/User'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        if (!cookies) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const { token } = cookies
        if (!token) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const data = jwtVerification.verifyJWT(token as string) as IAccessTokenData
        if (!data) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'JWT has expired')
            return
        }

        if (!data.sessions.includes(req.ip as string)) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const redisKey = REDIS_USER_KEY(data.email)
        let strUser = await redis.get(redisKey)

        if (!strUser) {
            const userFromDB = await UserModel.findById(data._id)
            if (!userFromDB) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                return
            }

            strUser = JSON.stringify(userFromDB)
            await redis.set(redisKey, strUser)
        }

        const user = JSON.parse(strUser) as IUser
        if (user.isBlocked) {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }

        req.user = data
        next()
    } catch (error) {
        logger.error(error)
    }
}

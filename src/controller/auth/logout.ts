import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'
import { JwtPayload } from 'jsonwebtoken'
import jwtVerification from '../../utils/jwtVerification'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_KEY } from '../../constants/redisKeys'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        if (!cookies) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const { token } = cookies

        const decodedData = jwtVerification.verifyJWT(token as string) as JwtPayload
        if (!decodedData) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const user = await UserModel.findById(decodedData._id)
        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const ip = req?.ip ? req.ip : '127.0.0.1'
        user.sessions.splice(user.sessions.indexOf(ip) - 1, user.sessions.indexOf(ip))
        user.refreshToken = ''

        res.clearCookie('token')
        await Promise.all([user.save(), redis.del(REDIS_USER_KEY(user.email))])

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logout successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

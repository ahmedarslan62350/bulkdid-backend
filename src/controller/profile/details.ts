// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_KEY } from '../../constants/redisKeys'
import { UserModel } from '../../models/User'
import { IUser } from '../../types/types'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const redisUserKey = REDIS_USER_KEY(user.email)

        let redisUser = await redis.get(redisUserKey)
        if (!redisUser) {
            const dbUser = await UserModel.findById(user._id)
            if (!dbUser) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                return
            }

            redisUser = JSON.stringify(dbUser)
            await redis.set(redisUserKey, redisUser)
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, verifyCode, verifyCodeExpiry, verifyCodeUsed, refreshToken, ...userToSend } = JSON.parse(redisUser) as IUser

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { user: userToSend })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

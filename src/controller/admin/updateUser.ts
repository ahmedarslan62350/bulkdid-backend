// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_KEY } from '../../constants/redisKeys'
import { UserModel } from '../../models/User'
import { IUpdateUserBody, IUser } from '../../types/types'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { name, email, isVerified, sessions } = req.body as IUpdateUserBody
        if (!isVerified || !sessions || !email || !name) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.FIELD_REQUIRED('user'))
            return
        }

        const redisUserKey = REDIS_USER_KEY(email)
        let redisUser = await redis.get(redisUserKey)

        if (!redisUser) {
            const dbUser = await UserModel.findOneAndUpdate({ email }, { $set: { name, isVerified, sessions } }, { new: true })
            if (!dbUser) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                return
            }

            redisUser = JSON.stringify(dbUser)
            await redis.set(redisUserKey, redisUser)
        }

        const userToUpdate = JSON.parse(redisUser) as IUser

        const updatedUser = {
            ...userToUpdate,
            name,
            email,
            isVerified,
            sessions,
            updatedAt: new Date()
        }

        await redis.set(redisUserKey, JSON.stringify(updatedUser))

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, verifyCode, verifyCodeExpiry, verifyCodeUsed, refreshToken, ...userToSend } = userToUpdate

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { user: userToSend })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

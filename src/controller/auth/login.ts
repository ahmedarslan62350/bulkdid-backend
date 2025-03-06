import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'
import loginSchema from '../../validations/login.validation'
import { ILoginBody } from '../../types/types'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_KEY } from '../../constants/redisKeys'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const data = (await req.body) as ILoginBody
        if (!data) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const { email, password } = data
        if (!email || !password) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const result = loginSchema.safeParse(data)
        if (!result.success) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, result.error?.errors[0]?.message)
            return
        }

        const user = await UserModel.findOne({ email })
        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.EMAIL_INVALID)
            return
        }

        const isPasswordMatch = await user.comparePassword(password)
        if (!isPasswordMatch) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.PASSWORD_MISMATCH)
            return
        }

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        if (!accessToken || !refreshToken) {
            httpResponse(req, res, responseMessage.INTERNAL_SERVER_ERROR.code, 'Error signing jwt token')
            return
        }

        const ip = req?.ip ? req.ip : '127.0.0.1'

        res.cookie('token', accessToken)
        user.sessions.push(ip)

        await Promise.all([user.save(), redis.set(REDIS_USER_KEY(user.email), JSON.stringify(user))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logined successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

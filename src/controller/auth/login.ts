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
import config from '../../config/config'

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

        if (user.isBlocked) {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }

        if (user.loginAttempts >= Number(config.MAX_LOGIN_ATTEMPTS)) {
            const isSetTimeOutExixts = await redis.get(`MAX_LOGIN_ATTEMPTS:userIds:${user.email}`)
            if (!isSetTimeOutExixts) {
                setTimeout(
                    () => {
                        UserModel.findById(user._id)
                            .then(async (user) => {
                                if (!user) return
                                user.loginAttempts = 0
                                await user.save()
                            })
                            .catch((err) => {
                                logger.error(err)
                            })
                    },
                    1000 * Number(config.MAX_LOGIN_ATTEMPTS_TIMEOUT as string)
                )

                await redis.set(`MAX_LOGIN_ATTEMPTS:userIds:${user.email}`, '', 'EX', Number(config.MAX_LOGIN_ATTEMPTS))
            }

            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }

        const isPasswordMatch = await user.comparePassword(password)
        if (!isPasswordMatch) {
            user.loginAttempts += 1
            await user.save()
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

        res.cookie('token', accessToken, {
            sameSite: config.ENV === 'production' && config.IS_IN_HTTPS_MODE == 'true' ? 'none' : 'lax',
            secure: config.ENV === 'production' && config.IS_IN_HTTPS_MODE == 'true',
            httpOnly: false
        })
        res.cookie('refreshToken', refreshToken, {
            sameSite: config.ENV === 'production' && config.IS_IN_HTTPS_MODE == 'true' ? 'none' : 'lax',
            secure: config.ENV === 'production' && config.IS_IN_HTTPS_MODE == 'true',
            httpOnly: true
        })

        user.loginAttempts = 0
        if (!user.sessions.includes(ip)) {
            user.sessions.push(ip)
        }

        await Promise.all([user.save(), redis.set(REDIS_USER_KEY(user.email), JSON.stringify(user))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logined successfully',
            user
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

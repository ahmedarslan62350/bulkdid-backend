import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import jwt, { JwtPayload } from 'jsonwebtoken'
import config from '../../config/config'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'

export interface IVerify {
    verifyCode: string
    email: string
}

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        const { email: jwtEmail } = cookies
        const verifyCode = parseInt(req.query.verifyCode as string)

        if (!jwtEmail || !verifyCode) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const data = jwt.verify(jwtEmail as string, config.JWT_TOKEN_SECRET as string) as JwtPayload

        if (!data || !data.email) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const user = await UserModel.findOne({ email: data.email })

        if (!user) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, 'User not found')
            return
        }

        if (user.verifyCodeUsed >= 5) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'Verify code limit exceeded')
            return
        }

        if (user.verifyCode !== verifyCode) {
            user.verifyCodeUsed = user.verifyCodeUsed + 1
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'Verify code  does not match')
            return
        }

        res.cookie('email', null)

        user.isVerified = true
        user.verifyCodeExpiry = null
        user.verifyCode = null
        user.verifyCodeUsed = 0
        await user.save()

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

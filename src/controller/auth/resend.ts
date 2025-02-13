import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { JwtPayload } from 'jsonwebtoken'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'
import { emailQueue } from '../../queues/emailQueue'
import nodemailerHTML from '../../constants/nodemailerHTML'
import jwtVerification from '../../utils/jwtVerification'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        const { email: token } = cookies

        if (!token) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const data = jwtVerification.verifyJWT(token as string) as JwtPayload
        if (!data) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const user = await UserModel.findOne({ email: data.email })
        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        if (user.verifyCodeUsed >= 5) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, 'Verify code limit exceeded')
            return
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000)
        const html = nodemailerHTML.registerHTML(verifyCode)
        const subject = nodemailerHTML.subject(user.name)

        await emailQueue.add('sendVerifyCode', {
            email: user.email,
            subject,
            html
        })

        user.verifyCode = verifyCode
        user.verifyCodeUsed = user.verifyCodeUsed + 1
        user.verifyCodeExpiry = Date.now() + 120000
        await user.save()

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { message: 'Verification Code sent successfully' })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

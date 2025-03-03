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
        const verifyCode = parseInt(req.query.verifyCode as string)

        if (!token || !verifyCode) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const data = jwtVerification.verifyJWT(token as string) as JwtPayload

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
            setTimeout(
                () => {
                    void (async () => {
                        await UserModel.updateOne({ _id: user._id }, { $set: { verifyCodeUsed: 0 } })
                    })()
                },
                1000 * 60 * 10
            )
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'Verify code limit exceeded')
            return
        }

        if (user.verifyCode !== verifyCode) {
            user.verifyCodeUsed = user.verifyCodeUsed + 1
            await user.save()
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'Verify code does not match')
            return
        }

        if (user.verifyCodeExpiry && new Date(user.verifyCodeExpiry).getTime() < Date.now()) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, 'Verify code has expired')
            return
        }

        await emailQueue.add('sendVerifyCode', {
            email: user.email,
            subject: nodemailerHTML.subject(user.name),
            html: nodemailerHTML.verification(user.name)
        })

        res.clearCookie('email')

        user.isVerified = true
        user.verifyCodeExpiry = null
        user.verifyCode = null
        user.verifyCodeUsed = 0
        await user.save()

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'Email verified successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

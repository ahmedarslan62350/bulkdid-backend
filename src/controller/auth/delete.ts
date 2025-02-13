import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'
import { emailQueue } from '../../queues/emailQueue'
import nodemailerHTML from '../../constants/nodemailerHTML'
import jwtVerification from '../../utils/jwtVerification'
import { JwtPayload } from 'jsonwebtoken'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        const { token } = cookies

        if (!token) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const jwtResult = jwtVerification.verifyJWT(token as string) as JwtPayload
        if (!jwtResult) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const user = await UserModel.findByIdAndDelete(jwtResult._id)
        if(!user){
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        await emailQueue.add('sendDeleteAccountNotification', {
            email: user.email,
            subject: user.name,
            html: nodemailerHTML.deleteAccount(user.name)
        })

        res.clearCookie('token')
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logined successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

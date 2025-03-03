import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import httpResponse from '../../utils/httpResponse'
import { emailQueue } from '../../queues/emailQueue'
import nodemailerHTML from '../../constants/nodemailerHTML'
import jwtVerification from '../../utils/jwtVerification'
import updatePasswordSchema from '../../validations/updatePassowrd.schema'
import { JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { IUpdatePasswordBody } from '../../types/types'

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

        const data = (await req.body) as IUpdatePasswordBody
        if (!data) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const { confirmPassword, currentPassword, newPassword, logoutSessions } = data
        if (!confirmPassword || !currentPassword || !newPassword || !logoutSessions) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const result = updatePasswordSchema.safeParse(data)
        if (!result.success) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, result.error?.errors[0]?.message)
            return
        }

        const user = await UserModel.findById(jwtResult._id)
        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.EMAIL_INVALID)
            return
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isPasswordMatch) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.PASSWORD_MISMATCH)
            return
        }

        const ip = req?.ip ? req.ip : '127.0.0.1'
        user.password = newPassword

        if (logoutSessions === 'all') {
            user.sessions.splice(0, user.sessions.length - 1)
        } else {
            user.sessions.splice(user.sessions.indexOf(ip) - 1, user.sessions.indexOf(ip))
        }

        await Promise.all([
            user.save(),
            emailQueue.add('sendPasswordChangeNotification', {
                email: user.email,
                subject: user.name,
                html: nodemailerHTML.passwordChanged(user.name)
            })
        ])
        
        res.clearCookie('token')
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'Password changed successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

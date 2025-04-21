import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import httpResponse from '../../utils/httpResponse'
import jwtVerification from '../../utils/jwtVerification'
import { UserModel } from '../../models/User'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        const { refreshToken } = cookies
        if (!refreshToken) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const data = jwtVerification.verifyJWT(refreshToken as string) as { _id: string }
        if (!data) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const user = await UserModel.findById(data._id)
        if (!user) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
            return
        }

        const token = await user.generateAccessToken()
        res.cookie('token', token, {
            sameSite: config.ENV === 'production' ? 'none' : 'lax',
            secure: config.ENV === 'production',
            httpOnly: false
        })

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'Token refreshed successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

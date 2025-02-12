import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import config from '../../config/config'
import httpResponse from '../../utils/httpResponse'
import jwt, { JwtPayload } from 'jsonwebtoken'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const accessToken = req.cookies

        if (!accessToken) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }
        const { token } = accessToken

        const decodedData = jwt.verify(token as string, config.JWT_TOKEN_SECRET as string) as JwtPayload

        const user = await UserModel.findById(decodedData._id)

        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const ip = req?.ip ? req.ip : '127.0.0.1'
        user.sessions.splice(user.sessions.indexOf(ip) - 1, user.sessions.indexOf(ip))
        user.refreshToken = ''

        res.clearCookie('token')
        await user.save()

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logined successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

import { NextFunction, Response } from 'express'
import logger from '../utils/logger'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import jwtVerification from '../utils/jwtVerification'
import { Request } from 'express'
import { IAccessTokenData } from '../types/types'

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const cookies = req.cookies
        if (!cookies) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const { token } = cookies
        if (!token) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const data = jwtVerification.verifyJWT(token as string)
        if (!data) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        req.user = data as IAccessTokenData
        next()
    } catch (error) {
        logger.error(error)
    }
}

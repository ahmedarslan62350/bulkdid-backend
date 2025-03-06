import { NextFunction, Request, Response } from 'express'
import httpError from '../utils/httpError'
import responseMessage from '../constants/responseMessage'
import httpResponse from '../utils/httpResponse'

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        if (req.user?.role !== 'admin') {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }
        next()
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

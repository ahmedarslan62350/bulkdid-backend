import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import quicker from '../../utils/quicker'
import { IServerUsageBody } from '../../types/types'


export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { name } = req.body as IServerUsageBody
        if (!name) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.FIELD_REQUIRED('server name'))
            return
        }

        const response = await quicker.databeseDetails()
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { ...response })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

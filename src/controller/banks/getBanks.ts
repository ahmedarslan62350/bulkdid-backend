import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { BankModel } from '../../models/Bank'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const banks = await BankModel.find().select('-_id')
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { banks })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

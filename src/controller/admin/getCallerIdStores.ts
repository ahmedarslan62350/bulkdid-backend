import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGetLengthByIndex } from '../../types/types'
import { CallerIdStoreModel } from '../../models/CallerIdStore'

export default async function getAllCallerIdStores(req: Request, res: Response, next: NextFunction) {
    try {
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const callerIdStores = await CallerIdStoreModel.find()
        const paginatedCallerIdStores = callerIdStores.slice(index * length, index * length + length)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { callerIdStores: [...paginatedCallerIdStores] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

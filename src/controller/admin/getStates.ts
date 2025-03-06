import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGetLengthByIndex } from '../../types/types'
import { StateModel } from '../../models/State'

export default async function getAllStates(req: Request, res: Response, next: NextFunction) {
    try {
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const states = await StateModel.find()
        const paginatedStates = states.slice(index * length, index * length + length)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { states: [...paginatedStates] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGetLengthByIndex } from '../../types/types'
import { UserModel } from '../../models/User'

export default async function getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const users = await UserModel.find().select('-password -__v')
        const paginatedUsers = users.slice(index * length, index * length + length)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { users: [...paginatedUsers] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

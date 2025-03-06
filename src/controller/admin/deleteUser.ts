import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IDeleteUserBody } from '../../types/types'
import { UserModel } from '../../models/User'

export default async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = req.body as IDeleteUserBody

        const deletedUser = await UserModel.findByIdAndDelete(userId).select('-password -__v')

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { user: deletedUser })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

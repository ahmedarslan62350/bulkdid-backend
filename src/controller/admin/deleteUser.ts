import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IDeleteUserBody } from '../../types/types'
import { UserModel } from '../../models/User'
import { REDIS_USER_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'

export default async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { user } = req.body as IDeleteUserBody
        const userFromDB = await UserModel.findById(user._id)
        if (!userFromDB) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
            return
        }
        const redisKey = REDIS_USER_KEY(user.email)
        await Promise.all([await redis.del(redisKey), UserModel.findByIdAndDelete(user._id)])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { user })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

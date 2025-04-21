import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { UserModel } from '../../models/User'
import { REDIS_USER_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'
import { IBlockUserBody, IUser } from '../../types/types'

export default async function blockUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { user } = req.body as IBlockUserBody
        const redisKey = REDIS_USER_KEY(user.email)
        let strUser = await redis.get(redisKey)

        if (!strUser) {
            const userFromDB = await UserModel.findById(user._id)
            if (!user) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                return
            }
            strUser = JSON.stringify(userFromDB)
            await redis.set(redisKey, strUser)
        }

        const userObj = JSON.parse(strUser) as IUser
        userObj.isBlocked = true

        await redis.set(redisKey, JSON.stringify(userObj))

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { user })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_FILE_KEY } from '../../constants/redisKeys'
import { IFile } from '../../types/types'
import { FileModel } from '../../models/File'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const redisFileKey = REDIS_USER_FILE_KEY(user.email)

        let redisFiles = await redis.lrange(redisFileKey, 0, -1)

        if (!redisFiles.length) {
            const dbFiles = await FileModel.find({ ownerId: user._id })
            redisFiles = dbFiles.map((file) => JSON.stringify(file))
            await redis.rpush(redisFileKey, ...redisFiles)
        }

        const files = redisFiles.map((file) => JSON.parse(file) as IFile)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { files })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

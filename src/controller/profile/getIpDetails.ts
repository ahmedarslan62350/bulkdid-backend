import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGeoIP, IGetIpDetailsBody } from '../../types/types'
import quicker from '../../utils/quicker'
import { REDIS_IP_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { ip } = req.body as IGetIpDetailsBody

        if (!ip) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.FIELD_REQUIRED('ip'))
            return
        }

        const redisIPKey = REDIS_IP_KEY(ip)
        let ipDetails = await redis.get(redisIPKey)

        if (!ipDetails) {
            ipDetails = JSON.stringify(await quicker.getIpDetails(ip))
            await redis.set(redisIPKey, ipDetails, 'EX', 120)
        }

        const details = JSON.parse(ipDetails) as IGeoIP
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { details })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

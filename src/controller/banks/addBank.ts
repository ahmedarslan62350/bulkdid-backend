import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { BankModel } from '../../models/Bank'
import { IAddBankBody } from '../../types/types'
import config from '../../config/config'
import { redis } from '../../service/redisInstance'
import { REDIS_BANK_KEY } from '../../constants/redisKeys'

const height = Number(config.DEFAULT_BANK_ICON_HEIGHT)
const width = Number(config.DEFAULT_BANK_ICON_WIDTH)

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { accountHolderName, accountNumber, icon, iconHeight = height, iconWidth = width, name } = req.body as IAddBankBody
        if (!accountHolderName || !accountNumber || !name || !icon) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const redisBankKey = REDIS_BANK_KEY(name)
        const redisBank = await redis.get(redisBankKey)

        if (redisBank) {
            const prevBank = await BankModel.findOne({ name })
            if (prevBank) {
                httpResponse(req, res, responseMessage.BAD_REQUEST.code, `Bank with ${name} already exists.`)

                return
            }
        }

        const bank = new BankModel({
            name,
            accountHolderName,
            accountNumber,
            icon,
            iconHeight,
            iconWidth
        })

        await Promise.all([
            bank.save(),
            redis.set(redisBankKey, JSON.stringify({ name, accountHolderName, accountNumber, icon, iconHeight, iconWidth }))
        ])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

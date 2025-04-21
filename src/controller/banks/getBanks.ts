import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { BankModel } from '../../models/Bank'
import { REDIS_BANK_KEY } from '../../constants/redisKeys'
import { redis } from '../../service/redisInstance'
import { IBank } from '../../types/types'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const redisBankKey = REDIS_BANK_KEY('*')
        const redisBankKeys = await redis.keys(redisBankKey)
        let strBanks: string[] | null = []

        for (const key of redisBankKeys) {
            const redisBank = await redis.get(key)
            if (redisBank) strBanks.push(redisBank)
        }

        if (!strBanks.length) {
            const banks = await BankModel.find().select('-__v -createdAt -updatedAt')
            if (!banks.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('banks'))
                return
            }

            strBanks = banks.map((bank) => JSON.stringify(bank))
        }

        const banks = strBanks.map((bank) => JSON.parse(bank) as IBank)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { banks })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

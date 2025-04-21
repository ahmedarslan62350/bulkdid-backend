// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { REDIS_WALLET_KEY } from '../../constants/redisKeys'
import { IWallet } from '../../types/types'
import { WalletModel } from '../../models/Wallet'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const redisWalletKey = REDIS_WALLET_KEY(user.email)

        let redisWallet = await redis.get(redisWalletKey)

        if (!redisWallet) {
            const dbWallet = await WalletModel.findById(user.walletId)
            if (!dbWallet) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                return
            }

            redisWallet = JSON.stringify(dbWallet)
            await redis.set(redisWalletKey, redisWallet)
        }

        const wallet = JSON.parse(redisWallet) as IWallet

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { wallet })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue
// THE withdraw req route

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { WalletModel } from '../../models/Wallet'
import { TransactionModel } from '../../models/Transaction'
import { redis } from '../../service/redisInstance'
import { UserModel } from '../../models/User'
import { IDepositeAndWithdrawBody, IUser, IWallet } from '../../types/types'
import { REDIS_USER_KEY, REDIS_WALLET_KEY } from '../../constants/redisKeys'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        if (user.role !== 'admin') {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
            return
        }

        const { amount, comment = '', email } = req.body as IDepositeAndWithdrawBody
        if (!amount || !email) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const redisWalletKey = REDIS_WALLET_KEY(email)
        const redisUserKey = REDIS_USER_KEY(email)
        let redisWallet = await redis.get(redisWalletKey)
        if (!redisWallet) {
            let strRedisUser = await redis.get(redisUserKey)
            if (!strRedisUser) {
                const user = await UserModel.findOne({ email })
                if (!user) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                    return
                }
                strRedisUser = JSON.stringify(user)
                await redis.set(redisUserKey, strRedisUser)
            }
            const redisUser = JSON.parse(strRedisUser) as IUser
            redisWallet = JSON.stringify((await WalletModel.findById(redisUser.walletId)) as IWallet)
            await redis.set(redisWalletKey, redisWallet)
        }

        const wallet = JSON.parse(redisWallet) as IWallet

        const transaction = new TransactionModel({
            comment,
            walletId: wallet._id,
            amount,
            type: 'deposit',
            to: 'Admin',
            from: wallet.ownerId
        })

        wallet.BBT = wallet.balance
        const tax = (amount * Number(config.TRANSACTION_FEE_IN_PERCENT)) / 100
        wallet.balance += amount - tax
        wallet.BAT = wallet.balance
        wallet.totalTransactions++
        wallet.deposits++
        wallet.transactions.push(transaction._id)

        await Promise.all([transaction.save(), redis.set(redisWalletKey, JSON.stringify(wallet))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { WalletModel } from '../../models/Wallet'
import { TransactionModel } from '../../models/Transaction'
import { redis } from '../../service/redisInstance'
import { UserModel } from '../../models/User'
import { IDepositeAndWithdrawBody, IUser, IWallet } from '../../types/types'

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

        const redisWalletKey = `users:wallet:${email}`
        const redisUserKey = `users:${email}`
        const redisWallet = await redis.get(redisWalletKey)
        let wallet: IWallet
        if (!redisWallet) {
            const strRedisUser = await redis.get(redisUserKey)
            if (!strRedisUser) {
                const user = await UserModel.findOne({ email })
                if (!user) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                    return
                }
                await redis.set(redisUserKey, JSON.stringify(user))
                wallet = (await WalletModel.findById(user.walletId)) as IWallet
            }
            const redisUser = JSON.parse(strRedisUser as string) as IUser
            wallet = (await WalletModel.findById(redisUser.walletId)) as IWallet
        }

        wallet = JSON.parse(redisWallet as string) as IWallet
        if (wallet.balance < amount) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.NOT_FOUND.message('enough amount'))
            return
        }

        const transaction = new TransactionModel({
            comment,
            walletId: wallet._id,
            amount,
            type: 'withdraw',
            to: wallet.ownerId,
            from: 'Admin'
        })
        wallet.BBT = wallet.balance
        wallet.balance -= amount
        wallet.BAT = wallet.balance
        wallet.totalTransactions++
        wallet.withdraws++
        wallet.transactions.push(transaction._id)

        await Promise.all([transaction.save(), redis.set(redisWalletKey, JSON.stringify(wallet))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

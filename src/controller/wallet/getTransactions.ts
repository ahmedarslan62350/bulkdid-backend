import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { WalletModel } from '../../models/Wallet'
import { TransactionModel } from '../../models/Transaction'
import { redis } from '../../service/redisInstance'
import { REDIS_USERS_TRANSACTIONS_KEY, REDIS_WALLET_KEY } from '../../constants/redisKeys'
import { IGetLengthByIndex, ITransaction, IWallet } from '../../types/types'

export default async function getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user!
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const redisWalletKey = REDIS_WALLET_KEY(user.email)
        const redisTransactionKey = REDIS_USERS_TRANSACTIONS_KEY(user.email)

        let redisTransactions = await redis.lrange(redisTransactionKey, 0, -1)

        if (!redisTransactions.length) {
            let redisWallet = await redis.get(redisWalletKey)
            if (!redisWallet) {
                const wallet = await WalletModel.findById(user.walletId)
                if (!wallet) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user wallet'))
                    return
                }
                redisWallet = JSON.stringify(wallet)
                await redis.set(redisWalletKey, redisWallet)
            }

            const wallet = JSON.parse(redisWallet) as IWallet
            const transactionsFromDB = await TransactionModel.find({ walletId: wallet._id })

            if (!transactionsFromDB.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('transactions'))
                return
            }

            redisTransactions = transactionsFromDB.map((transaction) => JSON.stringify(transaction))
            await redis.rpush(redisTransactionKey, ...redisTransactions)
        }

        const startNumber = Number(index) * Number(length)
        const transactions: ITransaction[] = redisTransactions.map((transaction) => JSON.parse(transaction) as ITransaction)

        const paginatedTransactions = transactions.slice(startNumber, startNumber + Number(length))
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { transactions: [...paginatedTransactions] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

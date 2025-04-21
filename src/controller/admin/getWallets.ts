import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IGetLengthByIndex } from '../../types/types'
import { WalletModel } from '../../models/Wallet'
import { TransactionModel } from '../../models/Transaction'

export default async function getAllWallets(req: Request, res: Response, next: NextFunction) {
    try {
        const { index = 0, length = 10 } = req.body as IGetLengthByIndex

        const wallets = await WalletModel.find().populate({
            path: 'transactions',
            model: TransactionModel
        })
        const paginatedWallets = wallets.slice(index * length, index * length + length)

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { wallets: [...paginatedWallets] })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

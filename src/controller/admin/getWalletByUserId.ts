import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { WalletModel } from '../../models/Wallet'
import { TransactionModel } from '../../models/Transaction'

export default async function getUserStore(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = req.body as { userId: string }
        if (!userId) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.BAD_REQUEST.message)
            return
        }

        const wallet = await WalletModel.findOne({ ownerId: userId }).populate({
            path: 'transactions',
            model: TransactionModel
        });

        if (!wallet) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('store'))
            return
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { wallet })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

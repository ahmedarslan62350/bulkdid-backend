// import { NextFunction, Request, Response } from 'express'
// import httpError from '../../utils/httpError'
// import responseMessage from '../../constants/responseMessage'
// import httpResponse from '../../utils/httpResponse'
// import { WalletModel } from '../../models/Wallet'
// import { TransactionModel } from '../../models/Transaction'

// interface IBody {
//     comment: string
//     amount: number
//     walletId: string
// }

// export default async function getAllTransactions(req: Request, res: Response, next: NextFunction) {
//     try {
//         const user = req.user!

//         const wallet = await WalletModel.findById(user.walletId)
//         if (!wallet) {
//             httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
//             return
//         }
//         httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { transactions: [...wallet.transactions] })
//     } catch (error) {
//         httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
//     }
// }

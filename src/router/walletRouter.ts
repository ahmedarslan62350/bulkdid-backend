import { Router } from 'express'
import apiController from '../controller/apiController'

const walletRouter = Router()

walletRouter.route('/withdraw').post(apiController.withdraw)
walletRouter.route('/deposite').post(apiController.deposite)
walletRouter.route('/get-transactions').post(apiController.getAllTransactions)

export default walletRouter

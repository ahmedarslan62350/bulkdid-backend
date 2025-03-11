import { Router } from 'express'
import apiController from '../controller/apiController'
import isAdmin from '../middleware/isAdmin'
import { upload } from '../service/multer'

const walletRouter = Router()

walletRouter.route('/withdraw').post(isAdmin, apiController.withdraw)
walletRouter.route('/deposite').post(apiController.deposite)
walletRouter.route('/req-transaction').post(upload.single('image'),apiController.reqTransaction)
walletRouter.route('/get-transactions').post(isAdmin, apiController.getAllTransactions)

export default walletRouter

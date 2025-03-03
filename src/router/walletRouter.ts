import { Router } from 'express'
import apiController from '../controller/apiController'

const walletRouter = Router()

walletRouter.route('/withdraw').post(apiController.withdraw)
walletRouter.route('/deposite').post(apiController.deposite)

export default walletRouter

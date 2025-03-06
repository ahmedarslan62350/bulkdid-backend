import { Router } from 'express'
import apiController from '../controller/apiController'

const adminRouter = Router()

adminRouter.route('/get-all-users').post(apiController.getAllUsers)
adminRouter.route('/get-all-callerId-stores').post(apiController.getAllCallerIdStores)
adminRouter.route('/get-all-files').post(apiController.getAllFiles)
adminRouter.route('/get-all-states').post(apiController.getAllStates)
adminRouter.route('/get-all-wallets').post(apiController.getAllWallets)
adminRouter.route('/get-all-transactions').post(apiController.getAllTransactionsAdmin)
adminRouter.route('/update-state').post(apiController.updateState)
adminRouter.route('/update-user').post(apiController.updateUser)
adminRouter.route('/delete-user').post(apiController.deleteUser)
adminRouter.route('/add-state').post(apiController.addState)

export default adminRouter

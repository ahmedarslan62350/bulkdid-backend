import { Router } from 'express'
import apiController from '../controller/apiController'

const userStoreRouter = Router()

userStoreRouter.route('/details').post(apiController.details)
userStoreRouter.route('/get-callerId-stores').post(apiController.getCallerIdStores)
userStoreRouter.route('/update').post(apiController.update)

export default userStoreRouter

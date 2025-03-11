import { Router } from 'express'
import apiController from '../controller/apiController'
import isAdmin from '../middleware/isAdmin'

const bankRouter = Router()

bankRouter.route('/get-banks').get(apiController.getBanks)
bankRouter.route('/add-bank').post(isAdmin, apiController.addBank)

export default bankRouter

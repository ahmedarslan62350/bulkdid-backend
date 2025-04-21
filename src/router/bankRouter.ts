import { Router } from 'express'
import apiController from '../controller/apiController'
import isAdmin from '../middleware/isAdmin'
import isAuthenticated from '../middleware/isAuthenticated'

const bankRouter = Router()

bankRouter.route('/get-banks').get(isAuthenticated, apiController.getBanks)
bankRouter.route('/add-bank').post(isAuthenticated, isAdmin, apiController.addBank)

export default bankRouter

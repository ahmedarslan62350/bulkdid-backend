import { Router } from 'express'
import apiController from '../controller/apiController'
import ipDets from '../middleware/ipDets'
import isAuthenticated from '../middleware/isAuthenticated'

const callerIdRouter = Router()

callerIdRouter.route('/fetch/:storeId/:id').get(ipDets, apiController.fetchCalllerId)
callerIdRouter.route('/get-all-callerids').get(isAuthenticated, apiController.getAllCallerIds)
callerIdRouter.route('/get-callerids-by-statename').post(isAuthenticated, apiController.getCallerIdsByStateName)

export default callerIdRouter

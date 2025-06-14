import { Router } from 'express'
import apiController from '../controller/apiController'
import ipDets from '../middleware/ipDets'
import isAuthenticated from '../middleware/isAuthenticated'
import rateLimit from '../middleware/rateLimit'

const callerIdRouter = Router()

callerIdRouter.route('/fetch/:storeId/:id').get(ipDets, apiController.fetchCalllerId)
callerIdRouter.route('/get-all-callerids').get(rateLimit, isAuthenticated, apiController.getAllCallerIds)
callerIdRouter.route('/get-callerids-by-statename').post(rateLimit, isAuthenticated, apiController.getCallerIdsByStateName)

export default callerIdRouter

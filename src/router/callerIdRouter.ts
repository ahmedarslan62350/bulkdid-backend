import { Router } from 'express'
import apiController from '../controller/apiController'
import ipDets from '../middleware/ipDets'

const callerIdRouter = Router()

callerIdRouter.route('/fetch/:storeId/:id').get(ipDets ,apiController.fetchCalllerId)
callerIdRouter.route('/get-all-callerids').get(apiController.getAllCallerIds)
callerIdRouter.route('/get-callerids-by-statename').post(apiController.getCallerIdsByStateName)

export default callerIdRouter

import { Router } from 'express'
import apiController from '../controller/apiController'

const callerIdRouter = Router()

callerIdRouter.route('/fetch/:id').post(apiController.fetchCalllerId)
callerIdRouter.route('/get-all-callerids').get(apiController.getAllCallerIds)
callerIdRouter.route('/get-callerids-by-statename').post(apiController.getCallerIdsByStateName)

export default callerIdRouter

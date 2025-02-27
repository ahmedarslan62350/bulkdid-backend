import { Router } from 'express'
import apiController from '../controller/apiController'

const callerIdRouter = Router()

callerIdRouter.route('/fetch/:id').post(apiController.fetchCalllerId)

export default callerIdRouter

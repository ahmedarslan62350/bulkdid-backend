import { Router } from 'express'
import apiController from '../controller/apiController'

const serverRouter = Router()

serverRouter.route('/details').post(apiController.usage)

export default serverRouter

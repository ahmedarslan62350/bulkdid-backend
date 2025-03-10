import { Router } from 'express'
import apiController from '../controller/apiController'

const analyticsRouter = Router()

analyticsRouter.route('/files').post(apiController.fileAnalytics)
analyticsRouter.route('/users').post(apiController.userAnalytics)
analyticsRouter.route('/transactions').post(apiController.transactionAnalytics)
analyticsRouter.route('/dids').post(apiController.didsAnalytics)
analyticsRouter.route('/fetch-dids').post(apiController.fetchDidsAnalytics)
analyticsRouter.route('/logs/info').post(apiController.infoLogs)
analyticsRouter.route('/logs/error').post(apiController.errorLogs)

export default analyticsRouter

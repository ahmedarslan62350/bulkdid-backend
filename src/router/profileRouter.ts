import { Router } from 'express'
import apiController from '../controller/apiController'

const profileRouter = Router()

profileRouter.route('/get-profile').get(apiController.getProfile)
profileRouter.route('/get-files').get(apiController.getMyFiles)
profileRouter.route('/update').post(apiController.updateProfile)
profileRouter.route('/get-ip-details').post(apiController.getIpDetails)

export default profileRouter

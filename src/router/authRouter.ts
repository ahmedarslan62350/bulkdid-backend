import { Router } from 'express'
import apiController from '../controller/apiController'

const authRouter = Router()

authRouter.route('/register').post(apiController.register)
authRouter.route('/verify').post(apiController.verify)
authRouter.route('/resend').post(apiController.resend)
authRouter.route('/login').post(apiController.login)
authRouter.route('/refresh').get(apiController.refresh)
authRouter.route('/logout').post(apiController.logout)
authRouter.route('/update-password').post(apiController.updatePassword)
authRouter.route('/delete-account').post(apiController._delete)

export default authRouter
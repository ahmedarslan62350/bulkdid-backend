import { Router } from 'express'
import apiController from '../controller/apiController'
import rateLimit from '../middleware/rateLimit'

const router = Router()

router.route('/self').get(rateLimit, apiController.self)
router.route('/health').get(apiController.health)
router.route('/auth/register').post(apiController.register)
router.route('/auth/verify').post(apiController.verify)
router.route('/auth/resend').post(apiController.resend)
router.route('/auth/login').post(apiController.login)
router.route('/auth/logout').post(apiController.logout)
router.route('/auth/update-password').post(apiController.updatePassword)
router.route('/auth/delete-account').post(apiController._delete)

export default router

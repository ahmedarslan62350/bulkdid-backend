import { Router } from 'express'
import apiController from '../controller/apiController'
import { upload } from '../service/multer'
import fileOperationBeforeSave from '../middleware/fileOperationBeforeSave'

const fileRouter = Router()

fileRouter.route('/upload').post(upload.single('file'), fileOperationBeforeSave.processFileBeforeSave, apiController._delete)

export default fileRouter

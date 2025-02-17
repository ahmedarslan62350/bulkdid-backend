import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import httpResponse from '../../utils/httpResponse'
import { join } from 'path'
import { UserModel } from '../../models/User'
import fs from 'fs'
import { FileModel } from '../../models/File'
import { StoreModel } from '../../models/Store'
import { callerIdQueue } from '../../queues/storeCallerIdsToDBQueue'

export interface IFile {
    role: string
}

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { role } = (await req.body) as IFile
        const file = req.file
        const callerIds = req.file?.callerIds

        if (!file || !callerIds || !role) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const user = await UserModel.findById(req.user?._id)
        if (!user) {
            httpResponse(req, res, responseMessage.UNAUTHORIZED.code, responseMessage.UNAUTHORIZED.message)
            return
        }

        const SFile = new FileModel({
            // SFILE : SFile stands for StoreFile that stored to database
            ownerId: user._id,
            name: file.originalname,
            path: null,
            callerIds: callerIds.length,
            size: file.size,
            state: 'pending',
            type: file.mimetype.split('/')[1],
            role
        })

        if (role === 'checking-status' || role === 'both') {
            // CHECKING HANDLER e.g: handler(callerIDs).then(function){ ALL_THAT_BELOW }
            const pathToFileStore = join(__dirname, '../uploads', JSON.stringify(user._id))
            const SFilePath = join(pathToFileStore, `${Date.now()}-${file.originalname}`)

            if (!fs.existsSync(pathToFileStore)) {
                fs.mkdirSync(pathToFileStore, { recursive: true })
            }
            // NOT_THIS_FILE_BUT_CHECKED_CALLERIDS
            fs.writeFileSync(SFilePath, file.buffer)
            SFile.path = SFilePath
        }

        if (role === 'fetching' || role === 'both') {
            // Fetching logic
            const store = await StoreModel.findById(user.store)
            if (!store) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.SERVICE_UNAVAILABLE.message)
                return
            }
            // Creating and managing callerIdStores for specfic state
            await callerIdQueue.add('process-caller-ids', { callerIds, userId: user._id })
            store.files.push(SFile._id)
            store.callerIds += callerIds.length
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'File successfully uploaded'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

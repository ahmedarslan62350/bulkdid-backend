import { NextFunction, Response, Request } from 'express'
import { UserModel } from '../../models/User'
import { FileModel, IFile as IFileModel } from '../../models/File'
import { callerIdQueue } from '../../queues/storeCallerIdsToDBQueue'
import { StoreModel } from '../../models/Store'
import { WalletModel } from '../../models/Wallet'
import path, { join } from 'path'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import httpResponse from '../../utils/httpResponse'
import config from '../../config/config'
import fs from 'fs'

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

        const wallet = await WalletModel.findById(user.walletId)
        if (!wallet) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user wallet'))
            return
        }

        const SFile: IFileModel = new FileModel({
            // SFILE : SFile stands for StoreFile that stored to database
            ownerId: user._id,
            name: file.originalname,
            path: '',
            totalCallerIds: callerIds.length,
            size: file.size,
            state: 'pending',
            type: path.extname(file.originalname),
            role,
            callerIds: [...callerIds]
        })

        if (role === 'checking-status' || role === 'both') {
            const totalCost = callerIds.length * Number(config.COST_PER_CALLERID_CHECK)
            if (wallet.balance < totalCost) {
                httpResponse(req, res, responseMessage.SERVICE_UNAVAILABLE.code, 'You have no balance available for this operation')
                return
            }
            wallet.balance -= totalCost
            const store = await StoreModel.findById(user.store)
            if (!store) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.SERVICE_UNAVAILABLE.message)
                return
            }
            // CHECKING HANDLER e.g: handler(callerIDs).then(function){ ALL_THAT_BELOW }
            const pathToFileStore = join(__dirname, '../../../../uploads')
            const SFilePath = join(pathToFileStore, `${Date.now()}-${file.originalname}`)

            if (!fs.existsSync(pathToFileStore)) {
                fs.mkdirSync(pathToFileStore, { recursive: true })
            }
            // NOT_THIS_FILE_BUT_CHECKED_CALLERIDS
            fs.writeFileSync(SFilePath, file.buffer)
            SFile.path = SFilePath
            store.files.push(SFile._id)
            store.callerIds = store.callerIds + callerIds.length
            await Promise.all([store.save(), SFile.save(), wallet.save()])
        }

        if (role === 'fetching' || role === 'both') {
            // Fetching logic
            const store = await StoreModel.findById(user.store)
            if (!store) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.SERVICE_UNAVAILABLE.message)
                return
            }
            // Creating and managing callerIdStores for specfic state
            // handeling double updating mongodb schemas in file-type both
            store.files.push(SFile._id)
            store.callerIds = store.callerIds + callerIds.length
            await Promise.all([store.save(), SFile.save(), callerIdQueue.add('process-caller-ids', { callerIds, userId: user._id, user })])
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

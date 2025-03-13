import { NextFunction, Response, Request } from 'express'
import { UserModel } from '../../models/User'
import { FileModel } from '../../models/File'
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
import { IFileBody, IFile as IFileModel } from '../../types/types'
import moment from 'moment'
import { Types } from 'mongoose'
import { handleDidsRes } from '../../utils/handelChecking'
import { writeNoromboFile } from '../../utils/writeNoromboFile'

const filePath = path.join(__dirname, '..', '..', '..', '..', './uploads')

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { role } = (await req.body) as IFileBody
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

        const todayStart = moment().startOf('day').toDate()
        const todayEnd = moment().endOf('day').toDate()

        const store = await StoreModel.findOne({ _id: user.store }).populate({
            path: 'files',
            match: { createdAt: { $gte: todayStart, $lte: todayEnd } },
            model: FileModel
        })

        if (!store) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user store'))
            return
        }

        const todayFiles = store.files.filter((file) => {
            if (!(file instanceof Types.ObjectId) && '_id' in file) {
                return file._id
            }

            return false // Skip ObjectIds
        })

        if (todayFiles.length >= Number(config.MAX_FILES)) {
            httpResponse(req, res, responseMessage.SERVICE_UNAVAILABLE.code, responseMessage.SERVICE_UNAVAILABLE.message)
            return
        }

        const wallet = await WalletModel.findById(user.walletId)
        if (!wallet) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user wallet'))
            return
        }

        const SFile: IFileModel = new FileModel({
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
            const SFilePath = join(filePath, `${Date.now()}-${file.originalname}`)
            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true })
            }
            fs.writeFileSync(SFilePath, file.buffer)
            SFile.path = SFilePath

            store.files.push(SFile._id)
            store.callerIds = store.callerIds + callerIds.length

            handleDidsRes(file.callerIds as string[])
                .then(async (res) => {
                    const pathToSave = `${filePath}/${Date.now()}-${file.originalname}_completed.xlsx`
                    const response = await writeNoromboFile(res, pathToSave)
                    if (!response) {
                        logger.error('Someting went worng while writing the file after checking all the callerIds')
                        return
                    }

                    SFile.state = 'completed'
                    SFile.path = pathToSave
                    await SFile.save()

                    logger.info(`Successfully written the file to path ${pathToSave}`)
                })
                .catch((err) => {
                    logger.error(err)
                })

            await Promise.all([store.save(), SFile.save(), wallet.save()])
        }

        if (role === 'fetching' || role === 'both') {
            store.files.push(SFile._id)
            store.callerIds = store.callerIds + callerIds.length
            await Promise.all([store.save(), callerIdQueue.add('process-caller-ids', { callerIds, userId: user._id, user })])
        }

        await SFile.save()
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'File successfully uploaded'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

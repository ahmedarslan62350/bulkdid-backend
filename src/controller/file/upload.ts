import { NextFunction, Response, Request } from 'express'
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
import { IAccessTokenData, IFileBody, IFile as IFileModel } from '../../types/types'
import moment from 'moment'
import { Types } from 'mongoose'
import { REDIS_USER_FILE_KEY } from '../../constants/redisKeys'
import { fileProcessingQueue } from '../../queues/fileProcessingQueue'
import { redis } from '../../service/redisInstance'

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

        const user = req.user as IAccessTokenData
        const redisFileKey = REDIS_USER_FILE_KEY(user.email)

        if (!user.isAllowedToFetch && (role === 'both' || role === 'fetching')) {
            httpResponse(req, res, responseMessage.FORBIDDEN.code, responseMessage.FORBIDDEN.message)
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

        if (role === 'checking' || role === 'both') {
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

            await Promise.all([store.save(), SFile.save(), wallet.save()])

            await fileProcessingQueue.add('process-file-job', {
                callerIds,
                filePath: SFilePath,
                redisFileKey,
                SFileId: SFile._id,
                fileOriginalname: file.originalname
            })

        }

        if (role === 'fetching' || role === 'both') {
            store.files.push(SFile._id)
            store.callerIds = store.callerIds + callerIds.length
            await Promise.all([store.save(), callerIdQueue.add('process-caller-ids', { callerIds, userId: user._id, user })])
        }

        await Promise.all([SFile.save(), redis.lpush(redisFileKey, JSON.stringify(SFile))])
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'File successfully uploaded'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

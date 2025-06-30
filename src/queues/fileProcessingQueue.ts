import { Queue, Worker } from 'bullmq'
import { redisConnection } from '../config/redis'
import logger from '../utils/logger'
import { FileModel } from '../models/File' // Mongoose model
import { IFile, IFileProcessingJob } from '../types/types'
import { handleDidsRes } from '../utils/handelChecking'
import { writeNoromboFile } from '../utils/writeNoromboFile'
import { redis } from '../service/redisInstance'

export const fileProcessingQueue = new Queue('process-file', { connection: redisConnection })

export const fileProcessingWorker = new Worker(
    'process-file',
    async (job) => {
        const { callerIds, filePath, SFileId, redisFileKey } = job.data as IFileProcessingJob

        try {
            logger.info(`Processing file job for ID: ${SFileId}`)

            const res = await handleDidsRes(callerIds)
            const pathToSave = `${filePath}_completed.xlsx`
            const response = await writeNoromboFile(res, pathToSave)

            if (!response) {
                logger.error('❌ Failed to write output file.')
                return
            }

            const SFile = await FileModel.findById(SFileId)
            if (!SFile) {
                logger.error(`❌ File with ID ${SFileId} not found in DB`)
                return
            }

            try {
                const redisFile = await redis.get(redisFileKey)
                if (redisFile) {
                    const file = JSON.parse(redisFile) as IFile
                    file.state = 'completed'
                    file.path = pathToSave
                    await redis.set(redisFileKey, JSON.stringify(file))
                }
            } catch (error: unknown) {
                const err = error as Error
                logger.error('No file in redis', err)
            }

            SFile.state = 'completed'
            SFile.path = pathToSave

            await SFile.save()
                .then(() => logger.info(`✅ Saved SFile to DB for ID: ${SFileId}`))
                .catch((err) => logger.error(`❌ Failed to save SFile`, err))
        } catch (err) {
            logger.error(`Unhandled worker error`, err)
        }
    },
    {
        connection: redisConnection
    }
)

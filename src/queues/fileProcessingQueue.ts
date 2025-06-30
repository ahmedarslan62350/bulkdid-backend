import { Queue, Worker } from 'bullmq'
import { redisConnection } from '../config/redis'
import logger from '../utils/logger'
import { FileModel } from '../models/File' // Mongoose model
import { IFileProcessingJob } from '../types/types'
import { handleDidsRes } from '../utils/handelChecking'
import { writeNoromboFile } from '../utils/writeNoromboFile'

export const fileProcessingQueue = new Queue('process-file', { connection: redisConnection })

export const fileProcessingWorker = new Worker(
    'process-file',
    async (job) => {
        const { callerIds, filePath, SFileId } = job.data as IFileProcessingJob

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
        connection: redisConnection,
    }
)

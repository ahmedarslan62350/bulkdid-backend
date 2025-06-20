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
        const { callerIds, filePath, redisFileKey, SFileId } = job.data as IFileProcessingJob

        try {
            const res = await handleDidsRes(callerIds)

            const pathToSave = `${filePath}_completed.xlsx`

            const response = await writeNoromboFile(res, pathToSave)
            if (!response) {
                logger.error('Something went wrong while writing the file after checking callerIds')
                return
            }

            const SFile = await FileModel.findById(SFileId)
            if (!SFile) throw new Error('File document not found')
            const files = await redis.lrange(redisFileKey, 0, -1)
            const index = files?.findIndex((f) => JSON.stringify((JSON.parse(f) as IFile)._id) == SFileId)
            if (index && index !== -1) {
                await redis.lset(redisFileKey, index, JSON.stringify(SFile))
            }

            SFile.state = 'completed'
            SFile.path = pathToSave
            await Promise.all([SFile.save()])

            logger.info(`Successfully written file to path ${pathToSave}`)
        } catch (error) {
            logger.error('Failed to process file in worker', { error })
        }
    },
    { connection: redisConnection }
)

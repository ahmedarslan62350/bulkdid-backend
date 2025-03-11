import { Queue, Worker } from 'bullmq'
import { redisConnection } from '../config/redis'
import logger from '../utils/logger'

// Define Queue
export const fileProcessingQueue = new Queue('process-file', { connection: redisConnection })

// Define Worker
export const fileProcessingWorker = new Worker(
    'process-file',
    // eslint-disable-next-line @typescript-eslint/require-await
    async (job) => {
        try {
            // eslint-disable-next-line no-console
            console.log(job)
        } catch (error) {
            logger.error('Failed to save caller IDs to database', { error })
            throw new Error('Caller ID processing failed')
        }
    },
    { connection: redisConnection }
)

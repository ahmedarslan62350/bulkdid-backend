import { Queue, Worker, Job } from 'bullmq'
import logger from '../utils/logger'
import { redisConnection } from '../config/redis'
import sendFileToWhatsApp from '../utils/sendFileToWhatsApp'
import { IWhatsAppJobData } from '../types/types'

export const whatsappQueue = new Queue('send-whatsapp-image', { connection: redisConnection })

export const whatsappWorker = new Worker(
    'send-whatsapp-image',
    async (job: Job) => {
        try {
            const {image, imagePath, recipientNumber, user } = job.data as IWhatsAppJobData
            await sendFileToWhatsApp(image, imagePath, recipientNumber, user)
            logger.info(`WhatsApp image sent successfully for user: ${user.email}`)
        } catch (error) {
            logger.error(`Error processing WhatsApp image job:`, error)
            throw error
        }
    },
    { connection: redisConnection }
)

import { Queue, Worker } from 'bullmq'
import logger from '../utils/logger'
import transporter from '../service/nodeMailer'
import { redisConnection } from '../config/redis'
import { IEmailJob } from '../types/types'

export const emailQueue = new Queue('send-email', { connection: redisConnection })

export const emailWorker = new Worker(
    'send-email',
    async (job) => {
        const data = job.data as IEmailJob | null

        if (!data) {
            logger.error('EMAIL_WORKER', { message: 'No data provided in email job' })
            throw new Error('No email job provided in email job')
        }

        const { email, html, subject } = data

        try {
            await transporter.sendMail({
                from: `no-reply`,
                to: email,
                subject: subject,
                html: html
            })
            logger.info('EMAIL_WORKER', { message: `Email sent to ${email} successfully` })
        } catch (error) {
            logger.error('EMAIL_WORKER', { message: 'Failed to send email', error })
            throw new Error('Failed to send email')
        }
    },
    { connection: redisConnection }
)

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IReqTransactionBody } from '../../types/types'
import { whatsappClient } from '../../app'
import path from 'path'
import config from '../../config/config'
import fs from 'fs/promises'
import { whatsappQueue } from '../../queues/whatsAppQueue'

export default async function handleTransaction(req: Request, res: Response, next: NextFunction) {
    try {
        const { type } = req.body as IReqTransactionBody
        const image = req.file as Express.Multer.File

        if (!type) {
            return httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('transaction type'))
        }

        const user = req.user!

        if (image && config.WHATSAPP_SERVICE_ENABLED === 'true') {
            const basePath = config.ENV === 'development' ? '../../../uploads' : '../../../../uploads'
            const imagePath = path.join(__dirname, basePath, `${Date.now()}-${image.originalname}`)

            await fs.writeFile(imagePath, image.buffer)

            await whatsappQueue.add('send-image', {
                req,
                next,
                image,
                imagePath,
                whatsappClient,
                recipientNumber: config.WHATSAPP_RECEPENT_NUMBER!,
                user
            })
        }

        return httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

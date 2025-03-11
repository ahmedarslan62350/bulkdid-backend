import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IReqTransactionBody } from '../../types/types'
import { whatsappClient } from '../../app'
import sendFileToWhatsApp from '../../utils/sendFileToWhatsApp'
import path from 'path'
import config from '../../config/config'
import fs from 'fs'
import logger from '../../utils/logger'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { type } = req.body as IReqTransactionBody
        const image = req.file as Express.Multer.File

        if (!type) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('transaction type'))
            return
        }

        const user = req.user!
        
        if (image && config.WHATSAPP_SERVICE_ENABLED == 'true') {
            const imagePath = path.join(__dirname, '..', '..', '..', './uploads', `${Date.now()}-${image.originalname}`)
            fs.writeFile(imagePath, image.buffer, (err) => logger.error(err))

            if (whatsappClient) {
                await sendFileToWhatsApp(req, next, image, imagePath, whatsappClient, config.WHATSAPP_RECEPENT_NUMBER!, user)
            }
        }
        
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

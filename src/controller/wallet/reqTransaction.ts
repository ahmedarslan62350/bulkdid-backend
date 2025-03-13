import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { IReqTransactionBody } from '../../types/types'
import path from 'path'
import config from '../../config/config'
import fs from 'fs/promises'
import axios from 'axios'

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
            
            const url = `${config.WHATSAPP_SERVER_URL!}/api/v1/send-image`
            await fs.writeFile(imagePath, image.buffer)
            
            await axios.post(url, {
                imagePath,
                user,
                recipientNumber: config.WHATSAPP_RECEPENT_NUMBER
            })
        }

        return httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

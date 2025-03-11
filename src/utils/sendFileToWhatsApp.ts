import { NextFunction, Request } from 'express'
import httpError from './httpError'
import logger from './logger'
import { Client, MessageMedia } from 'whatsapp-web.js'
import { IAccessTokenData } from '../types/types'
import fs from 'fs/promises'
import responseMessage from '../constants/responseMessage'

export default async function (
    req: Request,
    next: NextFunction,
    image: Express.Multer.File,
    imageFilePath: string,
    client: Client,
    recipient: string,
    data: IAccessTokenData
) {
    try {
        const fileData = await fs.readFile(imageFilePath)

        const base64Data = fileData.toString('base64')
        const mimeType = image.mimetype || 'image/jpeg'

        const media = new MessageMedia(mimeType, base64Data, image.originalname)

        logger.info(`Sending image to ${recipient}@c.us`)

        const formattedMessage = `
                        📌 *User Details* 📌
                        ----------------------------
                        🆔 *ID:* ${JSON.stringify(data._id)}
                        👤 *Name:* ${data.name}
                        📧 *Email:* ${data.email}
                        🛠 *Role:* ${data.role}
                        ✅ *Verified:* ${data.isVerified ? 'Yes' : 'No'}
                        🏪 *Store ID:* ${JSON.stringify(data.store)}
                        💰 *Wallet ID:* ${JSON.stringify(data.walletId)}
                        ----------------------------
                    `

        const response = await client.sendMessage(`${recipient}@c.us`, media, {
            caption: `User details : 
                      ${formattedMessage}
                     `
        })

        logger.info(`Image sent to ${recipient}@c.us`, response)

        return true
    } catch (error) {
        logger.error(error)
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

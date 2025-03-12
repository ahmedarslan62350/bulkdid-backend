/* eslint-disable no-console */
import logger from './logger'
import { MessageMedia } from 'whatsapp-web.js'
import { IAccessTokenData } from '../types/types'
import fs from 'fs/promises'
import { whatsappClient } from '../config/whatsappClient'

export default async function (image: Express.Multer.File, imageFilePath: string, recipient: string, data: IAccessTokenData) {
    try {
        console.log('WHATS_APP_CLIENT_CALLED')

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

        if (whatsappClient) {
            const response = await whatsappClient.sendMessage(`${recipient}@c.us`, media, {
                caption: `User details : ${formattedMessage}`
            })
            logger.info(`Image sent to ${recipient}@c.us`, response)
        }

        return true
    } catch (error) {
        console.log(error)
        logger.error(error)
        return false
    }
}

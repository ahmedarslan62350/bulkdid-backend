import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import logger from '../utils/logger'

export default async function CreateClient() {
    try {
        const client = new Client({
            webVersion: '2.2407.3',
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true, 
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        })
        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true })
            // eslint-disable-next-line no-console
            console.log('Scan the QR code to log in.', qr)
        })

        client.on('ready', () => {
            logger.info('WhatsApp client is ready!')

            client
                .getChats()
                .then((chats) => {
                    logger.info('Available WIDs:')
                    chats.forEach((chat) => {
                        logger.info(`- ${chat.id._serialized}`)
                    })
                })
                .catch((err) => {
                    logger.error('Failed to retrieve WIDs:', err)
                })
        })

        client.on('auth_failure', () => {
            logger.error('Authentication failed. Please scan the QR code again.')
        })

        client.on('disconnected', () => {
            logger.info('WhatsApp client disconnected.')
            // Optionally, you can call client.initialize() here to reinitialize
        })

        await client.initialize()
        return client
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        logger.error(error)
        return null
    }
}

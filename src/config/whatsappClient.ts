/* eslint-disable no-console */
import { Client, RemoteAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import logger from '../utils/logger'
import { redis, RedisStore } from '../service/redisInstance'

const store = new RedisStore()
export let whatsappClient: Client | null = null

export async function CreateClient() {
    try {
        if (whatsappClient) {
            console.log('WhatsApp Client already initialized, skipping...')
            return whatsappClient
        }

        const sessionId = `session_${Math.random().toString(36).substring(2, 15)}`
        whatsappClient = new Client({
            authStrategy: new RemoteAuth({
                clientId: sessionId,
                dataPath: './sessions',
                backupSyncIntervalMs: 300000,
                store
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        })

        await whatsappClient.initialize()

        whatsappClient.on('qr', (qr) => {
            qrcode.generate(qr, { small: true })
            console.log('Scan the QR code to log in.')
            logger.info('Scan the QR code to log in.')
        })

        whatsappClient.on('authenticated', (session) => {
            redis
                .set(`whatsapp:session:${sessionId}`, JSON.stringify(session))
                .then()
                .catch((err) => logger.error(err))
        })

        whatsappClient.on('ready', () => {
            console.log('WhatsApp Client is ready!')

            whatsappClient!
                .getChats()
                .then((chats) => {
                    console.log('Available WIDs:')
                    chats.forEach((chat) => console.log(`- ${chat.id._serialized}`))
                })
                .catch((err) => logger.error(err))
        })

        whatsappClient.on('auth_failure', () => {
            console.error('Authentication failed. Restarting WhatsApp client...')
        })

        whatsappClient.on('disconnected', () => {
            redis
                .del(`whatsapp:session:${sessionId}`)
                .then()
                .catch((err) => logger.error(err))

            console.warn('WhatsApp client disconnected. Reconnecting...')
        })

        return whatsappClient
    } catch (error) {
        console.error('WhatsApp Client Error:', error)
        return null
    }
}

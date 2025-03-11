import { syncRedisToMongo } from '../script/syncRedisToDB'
import app from './app'
import config from './config/config'
import { initRateLimitter } from './config/rateLimitter'
import databaseService from './service/databaseService'
import logger from './utils/logger'

const server = app.listen(config.PORT)
void (async () => {
    try {
        // DATABASE_CONNECTION
        const dbConnection = await databaseService.connect()
        initRateLimitter(dbConnection)

        logger.info('RATE_LIMITER_INITIATED')

        logger.info('DATABASE_CONNECTION', {
            meta: {
                CONNECTION_NAME: dbConnection.name
            }
        })

        logger.info('SERVER_STARTED', {
            meta: {
                PORT: config.PORT,
                SERVER_URL: config.SERVER_URL,
                MESSAGE: 'Server started successfully',
                TIME_STAMP: new Date().toISOString()
            }
        })

        // SETUP INTERVAL FOR MOVEING DATA REDIS TO DATABASE
        setInterval(
            () => {
                syncRedisToMongo()
                    .then(() => logger.info('syncRedisToMongo solved'))
                    .catch(() => logger.error('Something went wrong in syncRedisToMongo'))
            },
            1000 * Number(config.CACHE_TTL_IN_SECONDS)
        )
    } catch (error) {
        logger.error('APPLICATION_ERROR', error)

        server.close((err) => {
            if (err) {
                logger.error('SERVER_CLOSE_ERROR', err)
            }

            process.exit(1)
        })
    }
})()

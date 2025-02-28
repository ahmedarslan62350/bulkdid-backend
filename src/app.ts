import express, { Application, NextFunction, Request, Response, urlencoded } from 'express'
import { join } from 'path'
import router from './router/apiRouter'
import globalErrorHandler from './middleware/globalErrorHandler'
import responseMessage from './constants/responseMessage'
import httpError from './utils/httpError'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRouter from './router/authRouter'
import rateLimit from './middleware/rateLimit'
import isAuthenticated from './middleware/isAuthenticated'
import fileRouter from './router/fileRouter'
import { populateStates } from '../script/stateSeeder'
import httpResponse from './utils/httpResponse'
import callerIdRouter from './router/callerIdRouter'
import { syncRedisToMongo } from './service/redisInstance'
import logger from './utils/logger'
import config from './config/config'

const app: Application = express()

// MIDDLEWARE
app.use(helmet())
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: ['http://localhost:5173'],
        credentials: true
    })
)
app.use(express.json())
app.use(express.static(join(__dirname, '../', './public')))
app.use(cookieParser())
app.use(urlencoded({ extended: true }))

// ROUTES
app.use('/api/v1', rateLimit, router)
app.post('/api/v1/db', rateLimit, async () => {
    await populateStates()
})
app.use('/api/v1/auth', rateLimit, authRouter)
app.use('/api/v1/file', rateLimit, isAuthenticated, fileRouter)
app.use('/api/v1/callerId', rateLimit, isAuthenticated, callerIdRouter)

app.post('/api/v1/db/populate', rateLimit, async (req, res) => {
    await populateStates()
    httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
})

// GLOBAL ERROR HANDLER
app.use((req: Request, _: Response, NextFn: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND.message('route'))
    } catch (error) {
        httpError(NextFn, error, req, responseMessage.UNAUTHORIZED.code)
    }
})
app.use(globalErrorHandler)

export default app

setInterval(
    () => {
        syncRedisToMongo()
            .then(() => logger.info('syncRedisToMongo solved'))
            .catch(() => logger.error('Something went wrong in syncRedisToMongo'))
    },
    1000 * 60 * Number(config.TIME_TO_UPDATE_DB_BY_REDIS)
)

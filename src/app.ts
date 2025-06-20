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
import walletRouter from './router/walletRouter'
import userStoreRouter from './router/userStoreRouter'
import profileRouter from './router/profileRouter'
import adminRouter from './router/adminRouter'
import isAdmin from './middleware/isAdmin'
import analyticsRouter from './router/analyticsRouter'
import serverRouter from './router/serverRouter'
import bankRouter from './router/bankRouter'
import expressMongoSanitize from 'express-mongo-sanitize'
import config from './config/config'
import bodyParser from 'body-parser'

const app: Application = express()

// MIDDLEWARE
app.set('trust proxy', true)

app.use(helmet())
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: [config.FRONTEND_URL || 'http://localhost:5173'],
        credentials: true
    })
)

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cookieParser())
app.use(express.static(join(__dirname, '../', './public')))
app.use(urlencoded({ extended: true }))
app.use(expressMongoSanitize())

// ROUTES
app.post('/db', rateLimit, async () => {
    await populateStates()
})
app.use('/auth', rateLimit, authRouter)
app.use('/file', rateLimit, isAuthenticated, fileRouter)
app.use('/wallet', rateLimit, isAuthenticated, walletRouter)
app.use('/user-store', rateLimit, isAuthenticated, userStoreRouter)
app.use('/profile', rateLimit, isAuthenticated, profileRouter)
app.use('/admin', rateLimit, isAuthenticated, isAdmin, adminRouter)
app.use('/analytics', rateLimit, isAuthenticated, isAdmin, analyticsRouter)
app.use('/server', rateLimit, isAuthenticated, isAdmin, serverRouter)
app.use('/bank', rateLimit, bankRouter)
app.use('/callerId', callerIdRouter)
app.use('', rateLimit, router)

app.post('/db/populate', rateLimit, async (req, res) => {
    await populateStates()
    httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
})

// GLOBAL ERROR HANDLER
app.use((req: Request, _: Response, NextFn: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND.message('route'))
    } catch (error) {
        httpError(NextFn, error, req, responseMessage.BAD_GATEWAY.code)
    }
})

app.use(globalErrorHandler)

export default app

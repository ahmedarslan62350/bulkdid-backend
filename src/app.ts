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
app.use('/api/v1/auth', rateLimit, authRouter)
app.use('/api/v1/file', rateLimit, isAuthenticated, fileRouter)

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

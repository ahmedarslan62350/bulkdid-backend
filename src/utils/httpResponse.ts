import { Request, Response } from 'express'
import { THttpResponse } from '../types/types'
import config from '../config/config'
import { EApplicationEnvironment } from '../constants/application'
import logger from './logger'

export default (
    req: Request,
    res: Response,
    responseStatusCode: number,
    responseMessage: string | number,
    data: unknown = null,
    type: 'default' | 'custom' = 'default',
    isLoggerEnabled: boolean = true
): void => {
    const response: THttpResponse = {
        success: true,
        status: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl
        },
        message: typeof responseMessage === 'string' ? responseMessage : '',
        data
    }

    // LOG
    if (isLoggerEnabled) {
        logger.info('CONTROLLER_RESPONCE', { meta: response })
    }

    // Production ENV check
    if (config.ENV === EApplicationEnvironment.PRODUCTION) {
        delete response.request.ip
    }

    if (type === 'default') {
        res.status(responseStatusCode).json(response)
    } else if (type === 'custom') {
        res.status(responseStatusCode).json(responseMessage)
    }
}

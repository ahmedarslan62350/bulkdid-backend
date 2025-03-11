// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import path from 'path'
import config from '../../config/config'
import fs from 'fs'

const ENV_PATH = path.join(__dirname, '..', '..', '..', `.env.${config.ENV}`)

export default function getAllEnvVariables(req: Request, res: Response, next: NextFunction) {
    try {
        const envData = fs.readFileSync(ENV_PATH, 'utf8').split('\n')
        const envObj: { [key: string]: string } = {}

        envData.forEach((env) => {
            const envArr = env.split(' = ')
            envObj[envArr[0]] = envArr[1]
        })

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { variables: envObj })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

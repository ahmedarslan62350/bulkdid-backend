// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import path from 'path'
import config from '../../config/config'
import fs from 'fs'
import logger from '../../utils/logger'
import { exec } from 'child_process'
import { IChangeEnvVariableBody } from '../../types/types'

const ENV_PATH = path.join(__dirname, '..', '..', '..', `.env.${config.ENV}`)

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const { key, value } = req.body as IChangeEnvVariableBody

        if (!key || !value) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        let envData = fs.readFileSync(ENV_PATH, 'utf8').split('\n')

        let updated = false

        envData = envData.map((line) => {
            if (line.startsWith(`${key} =`)) {
                updated = true
                return `${key} = ${value}`
            }
            return line
        })

        if (!updated) {
            envData.push(`${key} = ${value}`)
        }

        fs.writeFileSync(ENV_PATH, envData.join('\n'))

        process.env[key] = value

        const keysToRestartBashScript = ['PM2_SCALE_CPU_USAGE', 'PM2_APP_NAME', 'IS_AUTO_SCALING', 'BACKUP_FQ']

        if (keysToRestartBashScript.includes(key)) {
            exec(
                `/bin/bash ${path.join(__dirname, '..', '..', '..', './script/backup-mongo.sh')} && /bin/bash ${path.join(__dirname, '..', '..', '..', './script/pm2-scaling.sh')}`,
                (err, stdout, stderr) => {
                    if (err) {
                        logger.error('Error updating bash files:', stderr)
                    }
                    logger.info(stdout)
                }
            )
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

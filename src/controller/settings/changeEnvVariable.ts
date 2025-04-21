import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import path from 'path'
import config from '../../config/config'
import fs from 'fs'
import logger from '../../utils/logger'
import { exec } from 'child_process'

const ENV_PATH =
    config.ENV == 'development'
        ? path.join(__dirname, '..', '..', '..', `.env.${config.ENV}`)
        : path.join(__dirname, '..', '..', '..', '..', `.env.${config.ENV}`)

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const { settings } = req.body as { settings: Record<string, string> }

        if (!settings || typeof settings !== 'object') {
            return httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
        }

        let envData = fs.readFileSync(ENV_PATH, 'utf8').split('\n')

        const keysToRestartBashScript = ['PM2_SCALE_CPU_USAGE', 'PM2_APP_NAME', 'IS_AUTO_SCALING', 'BACKUP_FQ']
        let shouldRestart = false

        Object.entries(settings).forEach(([key, value]) => {
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

            process.env[key] = value

            if (keysToRestartBashScript.includes(key)) {
                shouldRestart = true
            }
        })

        fs.writeFileSync(ENV_PATH, envData.join('\n'))

        if (shouldRestart) {
            exec(
                `/bin/bash ${path.join(__dirname, '..', '..', '..', './script/backup-mongo.sh')} && /bin/bash ${path.join(
                    __dirname,
                    '..',
                    '..',
                    '..',
                    './script/pm2-scaling.sh'
                )}`,
                (err, stdout, stderr) => {
                    if (err) {
                        logger.error('Error updating bash files:', stderr)
                    }
                    logger.info(stdout)
                }
            )
        }

        return httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

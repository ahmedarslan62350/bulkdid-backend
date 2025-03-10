import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import path from 'path'
import fs from 'fs/promises'
import { ILogData } from '../../types/types'
import logger from '../../utils/logger'

const logDir = path.join(__dirname, '..', '..', '..', 'logs')

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        // Get all log files matching *.log
        const files = await fs.readdir(logDir)
        const logFiles = files.filter((file) => file.endsWith('.error.log'))

        // Read all log files
        const fileContents = await Promise.all(logFiles.map((file) => fs.readFile(path.join(logDir, file), 'utf-8')))

        // Merge logs
        const logs: ILogData[] = []
        fileContents.forEach((data) => {
            const arr = data.split('|||')
            arr.forEach((str) => {
                if (str.trim()) {
                    try {
                        logs.push(JSON.parse(str) as ILogData)
                    } catch (err) {
                        logger.error(err)
                    }
                }
            })
        })

        // Return logs
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { logs }, 'default', false)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

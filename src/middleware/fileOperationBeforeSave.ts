import { NextFunction, Request, Response } from 'express'
import httpError from '../utils/httpError'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import path, { join } from 'path'
import { Workbook } from 'exceljs'
import { unlink, writeFile } from 'fs'
import logger from '../utils/logger'

const excelWorkbook = new Workbook()

export default {
    processFileBeforeSave: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
                return
            }
            const callerIds: string[] = []
            const { originalname, buffer } = req.file
            const extName = path.extname(originalname)

            if (extName === '.xlsx') {
                // Read the XLSX file from the buffer
                const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
                const response = await excelWorkbook.xlsx.load(nodeBuffer)
                const sheets = response.worksheets[0] // Get the first sheet

                const data = sheets.getColumn(1).values
                if (!data) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('CallerIds'))
                    return
                }

                data.forEach((cell) => {
                    if (typeof cell === 'number' && cell.toString() && /^[0-9]{10,11}$/.test(cell.toString())) {
                        callerIds.push(cell.toString())
                    }
                })
            } else if (extName === '.csv') {
                const path = join(__dirname, '../../uploads', originalname)
                writeFile(path, buffer, (err) => logger.error(err))

                const response = await excelWorkbook.csv.readFile(path)
                const sheet = response.workbook.worksheets[0]

                const data = sheet.getColumn(1).values
                if (!data) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('CallerIds'))
                    return
                }

                data.forEach((cell) => {
                    if (typeof cell === 'number' && cell.toString() && /^[0-9]{10,11}$/.test(cell.toString())) {
                        callerIds.push(cell.toString())
                    }
                })

                unlink(path, (err) => logger.error('File deleted', err))
            }

            req.file.callerIds = callerIds
            next()
        } catch (error) {
            httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        }
    }
}

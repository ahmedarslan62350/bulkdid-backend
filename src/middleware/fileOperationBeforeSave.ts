import { NextFunction, Request, Response } from 'express'
import httpError from '../utils/httpError'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import xlsx from 'xlsx'
import path from 'path'

export default {
    processFileBeforeSave: (req: Request, res: Response, next: NextFunction) => {
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
                const workbook = xlsx.read(buffer, { type: 'buffer' })
                const sheetName = workbook.SheetNames[0] // Get the first sheet
                const sheet = workbook.Sheets[sheetName]
                const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) // Convert to 2D array

                // Extract caller IDs
                data.forEach((row) => {
                    if (Array.isArray(row)) {
                        // Ensure the row is an array
                        row.forEach((cell) => {
                            if (typeof cell === 'number' && cell.toString() && /^[0-9]{10,11}$/.test(cell.toString())) {
                                callerIds.push(cell.toString())
                            }
                        })
                    }
                })
            } else if (extName === '.csv') {
                httpResponse(req, res, responseMessage.BAD_REQUEST.code, 'File type must be of .xlsx format')
                return
            }

            req.file.callerIds = callerIds
            next()
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}

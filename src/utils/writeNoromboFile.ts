import logger from './logger'
import { Workbook } from 'exceljs'

const excelWorkbook = new Workbook()

export async function writeNoromboFile(callerIds: { callerId: string; status: string }[], filePath: string): Promise<boolean> {
    try {
        const worksheet = excelWorkbook.addWorksheet('CallerId Data')
        worksheet.addRow(['callerIDs', 'status'])

        callerIds.forEach(({ callerId, status }) => {
            worksheet.addRow([callerId, status])
        })

        await excelWorkbook.xlsx.writeFile(filePath)
        return true
    } catch (err) {
        logger.error(err)
        return false
    }
}

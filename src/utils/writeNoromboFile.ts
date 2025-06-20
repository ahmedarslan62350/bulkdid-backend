import logger from './logger'
import { Workbook } from 'exceljs'

const excelWorkbook = new Workbook()

export async function writeNoromboFile(callerIds: { callerId: string; status: string }[], filePath: string): Promise<boolean> {
    try {
        const randomName = JSON.stringify(Math.floor(Math.random() * 900000) + Date.now())
        const worksheet = excelWorkbook.addWorksheet(randomName)
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

/* eslint-disable no-console */
import mongoose from 'mongoose'
import { Queue } from 'bullmq'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

import { redisConnection } from '../src/config/redis'
import { UserModel } from '../src/models/User'
import { StoreModel } from '../src/models/Store'
import { FileModel } from '../src/models/File'

const fileProcessingQueue = new Queue('process-file', { connection: redisConnection })

const readCallerIdsFromExcel = async (filePath: string): Promise<string[]> => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const sheet = workbook.worksheets[0]

    const callerIds: string[] = []
    sheet.eachRow((row) => {
        const callerId = JSON.stringify(row.getCell(1).value)?.trim()
        if (callerId && /^\d+$/.test(callerId)) {
            callerIds.push(callerId)
        }
    })

    return callerIds
}

const main = async () => {
    await mongoose.connect(process.env.MONGODB_URI!)

    const users = await UserModel.find()
    for (const user of users) {
        const store = await StoreModel.findOne({ user: user._id })
        if (!store) {
            console.log(`⚠️ No store found for user ${user.email}`)
            continue
        }

        for (const fileId of store.files) {
            const file = await FileModel.findById(fileId)
            if (!file) continue
            if (!file.path || file.state === 'completed') continue

            if (!fs.existsSync(file.path)) {
                console.warn(`⚠️ File not found: ${file.path}`)
                continue
            }

            const callerIds = await readCallerIdsFromExcel(file.path)
            if (callerIds.length === 0) {
                console.warn(`⚠️ No callerIds found in ${file.path}`)
                continue
            }

            await fileProcessingQueue.add('process-file-job', {
                callerIds,
                filePath: file.path,
                redisFileKey: `files:${JSON.stringify(store._id)}`,
                SFileId: JSON.stringify(file._id),
                fileOriginalname: path.basename(file.path)
            })

            console.log(`✅ Requeued file: ${file.path}`)
        }
    }

    console.log('🎉 Finished requeuing files.')
    process.exit(0)
}

main().catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
})

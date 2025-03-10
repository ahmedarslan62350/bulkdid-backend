import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { FileModel } from '../../models/File'
import moment from 'moment'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const dbFiles = await FileModel.find({}, { createdAt: 1 , totalCallerIds:1})

        const today = moment().utc().startOf('day')
        const lastMonth = moment().utc().subtract(Number(config.DATA_RETENTION_PERIOD), 'days').startOf('day')

        const todayFiles = dbFiles.filter((file) => moment(file.createdAt).utc().isSame(today, 'day'))
        const lastMonthFiles = dbFiles.filter((file) => moment(file.createdAt).utc().isAfter(lastMonth))

        let totalTodayDids = 0
        let totalLastMonthDids = 0

        for (const file of lastMonthFiles){
            totalLastMonthDids += file.totalCallerIds
        }
        for (const file of todayFiles){
            totalTodayDids += file.totalCallerIds
        }

        const growthPercentage = totalLastMonthDids ? ((totalTodayDids - totalLastMonthDids / 30) / (totalLastMonthDids / 30)) * 100 : 0

        const dailyDistribution: Record<string, number> = {}

        lastMonthFiles.forEach((file) => {
            const day = moment(file.createdAt).utc().format('YYYY-MM-DD')
            dailyDistribution[day] = file.totalCallerIds
        })

        const analytics = {
            totalTodayDids,
            totalLastMonthDids,
            growthPercentage,
            dailyDistribution
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { analytics })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

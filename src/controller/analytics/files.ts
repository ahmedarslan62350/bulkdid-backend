import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { FileModel } from '../../models/File'
import moment from 'moment'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const dbFiles = await FileModel.find({}, { createdAt: 1 })

        const today = moment().utc().startOf('day')
        const lastMonth = moment().utc().subtract(Number(config.DATA_RETENTION_PERIOD), 'days').startOf('day')

        const todayFiles = dbFiles.filter((file) => moment(file.createdAt).utc().isSame(today, 'day'))
        const lastMonthFiles = dbFiles.filter((file) => moment(file.createdAt).utc().isAfter(lastMonth))

        const totalTodayFiles = todayFiles.length
        const totalLastMonthFiles = lastMonthFiles.length

        const growthPercentage = totalLastMonthFiles ? ((totalTodayFiles - totalLastMonthFiles / 30) / (totalLastMonthFiles / 30)) * 100 : 0

        const dailyDistribution: Record<string, number> = {}

        lastMonthFiles.forEach((file) => {
            const day = moment(file.createdAt).utc().format('YYYY-MM-DD')
            dailyDistribution[day] = (dailyDistribution[day] || 0) + 1
        })

        const analytics = {
            totalTodayFiles,
            totalLastMonthFiles,
            growthPercentage,
            dailyDistribution
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { analytics })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

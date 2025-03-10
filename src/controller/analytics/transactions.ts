import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import moment from 'moment'
import { TransactionModel } from '../../models/Transaction'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const dbTransactions = await TransactionModel.find({}, { createdAt: 1 })

        const today = moment().utc().startOf('day')
        const lastMonth = moment().utc().subtract(Number(config.DATA_RETENTION_PERIOD), 'days').startOf('day')

        const todayTransactions = dbTransactions.filter((transaction) => moment(transaction.createdAt).utc().isSame(today, 'day'))
        const lastMonthTransactions = dbTransactions.filter((transaction) => moment(transaction.createdAt).utc().isAfter(lastMonth))

        const totalTodayTransactions = todayTransactions.length
        const totalLastMonthTransactions = lastMonthTransactions.length

        const growthPercentage = totalLastMonthTransactions
            ? ((totalTodayTransactions - totalLastMonthTransactions / 30) / (totalLastMonthTransactions / 30)) * 100
            : 0

        const dailyDistribution: Record<string, number> = {}

        lastMonthTransactions.forEach((transaction) => {
            const day = moment(transaction.createdAt).utc().format('YYYY-MM-DD')
            dailyDistribution[day] = (dailyDistribution[day] || 0) + 1
        })

        const analytics = {
            totalTodayTransactions,
            totalLastMonthTransactions,
            growthPercentage,
            dailyDistribution
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { analytics })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

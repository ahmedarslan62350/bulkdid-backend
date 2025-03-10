import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import moment from 'moment'
import { UserModel } from '../../models/User'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const dbUsers = await UserModel.find({}, { createdAt: 1 })

        const today = moment().utc().startOf('day')
        const lastMonth = moment().utc().subtract(Number(config.DATA_RETENTION_PERIOD), 'days').startOf('day')

        const todayUsers = dbUsers.filter((user) => moment(user.createdAt).utc().isSame(today, 'day'))
        const lastMonthUsers = dbUsers.filter((user) => moment(user.createdAt).utc().isAfter(lastMonth))

        const totalTodayUsers = todayUsers.length
        const totalLastMonthUsers = lastMonthUsers.length

        const growthPercentage = totalLastMonthUsers ? ((totalTodayUsers - totalLastMonthUsers / 30) / (totalLastMonthUsers / 30)) * 100 : 0
        const dailyDistribution: Record<string, number> = {}

        lastMonthUsers.forEach((user) => {
            const day = moment(user.createdAt).utc().format('YYYY-MM-DD')
            dailyDistribution[day] = (dailyDistribution[day] || 0) + 1
        })

        const analytics = {
            totalTodayUsers,
            totalLastMonthUsers,
            growthPercentage,
            dailyDistribution
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { analytics })
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

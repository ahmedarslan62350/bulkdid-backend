import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import moment from 'moment'
import { redis } from '../../service/redisInstance'
import config from '../../config/config'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const todayDate = moment().utc().format('YYYY-MM-DD')
        const redisTodayKey = `analytics:fetchToday:${todayDate}`

        // Get fetch requests for today
        const todayFetchReqs = await redis.lrange(redisTodayKey, 0, -1)
        const totalTodayDids = todayFetchReqs.length

        let totalLast30DaysDids = 0
        const dailyDistribution: Record<string, number> = {}

        for (let i = 0; i < Number(config.DATA_RETENTION_PERIOD); i++) {
            const date = moment().utc().subtract(i, 'days').format('YYYY-MM-DD')
            const redisKey = `analytics:fetchToday:${date}`

            const fetchRequests = await redis.lrange(redisKey, 0, -1)
            dailyDistribution[date] = fetchRequests.length
            totalLast30DaysDids += fetchRequests.length
        }

        // Calculate Growth Percentage
        const avgDailyLast30Days = totalLast30DaysDids / 30
        const growthPercentage = avgDailyLast30Days ? ((totalTodayDids - avgDailyLast30Days) / avgDailyLast30Days) * 100 : 0

        // Prepare Final Analytics
        const analytics = {
            totalTodayDids,
            totalLast30DaysDids,
            growthPercentage,
            dailyDistribution
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, analytics)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

import pLimit from 'p-limit'
import { getTitle } from './getTitle'
import logger from './logger'
import config from '../config/config'
import { CallerIdResponse } from '../types/types'

const limit = pLimit(5) // Limit to 5 concurrent requests
const MAX_RETRIES: number = Number(config.MAX_RETRIES_NOROMBO_RES) // Maximum number of retries for rate limiting
const URL = config.NOROMBO_URL



async function fetchWithRetry(url: string, retries: number = MAX_RETRIES): Promise<CallerIdResponse> {
    try {
        return await getTitle(url)
    } catch (error) {
        if (retries > 0) {
            // If rate limited, wait and retry
            logger.info(`Rate limited. Retrying... ${retries} attempts left`)
            return fetchWithRetry(url, retries - 1)
        } else {
            throw error // Rethrow if not rate limited or retries exhausted
        }
    }
}

export async function handleDidsRes(callerIds: string[]): Promise<CallerIdResponse[]> {
    const titlePromises = callerIds.map((callerId) =>
        limit(async (): Promise<CallerIdResponse> => {
            const url = `${URL}/${callerId}`
            try {
                const { callerId: id, status } = await fetchWithRetry(url)
                return { callerId: id, status: status || 'Unknown' } // Ensure status is always defined
            } catch (error) {
                logger.error(`Error fetching title for callerId ${callerId}:`, error)
                return { callerId, status: 'Error' }
            }
        })
    )

    return Promise.all(titlePromises)
}

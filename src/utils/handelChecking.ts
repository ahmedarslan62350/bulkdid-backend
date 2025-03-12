import { getTitle } from './getTitle'
import logger from './logger'
import config from '../config/config'
import { CallerIdResponse } from '../types/types'

const MAX_RETRIES: number = Number(config.MAX_RETRIES_NOROMBO_RES) // Maximum retries for rate limiting
const URL = config.NOROMBO_URL
const MAX_CONCURRENT_REQUESTS = 5 // Define how many requests should run at a time

async function fetchWithRetry(url: string, retries: number = MAX_RETRIES): Promise<CallerIdResponse> {
    try {
        return await getTitle(url)
    } catch (error) {
        if (retries > 0) {
            logger.info(`Rate limited. Retrying... ${retries} attempts left`)
            return fetchWithRetry(url, retries - 1)
        } else {
            throw error // Rethrow if not rate limited or retries exhausted
        }
    }
}

async function processBatch(batch: string[]): Promise<CallerIdResponse[]> {
    return Promise.allSettled(
        batch.map(async (callerId) => {
            const url = `${URL}/${callerId}`
            try {
                const { callerId: id, status } = await fetchWithRetry(url)
                return { callerId: id, status: status || 'Unknown' }
            } catch (error) {
                logger.error(`Error fetching title for callerId ${callerId}:`, error)
                return { callerId, status: 'Error' }
            }
        })
    ).then((results) =>
        results.map((res) => (res.status === 'fulfilled' ? res.value : { callerId: '', status: 'Error' }))
    )
}

export async function handleDidsRes(callerIds: string[]): Promise<CallerIdResponse[]> {
    const results: CallerIdResponse[] = []

    for (let i = 0; i < callerIds.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = callerIds.slice(i, i + MAX_CONCURRENT_REQUESTS)
        const batchResults = await processBatch(batch)
        results.push(...batchResults)
    }

    return results
}

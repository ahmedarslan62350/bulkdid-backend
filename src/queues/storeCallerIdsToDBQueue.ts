import { Queue, Worker } from 'bullmq'
import { redisConnection } from '../config/redis'
import logger from '../utils/logger'
import { StateModel } from '../models/State'
import { CallerIdStoreModel } from '../models/CallerIdStore'

export interface IcallerIdsToStoreQueue {
    callerIds: []
    userId: string
}

function extractStatusCode(callerId: string): number {
    const ans = callerId.length === 11 ? parseInt(callerId.slice(1, 4)) : parseInt(callerId.slice(0, 3))
    return Number(ans)
}

// Define Queue
export const callerIdQueue = new Queue('process-caller-ids', { connection: redisConnection })

// Define Worker
export const callerIdWorker = new Worker(
    'process-caller-ids',
    async (job) => {
        const { callerIds, userId } = job.data as IcallerIdsToStoreQueue
        if (!callerIds || !userId) {
            throw new Error('Missing data in job')
        }

        logger.info(`Processing ${callerIds.length} caller IDs for user ${userId}`)

        try {
            // ✅ Group caller IDs by stateId using a Map (Optimized O(N) operation)
            const states = await StateModel.find({}, { _id: 1, statusCodes: 1 }) // Fetch all states with their status codes

            // Create a Map for quick lookup of stateId by status code
            const statusCodeToStateId = new Map<number, string>()
            for (const state of states) {
                for (const code of state.statusCodes) {
                    statusCodeToStateId.set(code, JSON.stringify(state._id))
                }
            }

            const callerIdGroups = new Map<string, number[]>() // Map to store state-wise callerIds
            for (const callerId of callerIds) {
                const statusCode = extractStatusCode(callerId) // Function to get status code from callerId
                const stateId = statusCodeToStateId.get(statusCode)

                if (stateId) {
                    if (!callerIdGroups.has(stateId)) {
                        callerIdGroups.set(stateId, [])
                    }
                    callerIdGroups.get(stateId)!.push(callerId)
                }
            }
            const bulkOperationsState = Array.from(callerIdGroups.entries()).map(([stateId, ids]) => {
                // Ensure stateId is a valid string or ObjectId (if required)
                const uniqueCallerIds = [...new Set(ids)]

                return {
                    updateOne: {
                        filter: { _id: JSON.parse(stateId) as string },
                        update: {
                            $push: { callerIds: { $each: uniqueCallerIds } },
                            $inc: { totalCallerIds: uniqueCallerIds.length }
                        },
                        upsert: true
                    }
                }
            })

            const bulkOperationsCallerIdStore = Array.from(callerIdGroups.entries()).map(([stateId, ids]) => {
                // Ensure stateId is a valid string or ObjectId (if required)
                const uniqueCallerIds = [...new Set(ids)]

                return {
                    updateOne: {
                        filter: { stateId: JSON.parse(stateId) as string, ownerId: userId },
                        update: {
                            $push: { callerIds: { $each: uniqueCallerIds } },
                            $inc: { totalCallerIds: uniqueCallerIds.length }
                        },
                        upsert: true
                    }
                }
            })

            // Log the bulk operations to inspect the data before executing

            if (bulkOperationsCallerIdStore.length > 0 && bulkOperationsCallerIdStore.length > 0) {
                // Execute the bulk write operation
                try {
                    await StateModel.bulkWrite(bulkOperationsState)
                    await CallerIdStoreModel.bulkWrite(bulkOperationsCallerIdStore)
                } catch (error) {
                    logger.error(error)
                }
            }
            logger.info(`Successfully inserted ${callerIds.length} caller IDs for user ${userId}`)
        } catch (error) {
            logger.error('Failed to save caller IDs to database', { error })
            throw new Error('Caller ID processing failed')
        }
    },
    { connection: redisConnection }
)

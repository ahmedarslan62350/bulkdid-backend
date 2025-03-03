import { Queue, Worker } from 'bullmq'
import { redisConnection } from '../config/redis'
import logger from '../utils/logger'
import { StateModel } from '../models/State'
import { CallerIdStoreModel } from '../models/CallerIdStore'
import mongoose, { isValidObjectId, ObjectId } from 'mongoose'
import quicker from '../utils/quicker'
import { StoreModel } from '../models/Store'
import { IcallerIdsToStoreQueue, IState } from '../types/types'

// Define Queue
export const callerIdQueue = new Queue('process-caller-ids', { connection: redisConnection })

// Define Worker
export const callerIdWorker = new Worker(
    'process-caller-ids',
    async (job) => {
        const { callerIds, userId, user } = job.data as IcallerIdsToStoreQueue
        if (!callerIds || !userId) {
            throw new Error('Missing data in job')
        }

        logger.info(`Processing ${callerIds.length} caller IDs for user ${userId}`)

        try {
            // ✅ Group caller IDs by stateId using a Map (Optimized O(N) operation)
            const states = await StateModel.find({}, { _id: 1, statusCodes: 1, name: 1 }) // Fetch all states with their status codes
            // Create a Map for quick lookup of stateId by status code
            const statusCodeToStateId = new Map<number, string>()
            for (const state of states) {
                for (const code of state.statusCodes) {
                    const stateIdStr = JSON.stringify(state._id)
                    statusCodeToStateId.set(code, stateIdStr)
                }
            }

            const callerIdGroups = new Map<string, number[]>() // Map to store state-wise callerIds
            for (const callerId of callerIds) {
                const statusCode = quicker.extractStatusCode(callerId) // Function to get status code from callerId
                const stateId = statusCodeToStateId.get(statusCode)

                if (stateId) {
                    if (!callerIdGroups.has(stateId)) {
                        callerIdGroups.set(stateId, [])
                    }
                    callerIdGroups.get(stateId)?.push(callerId)
                }
            }

            const callerIdEntries = Array.from(callerIdGroups.entries())

            const bulkOperationsState = callerIdEntries.map(([stateId, ids]) => {
                // Ensure stateId is a valid string or ObjectId (if required)
                const uniqueCallerIds = [...new Set(ids)]
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                let SId = JSON.parse(stateId)

                if (!isValidObjectId(SId)) {
                    logger.error(`Invalid ObjectId stateId: ${stateId}`)
                    SId = new mongoose.Types.ObjectId(SId as string)
                }

                return {
                    updateOne: {
                        filter: { _id: SId as ObjectId },
                        update: {
                            $addToSet: { callerIds: { $each: uniqueCallerIds } }
                        },
                        upsert: true
                    }
                }
            })

            const bulkOperationsCallerIdStore = callerIdEntries.map(([stateId, ids]) => {
                // Ensure stateId is a valid string or ObjectId (if required)
                const uniqueCallerIds = [...new Set(ids)]
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                let SId = JSON.parse(stateId)
                const state = states.find((state) => state._id == SId) as IState

                if (!isValidObjectId(SId)) {
                    logger.error(`Invalid ObjectId stateId: ${stateId}`)
                    SId = new mongoose.Types.ObjectId(SId as string)
                }

                return {
                    updateOne: {
                        filter: { stateId: SId as ObjectId, ownerId: userId },
                        update: {
                            $push: {
                                callerIds: { $each: uniqueCallerIds }
                            },
                            $inc: { totalCallerIds: uniqueCallerIds.length },
                            $set: { name: state.name, storeId: user.store, statusCodes: state.statusCodes }
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
                    const userCallerIdStoreIds = await CallerIdStoreModel.find({ ownerId: userId }, { _id: 1 })
                    await StoreModel.findOneAndUpdate(
                        { ownerId: userId },
                        {
                            $push: {
                                callerIdStores: [...userCallerIdStoreIds]
                            }
                        }
                    )
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

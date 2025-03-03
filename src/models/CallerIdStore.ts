import mongoose, { Schema } from 'mongoose'
import { ICallerIdStore } from '../types/types'

const callerIdStoreSchema = new Schema<ICallerIdStore>(
    {
        name: {
            type: String,
            required: true
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        callerIds: {
            type: [Number]
        },
        statusCodes: {
            type: [Number]
        },
        totalCallerIds: {
            type: Number,
            required: true,
            default: 0
        },
        stateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: true
        },
        fetchRequests: {
            type: Number,
            required: true,
            default: 0
        },
        index: {
            type: Number,
            required: true,
            default: 0
        }
    },
    { timestamps: true }
)

export const CallerIdStoreModel = mongoose.model<ICallerIdStore>('CallerIdStore', callerIdStoreSchema)

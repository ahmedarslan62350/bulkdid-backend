import mongoose, { Schema } from 'mongoose'
import { IStore } from '../types/types'

const storeSchema = new Schema<IStore>(
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
        files: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'File'
            }
        ],
        fetchRequests: {
            type: Number,
            default: 0
        },
        callerIdStores: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CallerIdStore'
            }
        ],
        callerIds: {
            type: Number,
            default: 0
        },
        agents: [
            {
                ip: { type: String, required: true },
                isAlowed: { type: Boolean, default: false }
            }
        ]
    },
    { timestamps: true }
)

export const StoreModel = mongoose.model<IStore>('Store', storeSchema)

import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface ICallerIdStore extends Document {
    _id: ObjectId
    name: string
    ownerId: ObjectId
    callerIds: [number]
    totalCallerIds: number
    stateId: ObjectId
    fetchRequests: number
    createdAt?: Date
    updatedAt?: Date
}

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
        callerIds: {
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
        }
    },
    { timestamps: true }
)

export const CallerIdStoreModel = mongoose.model<ICallerIdStore>('CallerIdStore', callerIdStoreSchema)

import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface IStore extends Document {
    _id: ObjectId
    name: string
    ownerId: ObjectId
    files: [ObjectId]
    fetchRequests: number
    callerIdStores: [ObjectId]
    callerIds: number
    createdAt?: Date
    updatedAt?: Date
}

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
        }
    },
    { timestamps: true }
)

export const StoreModel = mongoose.model<IStore>('Store', storeSchema)

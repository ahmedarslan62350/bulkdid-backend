import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface IState extends Document {
    _id: ObjectId
    name: string
    statusCodes: [number]
    callerIds: [string]
    createdAt?: Date
    updatedAt?: Date
}

const stateSchema = new Schema<IState>(
    {
        name: {
            type: String,
            required: true
        },
        statusCodes: {
            type: [Number]
        },
        callerIds: {
            type: [String]
        }
    },
    { timestamps: true }
)

export const StateModel = mongoose.model<IState>('State', stateSchema)

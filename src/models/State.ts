import mongoose, { Schema } from 'mongoose'
import { IState } from '../types/types'

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
            type: [Number]
        }
    },
    { timestamps: true }
)

export const StateModel = mongoose.model<IState>('State', stateSchema)

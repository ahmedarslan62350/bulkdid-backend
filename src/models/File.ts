import mongoose, { Schema } from 'mongoose'
import { IFile } from '../types/types'

const fileSchema = new Schema<IFile>(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true,
            default: 0
        },
        state: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        path: {
            type: String
        },
        callerIds: [
            {
                type: Number
            }
        ],
        totalCallerIds: {
            type: Number,
            required: true,
            default: 0
        },
        type: {
            type: String,
            enum: ['xlsx', 'csv', '.csv', '.xlsx'],
            required: true
        },
        role: {
            type: String,
            enum: ['checking', 'fetching', 'both'],
            default: 'checking'
        }
    },
    { timestamps: true }
)

export const FileModel = mongoose.model<IFile>('File', fileSchema)

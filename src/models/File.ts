import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface IFile extends Document {
    _id: ObjectId
    ownerId: ObjectId
    name: string
    size: number
    state: 'pending' | 'processing' | 'completed' | 'failed'
    path: string
    callerIds: number
    type: 'xlsx' | 'csv'
    role: 'checking-status' | 'fetching' | 'both'
    downloads: number
    createdAt?: Date
    updatedAt?: Date
}

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
            type: String,
            required: true
        },
        callerIds: {
            type: Number,
            required: true,
            default: 0
        },
        type: {
            type: String,
            enum: ['xlsx', 'csv'],
            required: true
        },
        role: {
            type: String,
            enum: ['checking-status', 'fetching', 'both'],
            default: 'checking-status'
        }
    },
    { timestamps: true }
)

export const FileModel = mongoose.model<IFile>('File', fileSchema)

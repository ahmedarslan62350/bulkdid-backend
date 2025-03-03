import mongoose, { Schema } from 'mongoose'
import { IBank } from '../types/types'

const bankSchema = new Schema<IBank>(
    {
        name: { type: String, required: true },
        accountHolderName: { type: String, required: true },
        accountNumber: { type: Number, required: true },
        icon: { type: String },
        iconWidth: { type: Number },
        iconHeight: { type: Number }
    },
    { timestamps: true }
)

export const BankModel = mongoose.model<IBank>('Bank', bankSchema)

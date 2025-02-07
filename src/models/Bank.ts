import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface IBank extends Document {
    _id: ObjectId
    name: string
    accountHolderName: string
    accountNumber: number
    icon: string
    iconWidth: number
    iconHeight: number
    createdAt?: Date
    updatedAt?: Date
}

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

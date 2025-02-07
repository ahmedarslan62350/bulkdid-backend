import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
    _id: ObjectId
    comment: string
    walletId: ObjectId
    amount: number
    type: 'deposit' | 'withdraw'
    to: string
    from: string
    createdAt?: Date
    updatedAt?: Date
}

const transactionSchema = new Schema<ITransaction>({
    comment: {
        type: String,
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    type: {
        type: String,
        enum: ['deposit', 'withdraw'],
        required: true,
        default: 'deposit'
    },
    to: {
        type: String
    },
    from: {
        type: String
    }
 
}, { timestamps: true })

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema)

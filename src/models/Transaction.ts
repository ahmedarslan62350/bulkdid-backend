import mongoose, { Schema } from 'mongoose'
import { ITransaction } from '../types/types'

const transactionSchema = new Schema<ITransaction>(
    {
        comment: {
            type: String
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
        },
        imageUrl: {
            type: String
        }
    },
    { timestamps: true }
)

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema)

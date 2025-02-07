import mongoose, { ObjectId, Schema, Document } from 'mongoose'

export interface Iwallet extends Document {
    _id: ObjectId
    ownerId: ObjectId
    totalTransactions: number
    balance: number
    withdraws: number
    deposits: number
    accountNumber: string
    BAT: number
    BBT: number
    transactions: [ObjectId]
    createdAt?: Date
    updatedAt?: Date
}

const walletSchema = new Schema<Iwallet>(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        totalTransactions: {
            type: Number,
            default: 0
        },
        balance: {
            type: Number,
            default: 0
        },
        withdraws: {
            type: Number,
            default: 0
        },
        deposits: {
            type: Number,
            default: 0
        },
        accountNumber: {
            type: String,
            required: true
        },
        BAT: {
            type: Number,
            default: 0
        },
        BBT: {
            type: Number,
            default: 0
        },
        transactions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Transaction'
            }
        ]
    },
    { timestamps: true }
)

export const WalletModel = mongoose.model<Iwallet>('Wallet', walletSchema)

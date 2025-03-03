import mongoose, { Schema } from 'mongoose'
import { IWallet } from '../types/types'

const walletSchema = new Schema<IWallet>(
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

export const WalletModel = mongoose.model<IWallet>('Wallet', walletSchema)

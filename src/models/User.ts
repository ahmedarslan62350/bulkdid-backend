import mongoose, { Schema } from 'mongoose'
import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import logger from '../utils/logger'
import config from '../config/config'
import { IAccessTokenData, IUser } from '../types/types'
import jwtVerification from '../utils/jwtVerification'

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        },
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true
        },
        refreshToken: {
            type: String
        },
        sessions: [{ type: String }],
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verifyCode: {
            type: Number
        },
        verifyCodeExpiry: {
            type: Date,
            default: Date.now() + 120000
        },
        verifyCodeUsed: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)

userSchema.pre('save', async function (next) {
    const user = this as IUser
    if (!user.isModified('password')) return next()

    try {
        if (typeof user.password === 'string') {
            user.password = await bcrypt.hash(user.password, 10)
            logger.error('Password must be of type string')
        }
    } catch (error) {
        logger.error('Error hashing password', {
            error
        })
    }

    next()
})

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        const user = this as IUser
        const isMatch = await bcrypt.compare(candidatePassword, user.password)
        return isMatch
    } catch (error) {
        logger.error('Error comparing password', {
            error
        })
        return false
    }
}

userSchema.methods.generateRefreshToken = async function (): Promise<boolean> {
    try {
        const user = this as IUser
        const payload = {
            _id: user._id
        }
        const options: SignOptions = {
            expiresIn: '30d',
        }

        // eslint-disable-next-line
        user.refreshToken = await jwt.sign(payload, config.JWT_TOKEN_SECRET as string, options)

        await user.save()
        return true
    } catch (error) {
        logger.error('Error generating Refresh Token', { error })
        return false
    }
}

userSchema.methods.generateAccessToken = async function (): Promise<string | null> {
    try {
        const user = this as IUser

        const payload = {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            walletId: user.walletId,
            store: user.store,
            isVerified: user.isVerified,
            sessions: user.sessions,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
        const options: SignOptions = {
            expiresIn: '15m',
        }

        // eslint-disable-next-line
        const token = (await jwt.sign(payload, config.JWT_TOKEN_SECRET as string, options)) as string

        return token
    } catch (error) {
        logger.error('Error generating Access Token', { error })
        return null
    }
}

userSchema.methods.decodeAccessToken = function (token: string): IAccessTokenData | null {
    try {
        const data = jwtVerification.verifyJWT(token) as IAccessTokenData

        return data
    } catch (error) {
        logger.error('Error decoding Access Token', { error })
        return null
    }
}

userSchema.methods.decodeRefreshToken = function (token: string): { _id: string } | null {
    try {
        const data = jwtVerification.verifyJWT(token) as { _id: string }

        return data
    } catch (error) {
        logger.error('Error decoding Refresh Token', { error })
        return null
    }
}

export const UserModel = mongoose.model<IUser>('User', userSchema)

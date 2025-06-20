import { NextFunction, Request } from 'express'
import { Document, ObjectId } from 'mongoose'
import { Client } from 'whatsapp-web.js'

// OTHERS
export type THttpResponse = {
    success: boolean
    status: number
    request: {
        ip?: string | null
        method: string
        url: string
    }
    message: string
    data?: unknown
}

export type THttpError = {
    success: boolean
    status: number
    request: {
        ip?: string | null
        method: string
        url: string
    }
    message: string
    data?: unknown
    trace?: object | null
}

export interface IGeoIP {
    country: string
    countryCode: string
    region: string
    regionName: string
    city: string
    zip: string
    lat: number
    lon: number
    timezone: string
    isp: string
    org: string
}

export interface IEmailJob {
    email: string
    subject: string
    html: string
}

export interface IFileProcessingJob {
    callerIds: string[]
    filePath: string
    redisFileKey: string
    SFileId: string
    fileOriginalname: string
}

export interface IcallerIdsToStoreQueue {
    callerIds: []
    userId: string
    user: IUser
}

export interface IWhatsAppJobData {
    req: Request
    next: NextFunction
    image: Express.Multer.File
    imagePath: string
    client: Client
    recipientNumber: string
    user: IAccessTokenData
}

export interface ILogMeta {
    [key: string]: unknown
}

export interface IServerUsageBody {
    name?: string
}

export interface IReqTransactionBody {
    type: 'deposite' | 'withdraw'
    image?: Express.Multer.File
    amount?: string
    accountNumber?: string
}

export interface ILogData {
    level: string
    message: string
    timestamp: string
    meta: ILogMeta
}

export interface IMongoDBStats {
    version: string
    uptime: number | string
    connections: {
        current: number
        available: number
    }
    memoryUsage: {
        resident: string
        virtual: string
    }
    network: {
        bytesIn: string
        bytesOut: string
        numRequests: number
    }
    operations: {
        insert: number
        query: number
        update: number
        delete: number
    }
    storageEngine: string
}

export interface CallerIdResponse {
    callerId: string
    status: string
}

// MODELS
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

export interface ICallerIdStore extends Document {
    _id: ObjectId
    name: string
    ownerId: ObjectId
    storeId: ObjectId
    callerIds: number[]
    statusCodes: number[]
    totalCallerIds: number
    stateId: ObjectId
    fetchRequests: number
    index: number
    createdAt?: Date
    updatedAt?: Date
}

export interface IFile extends Document {
    _id: ObjectId
    ownerId: ObjectId
    name: string
    size: number
    state: 'pending' | 'processing' | 'completed' | 'failed'
    path: string | null
    totalCallerIds: number
    callerIds: number[]
    type: 'xlsx' | 'csv' | '.csv' | '.xlsx'
    role: 'checking' | 'fetching' | 'both'
    downloads: number
    createdAt?: Date
    updatedAt?: Date
}

export interface IState extends Document {
    _id: ObjectId
    name: string
    statusCodes: number[]
    callerIds: number[]
    createdAt?: Date
    updatedAt?: Date
}

export interface ITransaction extends Document {
    _id: ObjectId
    comment: string
    walletId: ObjectId
    amount: number
    type: 'deposit' | 'withdraw'
    to: string
    from: string
    imageUrl?: string
    createdAt?: Date
    updatedAt?: Date
}

export interface IStore extends Document {
    _id: ObjectId
    name: string
    ownerId: ObjectId
    files: ObjectId[]
    fetchRequests: number
    callerIdStores: ObjectId[]
    callerIds: number
    agents: { ip: string; isAlowed: boolean }[]
    createdAt?: Date
    updatedAt?: Date
}

export interface IUser extends Document {
    _id: ObjectId
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
    walletId: ObjectId
    store: ObjectId
    verifyCode: number | null
    verifyCodeExpiry: Date | number | null
    verifyCodeUsed: number
    isVerified: boolean
    isAllowedToFetch: boolean
    createdAt?: Date
    updatedAt?: Date
    sessions: string[]
    refreshToken: string
    accessToken: string
    loginAttempts: number
    isBlocked: boolean
    comparePassword(candidatePassword: string): Promise<boolean>
    generateRefreshToken(): Promise<boolean | string>
    generateAccessToken(): Promise<string | null>
}

export interface IWallet extends Document {
    _id: ObjectId
    ownerId: ObjectId
    totalTransactions: number
    balance: number
    withdraws: number
    deposits: number
    accountNumber: string
    BAT: number
    BBT: number
    transactions: ObjectId[]
    createdAt?: Date
    updatedAt?: Date
}

// ROUTES
export interface ILoginBody {
    email: string
    password: string
}

export interface IAccessTokenData {
    _id: ObjectId
    email: string
    name: string
    role: 'admin' | 'user'
    walletId: ObjectId
    store: ObjectId
    isVerified: boolean
    isAllowedToFetch: boolean
    sessions: string[]
    createdAt?: Date
    updatedAt?: Date
}

export interface IRegisterBody {
    email: string
    password: string
    confirmPassword: string
    name: string
    accountNumber: string
}

export interface IUpdatePasswordBody {
    currentPassword: string
    newPassword: string
    confirmPassword: string
    logoutSessions: 'all' | 'current'
}

export interface IGetCallerIdsByStateNameBody {
    stateName: string
}

export interface IDownloadBody {
    fileId: string
}

export interface IFileBody {
    role: string
}

export interface IDepositeAndWithdrawBody {
    comment?: string
    amount: number
    email: string
}

export interface IUpdateProfileBody {
    name?: string
    sessions?: string[]
}

export interface IGetIpDetailsBody {
    ip: string
}

export interface IDeleteUserBody {
    user: IUser
}

export interface IUpdateUserBody {
    user: IUser
    wallet: IWallet
    store: IStore
}

export interface IUpdateTransactionBody {
    transaction: ITransaction
}

export interface IAddNewStateBody {
    stateName: string
    codes: number[]
}

export default interface IUpdateStateBody {
    stateId: string
    stateName: string
    codes: number[]
}

export interface IAddBankBody {
    name: string
    accountHolderName: string
    accountNumber: string
    icon: string
    iconWidth?: number
    iconHeight?: number
}

export interface IChangeEnvVariableBody {
    key: string
    value: string
}

export interface IUpdateStoreBody {
    name?: string
    agents?: [{ ip: string; isAlowed: boolean }]
}

export interface IGetLengthByIndex {
    index?: number
    length?: number
}

export interface IBlockUserBody {
    user: IUser
}

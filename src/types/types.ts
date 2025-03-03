import { Document, ObjectId } from 'mongoose'

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

export interface IEmailJob {
    email: string
    subject: string
    html: string
}

export interface IcallerIdsToStoreQueue {
    callerIds: []
    userId: string
    user: IUser
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
    callerIds: [number]
    statusCodes: [number]
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
    callerIds: [number]
    type: 'xlsx' | 'csv' | '.csv' | '.xlsx'
    role: 'checking-status' | 'fetching' | 'both'
    downloads: number
    createdAt?: Date
    updatedAt?: Date
}

export interface IState extends Document {
    _id: ObjectId
    name: string
    statusCodes: [number]
    callerIds: [number]
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
    agents: [{ ip: string; isAlowed: boolean;}]
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
    createdAt?: Date
    updatedAt?: Date
    sessions: [string]
    refreshToken: string
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
    sessions: [string]
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
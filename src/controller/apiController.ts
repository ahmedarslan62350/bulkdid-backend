import { NextFunction, Request, Response } from 'express'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import httpError from '../utils/httpError'
import quicker from '../utils/quicker'
import register from './auth/register'
import verify from './auth/verify'
import resend from './auth/resend'
import login from './auth/login'
import logout from './auth/logout'
import _delete from './auth/delete'
import updatePassword from './auth/updatePassword'
import upload from './file/upload'
import fetchCalllerId from './callerId/fetch'
import { getAllCallerIds, getCallerIdsByStateName } from './callerId/getCallerIds'
import downloadFile from './file/download'
import withdraw from './wallet/withdraw'
import deposite from './wallet/deposite'
import getAllTransactions from './wallet/getTransactions'
import details from './userStore/details'
import getProfile from './profile/details'
import getCallerIdStores from './userStore/getCallerIdStores'
import update from './userStore/update'
import getIpDetails from './profile/getIpDetails'
import updateProfile from './profile/updateProfile'
import getAllUsers from './admin/getUsers'
import getAllWallets from './admin/getWallets'
import updateState from './admin/updateState'
import getAllTransactionsAdmin from './admin/getTransactions'
import updateUser from './admin/updateUser'
import getAllStates from './admin/getStates'
import getAllFiles from './admin/getFiles'
import getAllCallerIdStores from './admin/getCallerIdStores'
import deleteUser from './admin/deleteUser'
import addState from './admin/addState'
import fileAnalytics from './analytics/files'
import userAnalytics from './analytics/users'
import transactionAnalytics from './analytics/transactions'
import didsAnalytics from './analytics/dids'
import fetchDidsAnalytics from './analytics/fetchDids'
import infoLogs from './analytics/infoLogs'
import errorLogs from './analytics/errorLogs'
import usage from './server/usage'

export default {
    self: (req: Request, res: Response, NextFn: NextFunction) => {
        try {
            // throw new Error('this is error')
            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { imageUrl: 'http://localhost:8080/images' })
        } catch (error) {
            httpError(NextFn, error, req, 500)
        }
    },

    health: (req: Request, res: Response, NextFn: NextFunction) => {
        try {
            const systemHealth = quicker.getSystemDetails()
            const applicationHealth = quicker.getApplicationDetails()

            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { systemHealth, applicationHealth })
        } catch (error) {
            httpError(NextFn, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        }
    },

    // AUTH
    register,
    verify,
    resend,
    login,
    logout,
    _delete,
    updatePassword,

    // FILE & CALLERIDS
    uploadFile: upload,
    fetchCalllerId,
    getAllCallerIds,
    getCallerIdsByStateName,
    downloadFile,

    // WALLET & TRANSACTIONS
    withdraw,
    deposite,
    getAllTransactions,

    // USER_STORE
    details,
    getCallerIdStores,
    update,

    // PROFILE
    getProfile,
    getIpDetails,
    updateProfile,

    // ADMIN
    getAllUsers,
    getAllWallets,
    getAllTransactionsAdmin,
    updateState,
    updateUser,
    getAllStates,
    getAllFiles,
    getAllCallerIdStores,
    deleteUser,
    addState,

    // ANALYTICS
    fileAnalytics,
    userAnalytics,
    transactionAnalytics,
    didsAnalytics,
    fetchDidsAnalytics,
    infoLogs,
    errorLogs,

    // SREVERS
    usage
}

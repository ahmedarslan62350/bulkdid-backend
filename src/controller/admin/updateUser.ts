// If possible , add redis or kafkafor large traffic
// Add email jobs to email queue

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import { redis } from '../../service/redisInstance'
import { REDIS_USER_KEY, REDIS_USERS_STORE_KEY, REDIS_WALLET_KEY } from '../../constants/redisKeys'
import { UserModel } from '../../models/User'
import { IStore, IUpdateUserBody, IUser, IWallet } from '../../types/types'
import { StoreModel } from '../../models/Store'
import { WalletModel } from '../../models/Wallet'

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const { user, wallet, store } = req.body as IUpdateUserBody
        if (!user && !wallet && !store) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.FIELD_REQUIRED('user'))
            return
        }

        if (user) {
            const redisUserKey = REDIS_USER_KEY(user.email)
            let redisUser = await redis.get(redisUserKey)

            if (!redisUser) {
                const dbUser = await UserModel.findOneAndUpdate({ email: user.email }, { $set: user }, { new: true })
                if (!dbUser) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user'))
                    return
                }

                redisUser = JSON.stringify(dbUser)
                await redis.set(redisUserKey, redisUser)
            }
            const userToUpdate = JSON.parse(redisUser) as IUser

            const updatedUser = {
                ...userToUpdate,
                ...user
            }

            await redis.set(redisUserKey, JSON.stringify(updatedUser))
        }

        if (wallet) {
            const redisWalletKey = REDIS_WALLET_KEY(user.email)
            let redisWallet = await redis.get(redisWalletKey)

            if (!redisWallet) {
                const dbWallet = await WalletModel.findOneAndUpdate({ ownerId: user._id }, { $set: wallet }, { new: true })
                if (!dbWallet) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('wallet'))
                    return
                }

                redisWallet = JSON.stringify(dbWallet)
                await redis.set(redisWalletKey, redisWallet)
            }

            const walletToUpdate = JSON.parse(redisWallet) as IWallet

            const updatedWallet = {
                ...walletToUpdate,
                ...wallet
            }
            await redis.set(redisWalletKey, JSON.stringify(updatedWallet))
        }

        if (store) {
            const redisStoreKey = REDIS_USERS_STORE_KEY(JSON.parse(JSON.stringify(user.store)) as string)
            let redisStore = await redis.get(redisStoreKey)

            if (!redisStore) {
                const dbStore = await StoreModel.findOneAndUpdate({ ownerId: user._id }, { $set: store }, { new: true })
                if (!dbStore) {
                    httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('store'))
                    return
                }

                redisStore = JSON.stringify(dbStore)
                await redis.set(redisStoreKey, redisStore)
            }

            const storeToUpdate = JSON.parse(redisStore) as IStore

            const updatedStore = {
                ...storeToUpdate,
                ...store
            }

            await redis.set(redisStoreKey, JSON.stringify(updatedStore))
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message)
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
    }
}

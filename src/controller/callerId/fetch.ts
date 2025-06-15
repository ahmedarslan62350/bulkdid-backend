// PENDING implemment average response time in database

import { NextFunction, Request, Response } from 'express'
import httpError from '../../utils/httpError'
import responseMessage from '../../constants/responseMessage'
import httpResponse from '../../utils/httpResponse'
import quicker from '../../utils/quicker'
import { CallerIdStoreModel } from '../../models/CallerIdStore'
import { redis } from '../../service/redisInstance'
import { WalletModel } from '../../models/Wallet'
import config from '../../config/config'
import { UserModel } from '../../models/User'
import { StoreModel } from '../../models/Store'
import { ICallerIdStore, IStore, IUser, IWallet } from '../../types/types'
import {
    REDIS_CALLERID_KEY,
    REDIS_CALLERID_INDEX_KEY,
    REDIS_USERS_BY_STORE_KEY,
    REDIS_USERS_STORE_KEY,
    REDIS_WALLET_KEY
} from '../../constants/redisKeys'

export default async function fetchCalllerId(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Validate
        const { id, storeId } = req.params
        if (!id || !storeId) return httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.BAD_REQUEST.message)

        // 2. Get store from cache or DB
        const redisStoreKey = REDIS_USERS_STORE_KEY(storeId)
        let store = await redis.get(redisStoreKey)
        if (!store) {
            const dbSore = await StoreModel.findById(storeId)
            store = JSON.stringify(dbSore)
            await redis.set(redisStoreKey, store)
        }

        const parsedStore = JSON.parse(store) as IStore

        // 3. Get user from cache or DB
        const userKey = REDIS_USERS_BY_STORE_KEY(storeId)
        let user = await redis.get(userKey)
        if (!user) {
            user = await UserModel.findById(parsedStore.ownerId)
            if (!user) return httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.BAD_REQUEST.message)
            await redis.set(userKey, JSON.stringify(user))
        }

        const parsedUser = JSON.parse(user) as IUser

        // 4. Prepare keys
        const email = parsedUser.email
        const redisIndexKey = REDIS_CALLERID_INDEX_KEY(email)
        const redisCallerKey = REDIS_CALLERID_KEY(email)
        const redisWalletKey = REDIS_WALLET_KEY(email)
        const stateCode = quicker.extractStatusCode(id)

        // 5. Get callerIdStore
        const callerIdStr = await redis.hget(redisCallerKey, String(stateCode))
        let callerIdStore: ICallerIdStore

        if (!callerIdStr) {
            const freshStores = await CallerIdStoreModel.find({ ownerId: parsedUser._id })
            const match = freshStores.find((s) => s.statusCodes.includes(stateCode))
            if (!match) return httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.BAD_REQUEST.message)

            // Save all stores to Redis hash
            await Promise.all(
                freshStores.map(
                    (store) => redis.hset(redisCallerKey, store.statusCodes[0], JSON.stringify(store)) // Simplify as needed
                )
            )

            callerIdStore = match
        } else {
            callerIdStore = JSON.parse(callerIdStr) as ICallerIdStore
        }

        // 6. Get and update index
        let index = Number(await redis.hget(redisIndexKey, String(stateCode))) || 0

        const callerIdToSend = callerIdStore.callerIds[index]
        index = (index + 1) % callerIdStore.callerIds.length
        callerIdStore.fetchRequests++
        parsedStore.fetchRequests += 1

        // 7. Get wallet
        const walletStr = await redis.get(redisWalletKey)
        let wallet

        if (!walletStr) {
            wallet = await WalletModel.findById(parsedUser.walletId)
            if (!wallet) return httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.BAD_REQUEST.message)
            await redis.set(redisWalletKey, JSON.stringify(wallet))
        } else {
            wallet = JSON.parse(walletStr) as IWallet
        }

        if (wallet.balance < Number(config.COST_PER_CALLERID_FETCH)) {
            return httpResponse(req, res, 503, 'Insufficient balance')
        }
        wallet.balance -= Number(config.COST_PER_CALLERID_FETCH)

        // 9. Save updates in parallel
        await Promise.all([
            redis.hset(redisCallerKey, stateCode, JSON.stringify(callerIdStore)),
            redis.hset(redisIndexKey, stateCode, index.toString()),
            redis.set(redisWalletKey, JSON.stringify(wallet)),
            redis.set(redisStoreKey, JSON.stringify(parsedStore)),
            redis.rpush(`fetchLog:${email}`, JSON.stringify({ ip: req.ip, time: Date.now() }))
        ])

        httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        return
    }
}

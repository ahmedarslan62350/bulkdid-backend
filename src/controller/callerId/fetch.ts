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
import { REDIS_CALLERID_KEY, REDIS_FETCH_DID_KEY, REDIS_USERS_BY_STORE_KEY, REDIS_USERS_STORE_KEY, REDIS_WALLET_KEY } from '../../constants/redisKeys'

export default async function fetchCalllerId(req: Request, res: Response, next: NextFunction) {
    try {
        const { id, storeId } = req.params
        if (!id || !storeId) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const usersByStoreIdKey = REDIS_USERS_BY_STORE_KEY(storeId)
        const userStoreKey = REDIS_USERS_STORE_KEY(storeId)

        const redisFetchDidKey = REDIS_FETCH_DID_KEY()

        let strStore = await redis.get(userStoreKey)
        let redisStore = JSON.parse(strStore! || '{}') as IStore

        const strUser = await redis.get(usersByStoreIdKey)
        let user: IUser | null = JSON.parse(strUser as string) as IUser

        if (!user) {
            if (!strStore) {
                strStore = JSON.stringify(await StoreModel.findById(storeId))
                await redis.set(userStoreKey, strStore)
                redisStore = JSON.parse(strStore) as IStore
            }

            const store = JSON.parse(strStore) as IStore
            redisStore = store
            user = await UserModel.findById(store.ownerId)

            if (!user) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('store owner'))
                return
            }
            await redis.set(usersByStoreIdKey, JSON.stringify(user))
        }

        const redisKey = REDIS_CALLERID_KEY(user.email)
        const redisUserWallet = REDIS_WALLET_KEY(user.email)

        const stateCode = quicker.extractStatusCode(id)
        const redisCallerIdStores = await redis.lrange(redisKey, 0, -1)

        if (!redisCallerIdStores.length) {
            const wallet = await WalletModel.findById(user.walletId)
            if (!wallet) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user wallet'))
                return
            }
            if (wallet.balance < Number(config.COST_PER_CALLERID_FETCH)) {
                httpResponse(req, res, responseMessage.SERVICE_UNAVAILABLE.code, 'No much sufficient balance available')
                return
            }
            wallet.balance -= Number(config.COST_PER_CALLERID_FETCH)
            const callerIdStores = await CallerIdStoreModel.find({ ownerId: user._id })
            if (!callerIdStores.length) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('callerId store'))
                return
            }
            const strCallerIdStores = callerIdStores.map((e) => JSON.stringify(e))
            const callerIdStore = callerIdStores.find((e) => e.statusCodes.includes(stateCode))!

            await Promise.all([redis.rpush(redisKey, ...strCallerIdStores), redis.set(redisUserWallet, JSON.stringify(wallet))])

            let callerIdToSend
            if (callerIdStore.index <= callerIdStore.callerIds.length - 1) {
                callerIdToSend = callerIdStore.callerIds[callerIdStore.index]
                callerIdStore.index++
            } else {
                callerIdToSend = callerIdStore.callerIds[0]
                callerIdStore.index = 1
            }

            callerIdStore.fetchRequests++
            await Promise.all([callerIdStore.save(), wallet.save()])

            httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
            return
        }
        const callerIdStores = redisCallerIdStores.map((e) => JSON.parse(e) as ICallerIdStore)
        const callerIdStore = callerIdStores.find((e) => e.statusCodes.includes(stateCode))!
        const index = callerIdStores.findIndex((store) => store._id === callerIdStore._id)

        let callerIdToSend

        if (callerIdStore.index <= callerIdStore.callerIds.length - 1) {
            callerIdToSend = callerIdStore.callerIds[callerIdStore.index]
            callerIdStore.index++
        } else {
            callerIdToSend = callerIdStore.callerIds[0]
            callerIdStore.index = 1
        }

        callerIdStore.fetchRequests++
        if (Object.keys(redisStore).length !== 0) {
            redisStore.fetchRequests++
        }
        const strWallet = await redis.get(redisUserWallet)
        let wallet: IWallet

        if (!strWallet) {
            const walletFromDB = await WalletModel.findById(user.walletId)
            if (!walletFromDB) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('user wallet'))
                return
            }
            wallet = walletFromDB

            await Promise.all([redis.set(redisUserWallet, JSON.stringify(walletFromDB))])
        }

        wallet = JSON.parse(strWallet!) as IWallet

        if (wallet.balance < Number(config.COST_PER_CALLERID_FETCH)) {
            httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('balance in wallet'))
            return
        }

        wallet.balance -= Number(config.COST_PER_CALLERID_FETCH)

        if (index !== -1) {
            await Promise.all([
                redis.lset(redisKey, index, JSON.stringify(callerIdStore)),
                redis.set(redisUserWallet, JSON.stringify(wallet)),
                redis.set(userStoreKey, JSON.stringify(redisStore)),
                redis.rpush(redisFetchDidKey, JSON.stringify({ ip: req.ip, timeStamp: Date.now() }))
            ])
        } else {
            await Promise.all([
                redis.rpush(redisKey, JSON.stringify(callerIdStore)),
                redis.set(redisUserWallet, JSON.stringify(wallet)),
                redis.set(userStoreKey, JSON.stringify(redisStore)),
                redis.rpush(redisFetchDidKey, JSON.stringify({ ip: req.ip, timeStamp: Date.now() }))
            ]) // If not found, add it
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        return
    }
}

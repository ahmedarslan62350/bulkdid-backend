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

export default async function fetchCalllerId(req: Request, res: Response, next: NextFunction) {
    try {
        const { id, storeId } = req.params
        if (!id || !storeId) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }
        const strUser = await redis.get(`usersByStoreId:${storeId}`)
        let user: IUser | null = JSON.parse(strUser as string) as IUser

        if (!user) {
            let strStore = await redis.get(`users:stores:${storeId}`)
            if (!strStore) {
                strStore = JSON.stringify(await StoreModel.findById(storeId))
                await redis.set(`users:stores:${storeId}`, strStore)
            }

            const store = JSON.parse(strStore) as IStore
            user = await UserModel.findById(store.ownerId)

            if (!user) {
                httpResponse(req, res, responseMessage.NOT_FOUND.code, responseMessage.NOT_FOUND.message('store owner'))
                return
            }
            await redis.set(`usersByStoreId:${storeId}`, JSON.stringify(user))
        }

        const stateCode = quicker.extractStatusCode(id)
        const redisKey = `users:callerIds:${user.email}`
        const redisUserWallet = `users:wallet:${user.email}`
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
            await Promise.all([redis.lset(redisKey, index, JSON.stringify(callerIdStore)), redis.set(redisUserWallet, JSON.stringify(wallet))])
        } else {
            await Promise.all([redis.rpush(redisKey, JSON.stringify(callerIdStore)), redis.set(redisUserWallet, JSON.stringify(wallet))]) // If not found, add it
        }

        httpResponse(req, res, responseMessage.SUCCESS.code, callerIdToSend, null, 'custom')
    } catch (error) {
        httpError(next, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        return
    }
}

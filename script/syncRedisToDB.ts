import { CallerIdStoreModel } from '../src/models/CallerIdStore'
import { StoreModel } from '../src/models/Store'
import { WalletModel } from '../src/models/Wallet'
import { redis } from '../src/service/redisInstance'
import { ICallerIdStore, IStore, IWallet } from '../src/types/types'
import logger from '../src/utils/logger'

export const syncRedisToMongo = async () => {
    try {
        const walletKeys = await redis.keys('users:wallet:*')
        const walletBulkOps = []

        const callerIdStoreKeys = await redis.keys('users:callerIds:*')
        const callerIdStoreBulkOps = []

        const storeKeys = await redis.keys('users:stores:*')
        const storeBulkOps = []

        for (const key of walletKeys) {
            const walletString = await redis.get(key)
            if (!walletString) continue

            const walletObj = JSON.parse(walletString) as IWallet
            walletBulkOps.push({
                updateOne: {
                    filter: { _id: walletObj._id },
                    update: { $set: walletObj },
                    upsert: true
                }
            })

            await redis.del(key)
        }

        for (const key of callerIdStoreKeys) {
            const redisCallerIdStores = await redis.lrange(key, 0, -1)

            if (!redisCallerIdStores.length) continue

            for (const store of redisCallerIdStores) {
                const callerIdStore = JSON.parse(store) as ICallerIdStore

                callerIdStoreBulkOps.push({
                    updateOne: {
                        filter: { _id: callerIdStore._id },
                        update: { $set: callerIdStore },
                        upsert: true
                    }
                })
            }

            await redis.del(key)
        }

        for (const key of storeKeys) {
            const strStore = await redis.get(key)
            if (!strStore) continue

            const storeObj = JSON.parse(strStore) as IStore
            storeBulkOps.push({
                updateOne: {
                    filter: { _id: storeObj._id },
                    update: { $set: storeObj },
                    upsert: true
                }
            })

            await redis.del(key)
        }

        if (walletBulkOps.length > 0 || callerIdStoreBulkOps.length > 0 || storeBulkOps.length > 0) {
            await Promise.all([
                WalletModel.bulkWrite(walletBulkOps),
                CallerIdStoreModel.bulkWrite(callerIdStoreBulkOps),
                StoreModel.bulkWrite(storeBulkOps)
            ])

            logger.info(`✅ Synced redis data to MongoDB`)
        } else {
            logger.info('⚠️ No data found in Redis')
        }
    } catch (error) {
        logger.error('❌ Error syncing data from redis to DB:', error)
    }
}

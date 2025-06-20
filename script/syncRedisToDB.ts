import { REDIS_CALLERID_KEY, REDIS_USER_FILE_KEY, REDIS_USER_KEY, REDIS_USERS_STORE_KEY, REDIS_WALLET_KEY } from '../src/constants/redisKeys'
import { CallerIdStoreModel } from '../src/models/CallerIdStore'
import { FileModel } from '../src/models/File'
import { StoreModel } from '../src/models/Store'
import { UserModel } from '../src/models/User'
import { WalletModel } from '../src/models/Wallet'
import { redis } from '../src/service/redisInstance'
import { ICallerIdStore, IFile, IStore, IUser, IWallet } from '../src/types/types'
import logger from '../src/utils/logger'

async function deleteKeysByPattern(pattern: string) {
    let cursor = '0'
    do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = newCursor
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } while (cursor !== '0')
}

export const syncRedisToMongo = async () => {
    try {
        await deleteKeysByPattern('fetchLog:*')

        const walletKeys = await redis.keys(REDIS_WALLET_KEY('*'))
        const walletBulkOps = []

        const allKeys = await redis.keys(REDIS_USER_KEY('*'))
        const userKeys = allKeys.filter((key) => (key.match(/:/g) || []).length === 1)
        const userBulkOps = []

        const callerIdStoreKeys = await redis.keys(REDIS_CALLERID_KEY('*'))
        const callerIdStoreBulkOps = []

        const storeKeys = await redis.keys(REDIS_USERS_STORE_KEY('*'))
        const storeBulkOps = []

        const fileKeys = await redis.keys(REDIS_USER_FILE_KEY('*'))
        const fileBulkOps = []

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

        for (const key of userKeys) {
            const userString = await redis.get(key)
            if (!userString) continue

            const userObj = JSON.parse(userString) as IUser
            userBulkOps.push({
                updateOne: {
                    filter: { _id: userObj._id },
                    update: { $set: userObj }
                }
            })
            await redis.del(key)
        }

        for (const key of callerIdStoreKeys) {
            const redisCallerIdStores = await redis.hget(key, '*')
            if (!redisCallerIdStores) continue

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

        for (const key of fileKeys) {
            const redisfiles = await redis.lrange(key, 0, -1)

            if (!redisfiles.length) continue

            for (const strFile of redisfiles) {
                const file = JSON.parse(strFile) as IFile

                fileBulkOps.push({
                    updateOne: {
                        filter: { _id: file._id },
                        update: { $set: file },
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

        // Erasing all the data within the users:*
        const keys = await redis.keys('users:*')
        if (keys.length > 0) {
            await redis.del(...keys)
            logger.info(`Deleted ${keys.length} keys`)
        } else {
            logger.info('No keys found.')
        }

        //Writing data to database

        if (
            walletBulkOps.length > 0 ||
            callerIdStoreBulkOps.length > 0 ||
            storeBulkOps.length > 0 ||
            fileBulkOps.length > 0 ||
            userBulkOps.length > 0
        ) {
            await Promise.all([
                WalletModel.bulkWrite(walletBulkOps),
                CallerIdStoreModel.bulkWrite(callerIdStoreBulkOps),
                FileModel.bulkWrite(fileBulkOps),
                StoreModel.bulkWrite(storeBulkOps),
                UserModel.bulkWrite(userBulkOps)
            ])

            logger.info(`✅ Synced redis data to MongoDB`)
        } else {
            logger.info('⚠️ No data found in Redis')
        }
    } catch (error) {
        logger.error('❌ Error syncing data from redis to DB:', error)
    }
}

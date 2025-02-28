import Redis from 'ioredis'
import { redisConnection } from '../config/redis'
import { Iwallet, WalletModel } from '../models/Wallet'
import logger from '../utils/logger'
import { CallerIdStoreModel, ICallerIdStore } from '../models/CallerIdStore'

export const redis = new Redis({ ...redisConnection })

export const syncRedisToMongo = async () => {
    try {
        const walletKeys = await redis.keys('users:wallet:*')
        const walletBulkOps = []

        const callerIdStoreKeys = await redis.keys('users:callerIds:*')
        const callerIdStoreBulkOps = []

        for (const key of walletKeys) {
            const walletString = await redis.get(key)
            if (!walletString) continue

            const walletObj = JSON.parse(walletString) as Iwallet
            walletBulkOps.push({
                updateOne: {
                    filter: { _id: walletObj._id },
                    update: { $set: walletObj },
                    upsert: true
                }
            })

            await redis.del(key);
        }

        for (const key of callerIdStoreKeys) {
            const redisCallerIdStores = await redis.lrange(key, 0, -1);
            
            if (!redisCallerIdStores.length) continue; 
        
            for (const store of redisCallerIdStores) {
                const callerIdStore = JSON.parse(store) as ICallerIdStore;
        
                callerIdStoreBulkOps.push({
                    updateOne: {
                        filter: { _id: callerIdStore._id },
                        update: { $set: callerIdStore },
                        upsert: true
                    }
                });
            }
        
            await redis.del(key);
        }
        

        if (walletBulkOps.length > 0 || callerIdStoreBulkOps.length > 0) {
            await Promise.all([
                WalletModel.bulkWrite(walletBulkOps),
                CallerIdStoreModel.bulkWrite(callerIdStoreBulkOps),
            ])

            logger.info(`✅ Synced redis data to MongoDB`)
        } else {
            logger.info('⚠️ No wallets found in Redis')
        }
    } catch (error) {
        logger.error('❌ Error syncing wallets:', error)
    }
}

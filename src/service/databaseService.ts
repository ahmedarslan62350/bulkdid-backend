import mongoose, { Connection } from 'mongoose'
import config from '../config/config'

export let databaseConnection: Connection | null = null

export default {
    connect: async () => {
        try {
            await mongoose.connect(config.DATABASE_URL as string, {
                dbName: config.DATABASE_NAME as string
            })
            databaseConnection = mongoose.connection
            return databaseConnection
        } catch (error) {
            throw error
        }
    }
}

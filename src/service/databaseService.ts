import mongoose from 'mongoose'
import config from '../config/config'

export default {
    connect: async () => {
        try {
            await mongoose.connect(config.DATABASE_URL as string, {
                dbName: config.DATABASE_NAME as string,
            })
            return mongoose.connection
        } catch (error) {
            throw error
        }
    }
}

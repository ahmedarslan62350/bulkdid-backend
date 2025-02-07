import { config } from 'dotenv-flow'

config()

export default {
    // SERVER
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,

    // DATABASE
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_NAME: process.env.DATABASE_NAME,
    
    // APPLICATION
    JWT_TOKEN: process.env.JWT_TOKEN,

    // RATE_LIMITING
    POINTS_PER_SECOND: process.env.POINTS_PER_SECOND,
    DURATION: process.env.DURATION
}

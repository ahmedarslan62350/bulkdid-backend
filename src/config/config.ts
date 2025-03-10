import { config } from 'dotenv-flow'

config()

export default {
    // SERVER
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,

    // DATABASE
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_NAME: process.env.DATABASE_NAME,

    // APPLICATION
    JWT_TOKEN_SECRET: process.env.JWT_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_EXPIRATION_TIME: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,

    // RATE_LIMITING
    POINTS_PER_SECOND: process.env.POINTS_PER_SECOND,
    DURATION: process.env.DURATION,

    // NODE_MAILER
    MAILER_SECURE: process.env.NODE_MAILER_SECURE,
    MAILER_PORT: process.env.NODE_MAILER_PORT,
    MAILER_USER: process.env.NODE_MAILER_USER,
    MAILER_PASSWORD: process.env.NODE_MAILER_PASS,

    // OTHERS
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    COST_PER_CALLERID_CHECK: process.env.COST_PER_CALLERID_CHECK,
    COST_PER_CALLERID_FETCH: process.env.COST_PER_CALLERID_FETCH,
    TIME_TO_UPDATE_DB_BY_REDIS: process.env.TIME_TO_UPDATE_DB_BY_REDIS,
    GEOLOCATION_API_URL: process.env.GEOLOCATION_API_URL,
    TIME_TO_UPDATE_LOG: process.env.TIME_TO_UPDATE_LOG
}

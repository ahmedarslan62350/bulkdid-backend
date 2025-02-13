import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import config from '../config/config'
import logger from './logger'

export default {
    verifyJWT: (token: string): boolean | object => {
        try {
            const decodedData = jwt.verify(token, config.JWT_TOKEN_SECRET as string) as JwtPayload
            return decodedData
        } catch (error) {
            logger.error(error)
            return false
        }
    },
    signJWT: (data: object, options: SignOptions): boolean | string => {
        try {
            const token = jwt.sign(data, config.JWT_TOKEN_SECRET as string, options)
            return token
        } catch (error) {
            logger.error(error as string, { success: false, message: 'Error while creating JWT token' })
            return false
        }
    }
}

import { IAccessTokenData } from './controller/auth/login'

declare module 'express-serve-static-core' {
    export interface Request extends Request {
        user?: IAccessTokenData
        file?: Express.Multer.File & { callerIds: string[] | null }
    }
}

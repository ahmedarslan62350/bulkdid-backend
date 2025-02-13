// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express'
import { IAccessTokenData } from './controller/auth/login'

declare module 'express-serve-static-core' {
    export interface Request extends Request {
        user?: IAccessTokenData
    }
}

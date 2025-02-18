import { IAccessTokenData } from '../controller/auth/login'

declare namespace Express {
    export interface Request {
        user: IAccessTokenData
    }
}

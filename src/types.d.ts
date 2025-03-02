import { Request as R } from 'express-serve-static-core'; // Use express-serve-static-core here
import { IAccessTokenData } from './controller/auth/login';
import { IGeoIP } from './middleware/ipDets';

declare module 'express-serve-static-core' {
    export interface Request extends R {
        user?: IAccessTokenData | null;
        ipDets?: IGeoIP | null;
        file?: Express.Multer.File & { callerIds: string[] | null }; // Extend file type with callerIds
    }
}

// You do not need to augment the 'express' module or declare global here

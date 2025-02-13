import { NextFunction, Request, Response } from 'express'
import httpResponse from '../utils/httpResponse'
import responseMessage from '../constants/responseMessage'
import httpError from '../utils/httpError'
import quicker from '../utils/quicker'
import register from './auth/register'
import verify from './auth/verify'
import resend from './auth/resend'
import login from './auth/login'
import logout from './auth/logout'
import _delete from './auth/delete'
import updatePassword from './auth/updatePassword'

export default {
    self: (req: Request, res: Response, NextFn: NextFunction) => {
        try {
            // throw new Error('this is error')
            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { imageUrl: 'http://localhost:8080/images' })
        } catch (error) {
            httpError(NextFn, error, req, 500)
        }
    },

    health: (req: Request, res: Response, NextFn: NextFunction) => {
        try {
            const systemHealth = quicker.getSystemDetails()
            const applicationHealth = quicker.getApplicationDetails()

            httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, { systemHealth, applicationHealth })
        } catch (error) {
            httpError(NextFn, error, req, responseMessage.INTERNAL_SERVER_ERROR.code)
        }
    },
    register,
    verify,
    resend,
    login,
    logout,
    _delete,
    updatePassword
}

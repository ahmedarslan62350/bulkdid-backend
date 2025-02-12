import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import bcrypt from 'bcryptjs'
import config from '../../config/config'
import httpResponse from '../../utils/httpResponse'
import jwt from 'jsonwebtoken'
import loginSchema from '../../validations/login.validation'
import { ObjectId } from 'mongoose'

export interface ILogin {
    email: string
    password: string
}

export interface IAccessTokenData {
    _id: ObjectId;
    email:string;
    name: string
    role: 'admin' | 'user'
    walletId: ObjectId
    store: ObjectId
    isVerified: boolean
    sessions: [string],
    createdAt?: Date
    updatedAt?: Date
}

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const data = (await req.body) as ILogin

        if (!data) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const { email, password } = data

        if (!email || !password) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }
        const result = loginSchema.safeParse(data)

        if (!result.success) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, result.error?.errors[0]?.message)
            return
        }

        const user = await UserModel.findOne({ email })

        if (!user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.EMAIL_INVALID)
            return
        }
        const isPasswordMatch = await bcrypt.compare(password,user.password)
        if (!isPasswordMatch) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.PASSWORD_MISMATCH)
            return
        }

        const accessTokenData:IAccessTokenData = {
            _id: user._id,
            email,
            name: user.name,
            role: user.role,
            walletId: user.walletId,
            store: user.store,
            isVerified: user.isVerified,
            sessions: user.sessions,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
        const refreshTokenData = {
            _id: user._id
        }

        const accessToken = jwt.sign(accessTokenData, config.JWT_TOKEN_SECRET as string, { expiresIn: '1h' })
        const refreshToken = jwt.sign(refreshTokenData, config.JWT_TOKEN_SECRET as string, { expiresIn: '30d' })
        const ip = req?.ip ? req.ip : '127.0.0.1'

        res.cookie('token', accessToken)
        user.refreshToken = refreshToken
        user.sessions.push(ip)

        await user.save()
        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User logined successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

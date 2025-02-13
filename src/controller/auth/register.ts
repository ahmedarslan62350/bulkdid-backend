import { NextFunction, Request, Response } from 'express'
import logger from '../../utils/logger'
import responseMessage from '../../constants/responseMessage'
import httpError from '../../utils/httpError'
import { UserModel } from '../../models/User'
import config from '../../config/config'
import { WalletModel } from '../../models/Wallet'
import { StoreModel } from '../../models/Store'
import httpResponse from '../../utils/httpResponse'
import registerSchema from '../../validations/register.validation'
import nodeMailerHTML from '../../constants/nodemailerHTML'
import { emailQueue } from '../../queues/emailQueue'
import jwtVerification from '../../utils/jwtVerification'

export interface IRegister {
    email: string
    password: string
    confirmPassword: string
    name: string
    accountNumber: string
}

export default async function (req: Request, res: Response, next: NextFunction) {
    try {
        const data = (await req.body) as IRegister

        if (!data) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const { email, password, confirmPassword, name, accountNumber } = data

        if (!email || !password || !confirmPassword || !name || !accountNumber) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.LESS_DATA)
            return
        }

        const result = registerSchema.safeParse(data)

        if (!result.success) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, result.error?.errors[0]?.message)
            return
        }

        if (password !== confirmPassword) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.PASSWORD_MISMATCH)
            return
        }

        const user = await UserModel.findOne({ email })

        if (user) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, responseMessage.VALIDATION_ERROR.EMAIL_ALREADY_EXISTS)
            return
        }

        const newUser = new UserModel({
            email,
            password,
            name,
            role: email === config.ADMIN_EMAIL ? 'admin' : 'user'
        })

        const wallet = new WalletModel({
            ownerId: newUser._id,
            accountNumber: accountNumber
        })

        const store = new StoreModel({
            ownerId: newUser._id,
            name: `${name}'s store`
        })

        const verifyCode = Math.floor(100000 + Math.random() * 900000)
        const html = nodeMailerHTML.registerHTML(verifyCode)
        const subject = nodeMailerHTML.subject(name)

        await emailQueue.add('sendVerifyCode', {
            email,
            subject,
            html
        })

        newUser.verifyCode = verifyCode
        newUser.store = store._id
        newUser.walletId = wallet._id

        await Promise.all([newUser.save(), wallet.save(), store.save()])

        const header = jwtVerification.signJWT({ email }, { expiresIn: '1h' })
        if (!header) {
            httpResponse(req, res, responseMessage.BAD_REQUEST.code, 'Error signing jwt token')
            return
        }
        
        res.cookie('email', header)

        setTimeout(
            () => {
                void (async () => {
                    const user = await UserModel.findOne({ email })

                    if (!user) return

                    if (!user.isVerified) {
                        await Promise.all([
                            UserModel.findByIdAndDelete(user._id),
                            StoreModel.findByIdAndDelete(store._id),
                            WalletModel.findByIdAndDelete(wallet._id)
                        ])
                    }
                })()
            },
            1000 * (parseInt(config.JWT_REFRESH_TOKEN_EXPIRATION_TIME as string) + 3600)
        )

        httpResponse(req, res, responseMessage.SUCCESS.code, responseMessage.SUCCESS.message, {
            success: true,
            message: 'User account created successfully'
        })
    } catch (error) {
        logger.error(responseMessage.UNPROCESSABLE_ENTITY.message, { error })
        httpError(next, error, req, responseMessage.UNPROCESSABLE_ENTITY.code)
    }
}

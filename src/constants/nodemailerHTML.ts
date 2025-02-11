import config from '../config/config'

export default {
    subject: (name: string) => `Hey ${name.toUpperCase()}!`,
    registerHTML: (otp: number) => `
                    <h1>Verify your email address</h1>
                    <p>Your OTP is ${otp}</p>
                    <p>To complete your registration, please click the following link:</p>
                    <a href="${config.FRONTEND_URL}/verify-email/${otp}">Verify Email</a>
                `
}

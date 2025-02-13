import config from '../config/config'

export default {
    subject: (name: string) => `Hey ${name.toUpperCase()}!`,
    registerHTML: (otp: number) => `
                    <h1>Verify your email address</h1>
                    <p>Your OTP is ${otp}</p>
                    <p>To complete your registration, please click the following link:</p>
                    <a href="${config.FRONTEND_URL}/verify-email/${otp}">Verify Email</a>
                `,
    verification: (name: string) => `
                    <h1>Hey ${name}!</h1>
                    <p>Your account successfully verified and created.</p>
                `,
    passwordChanged: (name: string) => `
                    <h1>Hey ${name}!</h1>
                    <p>You have changed your password successfully</p>
                `,
    deleteAccount: (name: string) => `
                <h1>Hey ${name}!</h1>
                <p>You have deleted your account</p>
            `            
}

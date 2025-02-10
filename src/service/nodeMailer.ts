import nodemailer from 'nodemailer'
import config from '../config/config'

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: config.MAILER_USER,
        pass: config.MAILER_PASSWORD
    }
})

export default transporter
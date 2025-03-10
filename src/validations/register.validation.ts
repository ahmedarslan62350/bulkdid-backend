import z from 'zod'
import config from '../config/config'

const passwordPolicy = config.PASSWORD_POLICY // Default to BASIC

// Define the base password schema
let passwordSchema = z.string().min(8, 'The password must be at least 8 characters')

if (passwordPolicy === 'medium') {
    passwordSchema = passwordSchema
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
} else if (passwordPolicy === 'strong') {
    passwordSchema = passwordSchema
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol')
}

const registerSchema = z
    .object({
        name: z.string().min(4, 'The name must be at least 4 characters long').max(30, 'The name must be less than 30 characters'),
        email: z.string().min(11, 'The email must be at least of 11 characters').max(60, 'The email must be less than 60 characters'),
        password: passwordSchema,
        confirmPassword: passwordSchema,
        accountNumber: z.string().min(10, 'The account number must be at least 10 characters')
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })

export default registerSchema

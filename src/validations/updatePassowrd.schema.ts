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

const updatePasswordSchema = z
    .object({
        newPassword: passwordSchema,
        confirmPassword: passwordSchema,
        currentPassword: passwordSchema
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    })

export default updatePasswordSchema

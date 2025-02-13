import z from 'zod'

const updatePasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, 'The password must be at least of 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
        confirmPassword: z
            .string()
            .min(8, 'The password must be at least of 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
        currentPassword: z
            .string()
            .min(8, 'The password must be at least of 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default updatePasswordSchema

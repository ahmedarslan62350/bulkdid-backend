import z from 'zod'

const registerSchema = z
    .object({
        name: z.string().min(4, 'The name must be at least 4 characters long').max(30, 'The name must be less than 30 characters'),
        email: z.string().min(11, 'The email must be at least of 11 characters').max(60, 'The email must be less than 60 characters '),
        password: z
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
        accountNumber: z.string().min(10, 'The account number must at least 10 characters')
    })
    .refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default registerSchema

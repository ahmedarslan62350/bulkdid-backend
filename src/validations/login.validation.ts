import z from 'zod'

const loginSchema = z.object({
    email: z.string().min(11, 'The email must be at least of 11 characters').max(60, 'The email must be less than 60 characters '),
    password: z
        .string()
        .min(8, 'The password must be at least of 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol')
})

export default loginSchema

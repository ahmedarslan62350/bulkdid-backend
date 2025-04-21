import z from 'zod'

const loginSchema = z.object({
    email: z.string().min(11, 'The email must be at least of 11 characters').max(60, 'The email must be less than 60 characters '),
    password: z.string().min(8, 'The password must be at least of 8 characters')
})

export default loginSchema

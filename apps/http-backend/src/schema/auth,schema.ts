import {z} from "zod"
export const signupSchema = z.object({
    email:z.email(),
    name:z.string().min(3),
    password:z.string().min(6)
})
export type signupTyppe = z.infer<typeof signupSchema>
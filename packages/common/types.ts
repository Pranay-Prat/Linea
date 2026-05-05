import {z} from "zod"
export const signupSchema = z.object({
    username:z.string().min(3).max(20),
    name:z.string().min(3),
    password:z.string().min(6)
})
export const loginSchema = z.object({
    username:z.string().min(3).max(20),
    password:z.string().min(6)
})
export const createRoomSchema= z.object({
    roomName:z.string().min(3).max(20)
})
export type signupType = z.infer<typeof signupSchema>
export type loginType = z.infer<typeof loginSchema>
export type createRoomType = z.infer<typeof createRoomSchema>
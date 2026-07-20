import { z } from "zod"
export const signupSchema = z.object({
    email:z.email("Please enter a valid email address"),
    name:z.string().min(3),
    password:z.string().min(6)
})
export const loginSchema = z.object({
    email:z.email(),
    password:z.string().min(6)
})
export const createRoomSchema= z.object({
    roomName:z.string().min(3).max(20)
})
export type signupType = z.infer<typeof signupSchema>
export type loginType = z.infer<typeof loginSchema>
export type createRoomType = z.infer<typeof createRoomSchema>

export type ElementType = "rectangle" | "ellipse" | "arrow" | "line" | "freedraw";

export type WhiteboardElement = {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    strokeColor: string;
    seed: number;
};
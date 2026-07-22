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

export enum ElementType {
    RECTANGLE = "RECTANGLE",
    ELLIPSE = "ELLIPSE",
    DIAMOND = "DIAMOND",
    LINE = "LINE",
    ARROW = "ARROW",
    FREEDRAW = "FREEDRAW",
    TEXT = "TEXT"
}

export type Point = {
    x: number;
    y: number;
};

export type BaseElement = {
    id: string;
    x: number;
    y: number;
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    seed?: number;
};

export type RectangleElement = BaseElement & {
    type: ElementType.RECTANGLE;
    width: number;
    height: number;
};

export type EllipseElement = BaseElement & {
    type: ElementType.ELLIPSE;
    width: number;
    height: number;
};

export type DiamondElement = BaseElement & {
    type: ElementType.DIAMOND;
    width: number;
    height: number;
};

export type LineElement = BaseElement & {
    type: ElementType.LINE;
    width: number;
    height: number;
};

export type ArrowElement = BaseElement & {
    type: ElementType.ARROW;
    width: number;
    height: number;
};

export type FreedrawElement = BaseElement & {
    type: ElementType.FREEDRAW;
    points: Point[];
    width?: number;
    height?: number;
};

export type TextElement = BaseElement & {
    type: ElementType.TEXT;
    text: string;
    fontSize: number;
    width?: number;
    height?: number;
};

export type WhiteboardElement =
    | RectangleElement
    | EllipseElement
    | DiamondElement
    | LineElement
    | ArrowElement
    | FreedrawElement
    | TextElement;
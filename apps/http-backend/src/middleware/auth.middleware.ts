import { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config"
interface AuthTokenPayload extends JwtPayload {
    userId: string;
}

function isAuthTokenPayload(
    decoded: string | JwtPayload
): decoded is AuthTokenPayload {
    return typeof decoded !== "string" && typeof decoded.userId === "string";
}
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies["linea-token"];
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }
    
    try {
        if (!JWT_SECRET)
            return res.status(500).json({
                message: "JWT Secret is not configured",
                status: "failed"
            })
        const decoded = jwt.verify(token, JWT_SECRET)
        if (!isAuthTokenPayload(decoded)) {
            return res.status(401).json({
                message: "Unauthorized access, invalid token"
            })
        }
        req.userId=decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token"
        })
    }
}
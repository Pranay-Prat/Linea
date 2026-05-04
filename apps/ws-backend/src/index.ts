import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken"

const jwtSecret = process.env.JWT_SECRET || "replace_with_secure_secret";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
    const url = request.url;
    if (!url) return;
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") || "";
    let decoded: jwt.JwtPayload | string | undefined;
    try {
        decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
        ws.close();
        return;
    }
    if (typeof decoded === "string" || !decoded || !("userId" in decoded) || !decoded.userId) {
        ws.close();
        return;
    }
    const userId = (decoded as jwt.JwtPayload & { userId?: string }).userId;

    ws.on("message", function message(data) {
        ws.send("something")
    })
})
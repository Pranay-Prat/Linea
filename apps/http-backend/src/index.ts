import express from "express";
import cookieParser from "cookie-parser";
import roomRouter from "./routes/room.routes"
import authRouter from "./routes/auth.routes"
import chatRouter from "./routes/chat.routes"
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use("/api/auth",authRouter);
app.use("/api/room",roomRouter);
app.use("/api/chat",chatRouter);
app.listen(3001, () => {
    console.log("HTTP server is running at Port 3001")
});
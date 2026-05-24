import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { chatController } from "../controller/chat.controller";
const router = express.Router();
router.get("/get-chats/:roomId",authMiddleware,chatController.getChats)
export default router;

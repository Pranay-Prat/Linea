import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roomController } from "../controller/room.controller";
const router = express.Router();
router.post("/create-room",authMiddleware,roomController.createRoom);
export default router;

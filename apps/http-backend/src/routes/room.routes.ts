import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
const router = express.Router();
router.post("/create-room",authMiddleware);
export default router;

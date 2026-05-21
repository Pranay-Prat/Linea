import express from "express";
import { authController } from "../controller/auth.controller";
const router = express.Router();
router.post("/signin",authController.userSignup);
router.post("/signup",authController.userLogin)
export default router;

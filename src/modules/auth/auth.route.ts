import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshAccessToken);
router.post("/logout", authController.logoutUser);

export const authRoute = router;

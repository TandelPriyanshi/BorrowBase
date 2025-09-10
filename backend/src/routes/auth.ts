import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/refresh", authController.refreshToken.bind(authController));

// Protected routes (authentication required)
router.get("/profile", authenticateToken, authController.getProfile.bind(authController));
router.get("/profile/complete", authenticateToken, authController.getCompleteProfile.bind(authController));
router.put("/profile", authenticateToken, authController.updateProfile.bind(authController));
router.post("/update-location", authenticateToken, authController.updateLocation.bind(authController));
router.post("/logout", authenticateToken, authController.logout.bind(authController));
router.post("/change-password", authenticateToken, authController.changePassword.bind(authController));

export default router;

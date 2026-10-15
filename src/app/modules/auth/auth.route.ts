import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import {
	loginSchema,
	registerSchema,
	resendOtpSchema,
	verifyOtpSchema,
} from "./auth.schema";

const router = Router();

router.post(
	"/register",
	validateRequest(registerSchema),
	AuthController.registerUser,
);

router.post(
	"/verify-email",
	validateRequest(verifyOtpSchema),
	AuthController.verifyEmail,
);

router.post(
	"/resend-otp",
	validateRequest(resendOtpSchema),
	AuthController.resendOtp,
);

router.post("/login", validateRequest(loginSchema), AuthController.login);

// refresh needs no auth() guard — the access token may already be expired
router.post("/refresh", AuthController.refreshSession);

router.post("/logout", auth(), AuthController.logout);

router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;

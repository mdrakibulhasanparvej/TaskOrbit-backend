import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import {
	forgotPasswordSchema,
	googleLoginSchema,
	loginSchema,
	registerSchema,
	resendOtpSchema,
	resetPasswordSchema,
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

router.post(
	"/google",
	validateRequest(googleLoginSchema),
	AuthController.googleLogin,
);

router.post(
	"/forgot-password",
	validateRequest(forgotPasswordSchema),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(resetPasswordSchema),
	AuthController.resetPassword,
);

// refresh needs no auth() guard — the access token may already be expired
router.post("/refresh", AuthController.refreshSession);

router.post("/logout", auth(), AuthController.logout);

router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;

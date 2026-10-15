import crypto from "node:crypto";
import path from "node:path";
import ejs from "ejs";
import status from "http-status";
import type { Role } from "../../../../generated/prisma/enums";
import config from "../../config";
import googleClient from "../../lib/googleAuth";
import transporter, { brandLogoAttachment } from "../../lib/nodeMailer";
import { prisma } from "../../lib/prisma";
import redisClient from "../../lib/redis";
import type { IJwtPayload } from "../../types";
import AppError from "../../utils/appError";
import { comparePassword, hashPassword } from "../../utils/hashPassword";
import { signToken, verifyToken } from "../../utils/jwt.js";
import { getPlatformSettings } from "../../utils/platformSettings";
import { verifyOtp } from "../../utils/verifyOtp";
import type {
	TForgotPasswordPayload,
	TGoogleLoginPayload,
	TLoginPayload,
	TRegisterPayload,
	TResendOtpPayload,
	TResetPasswordPayload,
	TVerifyOtpPayload,
} from "./auth.schema";

const OTP_TTL_SECONDS = 60 * 5;
const RESEND_COOLDOWN_SECONDS = 60;
const EXPIRATION_MINUTES = 5;

const otpRedisKey = (email: string) => `verify-email-otp:${email}`;
const resendRedisKey = (email: string) => `otp-resend-cooldown:${email}`;
const forgotPasswordRedisKey = (email: string) => `forgot-password-otp:${email}`;
const forgotPasswordCooldownKey = (email: string) =>
	`forgot-password-cooldown:${email}`;

const buildJwtPayload = (user: {
	id: string;
	email: string;
	role: Role;
}): IJwtPayload => {
	return { id: user.id, email: user.email, role: user.role };
};

const refreshTokenRedisKey = (userId: string) =>
	`active-refresh-token:${userId}`;

// deliberately longer than the refresh token lifetime: the JWT expiry is the
// real bound, this row only tracks which refresh token is the current one
const REFRESH_TRACKING_TTL_SECONDS = 30 * 24 * 60 * 60;

const hashToken = (token: string) =>
	crypto.createHash("sha256").update(token).digest("hex");

/**
 * Only one refresh token is valid per user. Tracking is best-effort on purpose:
 * a Redis hiccup must never lock a signed-in user out of their own session.
 */
const rememberRefreshToken = async (userId: string, refreshToken: string) => {
	try {
		await redisClient.set(
			refreshTokenRedisKey(userId),
			hashToken(refreshToken),
			{
				EX: REFRESH_TRACKING_TTL_SECONDS,
			},
		);
	} catch {
		// fail-open: the refresh token itself still has to be a valid JWT
	}
};

const isCurrentRefreshToken = async (userId: string, refreshToken: string) => {
	try {
		const tracked = await redisClient.get(refreshTokenRedisKey(userId));

		// nothing tracked yet (fresh login before this rule existed) → accept
		return !tracked || tracked === hashToken(refreshToken);
	} catch {
		return true;
	}
};

const revokeSession = async (userId: string) => {
	try {
		await redisClient.del(refreshTokenRedisKey(userId));
	} catch {
		// the cookies are cleared client side either way
	}
};

const signAccessToken = (payload: IJwtPayload) => {
	return signToken(payload, config.jwt_access_secret, config.jwt_access_time);
};

const signRefreshToken = (payload: IJwtPayload) =>
	signToken(
		// a unique jti makes every refresh token distinct, so rotation and
		// single-session revocation (see rememberRefreshToken) actually work
		{ ...payload, jti: crypto.randomUUID() },
		config.jwt_refresh_secret,
		config.jwt_refresh_time,
	);

/** Both session tokens are signed from the same identity payload. */
const buildSessionTokens = async (user: {
	id: string;
	email: string;
	role: Role;
}) => {
	const payload = buildJwtPayload(user);

	const tokens = {
		access_token: signAccessToken(payload),
		refresh_token: signRefreshToken(payload),
	};

	await rememberRefreshToken(user.id, tokens.refresh_token);

	return tokens;
};

const storeOtp = async (email: string) => {
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	if (config.environment === "development") {
		console.log(`[DEV]: User registration otp log -> ${otpValue}`);
	}

	await redisClient.set(otpRedisKey(email), otpValue, {
		expiration: {
			type: "EX",
			value: OTP_TTL_SECONDS,
		},
	});

	return otpValue;
};

const sendOtpMail = async (name: string, email: string, otpValue: string) => {
	const filePath = path.join(
		process.cwd(),
		"/src/app/templates/registration-otp.ejs",
	);
	const htmlData = {
		name,
		otp: otpValue,
		email,
		expirationMinutes: EXPIRATION_MINUTES,
	};
	const html = await ejs.renderFile(filePath, htmlData);

	try {
		await transporter.sendMail({
			from: config.email_sender,
			to: email,
			subject: "Your verification otp for TaskFlow",
			html,
			attachments: [brandLogoAttachment],
		});
	} catch (error) {
		console.log("OTP email could not be sent", error);

		// without SMTP credentials the OTP stays available on the dev console
		if (config.environment !== "development") {
			throw new AppError(
				status.BAD_GATEWAY,
				"Verification email could not be sent. please try again later",
			);
		}
	}
};

const registerUser = async (payload: TRegisterPayload) => {
	const { name, email, password, role } = payload;

	// platform switches: maintenance closes the door entirely (the auth routes
	// stay reachable so an ADMIN can log in and turn it off), while
	// registration_open=false only blocks new sign-ups
	const settings = await getPlatformSettings();

	if (settings.maintenance_mode) {
		throw new AppError(
			status.SERVICE_UNAVAILABLE,
			"Under maintenance. Registration is temporarily disabled.",
		);
	}

	if (!settings.registration_open) {
		throw new AppError(
			status.FORBIDDEN,
			"Registration is currently closed. Please contact support.",
		);
	}

	const isUserExists = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExists?.is_verified) {
		throw new AppError(
			status.CONFLICT,
			"User already exists with this email. please login",
		);
	}

	const hashedPassword = await hashPassword(password);

	if (isUserExists) {
		// registration never completed: refresh the pending account and re-send the OTP
		await prisma.user.update({
			where: { id: isUserExists.id },
			data: { name, password: hashedPassword, role },
		});
	} else {
		await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role,
				provider: "CREDENTIALS",
				is_verified: false,
			},
		});
	}

	const otpValue = await storeOtp(email);
	await sendOtpMail(name, email, otpValue);
};

const verifyEmail = async (payload: TVerifyOtpPayload) => {
	const user = await prisma.user.findUnique({
		where: { email: payload.email },
	});

	if (!user) {
		throw new AppError(
			status.NOT_FOUND,
			"No registration found for this email. please register",
		);
	}

	if (user.is_verified) {
		throw new AppError(status.CONFLICT, "Email already verified. please login");
	}

	await verifyOtp({
		otp: Number(payload.otp),
		otpKey: otpRedisKey(payload.email),
	});

	const verifiedUser = await prisma.user.update({
		where: { id: user.id },
		data: { is_verified: true, last_login_at: new Date() },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			avatar_url: true,
		},
	});

	return {
		...(await buildSessionTokens(verifiedUser)),
		user: verifiedUser,
	};
};

const resendOtp = async (payload: TResendOtpPayload) => {
	const { email } = payload;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(
			status.NOT_FOUND,
			"No registration found for this email. please register",
		);
	}

	if (user.is_verified) {
		throw new AppError(status.CONFLICT, "Email already verified. please login");
	}

	const isOnCooldown = await redisClient.get(resendRedisKey(email));

	if (isOnCooldown) {
		throw new AppError(
			status.TOO_MANY_REQUESTS,
			"Please wait a minute before requesting another code",
		);
	}

	const otpValue = await storeOtp(email);

	await redisClient.set(resendRedisKey(email), "1", {
		expiration: {
			type: "EX",
			value: RESEND_COOLDOWN_SECONDS,
		},
	});

	await sendOtpMail(user.name, email, otpValue);
};

const login = async (payload: TLoginPayload) => {
	const { email, password } = payload;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(status.NOT_FOUND, "No user found, please register");
	}

	if (user.is_deleted) {
		throw new AppError(status.NOT_FOUND, "No account found.");
	}

	if (user.user_status === "SUSPENDED") {
		throw new AppError(
			status.FORBIDDEN,
			"Your account is suspended. please contact support",
		);
	}

	if (!user.is_active) {
		throw new AppError(status.BAD_REQUEST, "Your account is inactive.");
	}

	if (!user.password) {
		throw new AppError(status.UNAUTHORIZED, "Invalid credentials");
	}

	const isPasswordValid = await comparePassword(password, user.password);

	if (!isPasswordValid) {
		throw new AppError(status.UNAUTHORIZED, "Invalid credentials");
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { last_login_at: new Date() },
	});

	return {
		...(await buildSessionTokens(user)),
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatar_url: user.avatar_url,
			need_password_change: user.need_password_change,
		},
	};
};

/**
 * Exchanges a valid refresh token for a brand new session: the refresh token is
 * rotated and the access token is renewed. The identity is re-read from the
 * database so role/status changes apply immediately instead of waiting for the
 * refresh token to expire.
 */
const refreshSession = async (refreshToken: string | undefined) => {
	if (!refreshToken) {
		throw new AppError(
			status.UNAUTHORIZED,
			"You are not logged in. Please log in to access this resource.",
		);
	}

	const decodedData = verifyToken(refreshToken, config.jwt_refresh_secret);

	if (!decodedData.success || !decodedData.data) {
		throw new AppError(
			status.UNAUTHORIZED,
			"Your session has expired. Please log in again",
		);
	}

	if (!(await isCurrentRefreshToken(decodedData.data.id, refreshToken))) {
		throw new AppError(
			status.UNAUTHORIZED,
			"Your session has expired. Please log in again",
		);
	}

	const user = await prisma.user.findUnique({
		where: { id: decodedData.data.id },
	});

	if (!user || user.is_deleted) {
		throw new AppError(status.UNAUTHORIZED, "No account found.");
	}

	if (user.user_status === "SUSPENDED") {
		throw new AppError(
			status.UNAUTHORIZED,
			"Your account is suspended. please contact support",
		);
	}

	if (!user.is_active) {
		throw new AppError(status.BAD_REQUEST, "Your account is inactive.");
	}

	if (!user.is_verified) {
		throw new AppError(
			status.BAD_REQUEST,
			"Your account is not verified. Please verify your account to access this resource.",
		);
	}

	return {
		...(await buildSessionTokens(user)),
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatar_url: user.avatar_url,
			need_password_change: user.need_password_change,
		},
	};
};

/**
 * Password reset step 1 — emails a 6-digit OTP (5 min TTL, 1 min resend
 * cooldown). Google-only accounts are rejected: their password is managed by
 * Google. In development the OTP is also printed to the server console.
 */
const forgotPassword = async (payload: TForgotPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || user.is_deleted) {
		throw new AppError(status.NOT_FOUND, "No account found for this email");
	}

	if (user.user_status === "SUSPENDED") {
		throw new AppError(
			status.FORBIDDEN,
			"Your account is suspended. please contact support",
		);
	}

	if (!user.is_verified) {
		throw new AppError(
			status.BAD_REQUEST,
			"Your account is not verified. please verify your email first",
		);
	}

	if (user.provider === "GOOGLE" || !user.password) {
		throw new AppError(
			status.FORBIDDEN,
			"This account signs in with Google. please use Google login",
		);
	}

	const isOnCooldown = await redisClient.get(forgotPasswordCooldownKey(email));

	if (isOnCooldown) {
		throw new AppError(
			status.TOO_MANY_REQUESTS,
			"Please wait a minute before requesting another code",
		);
	}

	const otpValue = crypto.randomInt(100000, 1000000).toString();

	if (config.environment === "development") {
		console.log(`[DEV]: Password reset otp log -> ${otpValue}`);
	}

	await redisClient.set(forgotPasswordRedisKey(email), otpValue, {
		expiration: {
			type: "EX",
			value: OTP_TTL_SECONDS,
		},
	});

	await redisClient.set(forgotPasswordCooldownKey(email), "1", {
		expiration: {
			type: "EX",
			value: RESEND_COOLDOWN_SECONDS,
		},
	});

	const filePath = path.join(
		process.cwd(),
		"/src/app/templates/forgot-password-otp.ejs",
	);
	const html = await ejs.renderFile(filePath, {
		name: user.name,
		email,
		otp: otpValue,
		expirationMinutes: EXPIRATION_MINUTES,
	});

	try {
		await transporter.sendMail({
			from: config.email_sender,
			to: email,
			subject: "Your password reset code for TaskFlow",
			html,
			attachments: [brandLogoAttachment],
		});
	} catch (error) {
		console.log("Password reset email could not be sent", error);

		// without SMTP credentials the OTP stays available on the dev console
		if (config.environment !== "development") {
			throw new AppError(
				status.BAD_GATEWAY,
				"Password reset email could not be sent. please try again later",
			);
		}
	}
};

/**
 * Password reset step 2 — verifies the OTP (single use, deletes it), hashes
 * the new password and revokes the tracked refresh token so any stolen
 * session dies with the old password.
 */
const resetPassword = async (payload: TResetPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || user.is_deleted) {
		throw new AppError(status.NOT_FOUND, "No account found for this email");
	}

	if (user.user_status === "SUSPENDED") {
		throw new AppError(
			status.FORBIDDEN,
			"Your account is suspended. please contact support",
		);
	}

	if (!user.is_verified) {
		throw new AppError(
			status.BAD_REQUEST,
			"Your account is not verified. please verify your email first",
		);
	}

	if (user.provider === "GOOGLE" || !user.password) {
		throw new AppError(
			status.FORBIDDEN,
			"This account signs in with Google. please use Google login",
		);
	}

	await verifyOtp({
		otp: Number(payload.otp),
		otpKey: forgotPasswordRedisKey(email),
	});

	const hashedPassword = await hashPassword(payload.new_password);

	await prisma.user.update({
		where: { id: user.id },
		// the flag forces a proper password change through the signed-in
		// change-password flow (cleared by PATCH /users/me/password)
		data: { password: hashedPassword, need_password_change: true },
	});

	// any active session was issued for the old password — kill it
	await revokeSession(user.id);

	const filePath = path.join(
		process.cwd(),
		"/src/app/templates/password-reset-success.ejs",
	);
	const html = await ejs.renderFile(filePath, { name: user.name });

	try {
		await transporter.sendMail({
			from: config.email_sender,
			to: email,
			subject: "Your TaskFlow password was changed",
			html,
			attachments: [brandLogoAttachment],
		});
	} catch (error) {
		// best-effort: the password is already changed at this point
		console.log("Password reset confirmation email could not be sent", error);
	}
};

/**
 * Google OAuth sign-in: the client sends a Google ID token (from
 * accounts.google.com / gapi), the server verifies it against GOOGLE_CLIENT_ID
 * and then either signs the user in, links Google to an existing credentials
 * account with the same (Google-verified) email, or creates a brand new
 * TEAM_MEMBER account. No OTP or password involved.
 */
const googleLogin = async (payload: TGoogleLoginPayload) => {
	if (!config.google_client_id) {
		throw new AppError(
			status.INTERNAL_SERVER_ERROR,
			"Google login is not configured on this server",
		);
	}

	let idTokenPayload:
		| { email?: string; sub?: string; name?: string; picture?: string }
		| undefined;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.id_token,
			audience: config.google_client_id,
		});

		idTokenPayload = ticket.getPayload();
	} catch {
		throw new AppError(
			status.UNAUTHORIZED,
			"Google login failed. the ID token is invalid or expired",
		);
	}

	if (!idTokenPayload?.email || !idTokenPayload.sub) {
		throw new AppError(
			status.UNAUTHORIZED,
			"Google ID token is missing the email claim",
		);
	}

	const email = idTokenPayload.email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({ where: { email } });

	let user = existingUser;

	if (existingUser) {
		if (existingUser.is_deleted) {
			throw new AppError(status.NOT_FOUND, "No account found.");
		}

		if (existingUser.user_status === "SUSPENDED") {
			throw new AppError(
				status.FORBIDDEN,
				"Your account is suspended. please contact support",
			);
		}

		if (!existingUser.is_active) {
			throw new AppError(status.BAD_REQUEST, "Your account is inactive.");
		}

		if (existingUser.provider === "GOOGLE") {
			// same Google account (or a re-linked one) → keep the profile in sync
			user =
				existingUser.google_id === idTokenPayload.sub
					? existingUser
					: await prisma.user.update({
							where: { id: existingUser.id },
							data: {
								google_id: idTokenPayload.sub,
								avatar_url: existingUser.avatar_url ?? idTokenPayload.picture ?? null,
							},
						});
		} else {
			// credentials account → link it to Google; the email is Google-verified
			user = await prisma.user.update({
				where: { id: existingUser.id },
				data: {
					google_id: idTokenPayload.sub,
					provider: "GOOGLE",
					is_verified: true,
					avatar_url: existingUser.avatar_url ?? idTokenPayload.picture ?? null,
				},
			});
		}
	} else {
		user = await prisma.user.create({
			data: {
				name: idTokenPayload.name || email.split("@")[0] || email,
				email,
				password: null,
				role: "TEAM_MEMBER",
				provider: "GOOGLE",
				google_id: idTokenPayload.sub,
				avatar_url: idTokenPayload.picture ?? null,
				is_verified: true,
			},
		});
	}

	if (!user) {
		throw new AppError(
			status.INTERNAL_SERVER_ERROR,
			"Google login failed. please try again",
		);
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { last_login_at: new Date() },
	});

	return {
		...(await buildSessionTokens(user)),
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatar_url: user.avatar_url,
			need_password_change: user.need_password_change,
		},
	};
};

const getMe = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		omit: { password: true },
	});

	if (!user) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	return user;
};

export const AuthService = {
	registerUser,
	verifyEmail,
	resendOtp,
	login,
	googleLogin,
	forgotPassword,
	resetPassword,
	refreshSession,
	revokeSession,
	getMe,
};

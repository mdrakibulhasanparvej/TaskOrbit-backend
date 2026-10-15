import type { Response } from "express";
import status from "http-status";
import config from "../../config";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const TTL_UNIT_MS: Record<string, number> = {
	s: SECOND,
	m: MINUTE,
	h: HOUR,
	d: DAY,
};

/** JWT style ttl ("1d", "12h", "30m", or seconds as a number) → milliseconds. */
const ttlToMs = (value: string | number | undefined, fallback: number) => {
	if (typeof value === "number") {
		return Number.isFinite(value) && value > 0 ? value * SECOND : fallback;
	}

	const match = /^(\d+)([smhd])$/.exec(value?.trim() ?? "");

	if (!match?.[1] || !match[2]) {
		return fallback;
	}

	return Number(match[1]) * (TTL_UNIT_MS[match[2]] ?? fallback);
};

// cookies track the JWT lifetimes instead of hardcoded values
const ACCESS_TOKEN_MAX_AGE = ttlToMs(config.jwt_access_time, 1 * DAY);
const REFRESH_TOKEN_MAX_AGE = ttlToMs(config.jwt_refresh_time, 7 * DAY);

const sessionCookieOptions = () => ({
	httpOnly: true,
	secure: config.environment !== "development",
	sameSite:
		config.environment === "development" ? ("lax" as const) : ("none" as const),
	path: "/",
});

/** access_token (1d) + refresh_token (7d), both HttpOnly — the login response additionally returns them in the body. */
const setSessionCookies = (
	res: Response,
	tokens: { access_token: string; refresh_token: string },
) => {
	const options = sessionCookieOptions();

	res.cookie("access_token", tokens.access_token, {
		...options,
		maxAge: ACCESS_TOKEN_MAX_AGE,
	});
	res.cookie("refresh_token", tokens.refresh_token, {
		...options,
		maxAge: REFRESH_TOKEN_MAX_AGE,
	});
};

const registerUser = catchAsync(async (req, res, _) => {
	await AuthService.registerUser(req.body);

	sendResponse(res, {
		status: status.OK,
		message: "OTP has been sent to email",
	});
});

const verifyEmail = catchAsync(async (req, res) => {
	const result = await AuthService.verifyEmail(req.body);

	setSessionCookies(res, result);

	sendResponse(res, {
		status: status.CREATED,
		message: "Email verified and user registration successful",
		data: { user: result.user },
	});
});

const resendOtp = catchAsync(async (req, res) => {
	await AuthService.resendOtp(req.body);

	sendResponse(res, {
		status: status.OK,
		message: "OTP has been sent to email",
	});
});

const login = catchAsync(async (req, res) => {
	const result = await AuthService.login(req.body);

	setSessionCookies(res, result);

	// Dev/test only: also expose the session tokens in the body so API clients
	// (Postman, scripts) can pick them up without reading the cookie jar.
	// Production keeps the cookie-only contract — HttpOnly cookies stay set in
	// every environment either way.
	const includeTokensInBody = config.environment !== "production";

	sendResponse(res, {
		message: "Login successful",
		data: {
			user: result.user,
			...(includeTokensInBody && {
				access_token: result.access_token,
				refresh_token: result.refresh_token,
			}),
		},
	});
});

const refreshSession = catchAsync(async (req, res) => {
	const header = req.headers.authorization;
	const bearerToken = header?.startsWith("Bearer ")
		? header.split(" ")[1]
		: header;

	const result = await AuthService.refreshSession(
		req.cookies?.refresh_token ?? bearerToken,
	);

	setSessionCookies(res, result);

	sendResponse(res, {
		message: "Session refreshed Successfully",
		data: { user: result.user },
	});
});

const logout = catchAsync(async (req, res) => {
	// kills the tracked refresh token so the session can't be resumed
	if (req.user?.id) {
		await AuthService.revokeSession(req.user.id);
	}

	const options = sessionCookieOptions();

	res.clearCookie("access_token", options);
	res.clearCookie("refresh_token", options);

	sendResponse(res, {
		message: "Logout successful",
	});
});

const getMe = catchAsync(async (req, res) => {
	const userId = req.user?.id as string;

	const result = await AuthService.getMe(userId);

	sendResponse(res, {
		message: "Profile data fetched Successfully",
		data: result,
	});
});

export const AuthController = {
	registerUser,
	verifyEmail,
	resendOtp,
	login,
	refreshSession,
	logout,
	getMe,
};

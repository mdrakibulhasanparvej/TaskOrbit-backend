import status from "http-status";
import type { Role } from "../../../generated/prisma/enums";
import config from "../config";
import AppError from "../utils/appError";
import { catchAsync } from "../utils/catchAsync";
import { verifyToken } from "../utils/jwt";
import { getPlatformSettings } from "../utils/platformSettings";

/**
 * Resolves the caller's role straight from the session token without touching
 * the database — the guard only needs to know whether the caller is an ADMIN,
 * and `auth()` further down the chain re-verifies everything properly.
 * Returns null for missing/invalid tokens or non-JWT values.
 */
const peekRole = (token: string | undefined): Role | null => {
	if (!token) {
		return null;
	}

	// a session token may be signed with either secret (same rule as auth())
	let decoded = verifyToken(token, config.jwt_access_secret);

	if (!decoded.success) {
		decoded = verifyToken(token, config.jwt_refresh_secret);
	}

	return decoded.success && decoded.data ? decoded.data.role : null;
};

/**
 * Platform-wide `maintenance_mode` guard. When the setting is off it is a
 * no-op; when it is on:
 *
 * - `/api/v1/auth/*` stays reachable so an ADMIN can still log in and turn
 *   maintenance off again (registration is separately blocked inside
 *   `AuthService.registerUser`);
 * - the Stripe webhook stays reachable so billing events are never lost —
 *   Stripe only retries for a limited window;
 * - every other request is allowed only for an ADMIN session, everything
 *   else gets 503.
 */
const maintenanceMode = catchAsync(async (req, _, next) => {
	const settings = await getPlatformSettings();

	if (!settings.maintenance_mode) {
		return next();
	}

	if (req.path.startsWith("/auth") || req.path === "/payments/webhook") {
		return next();
	}

	const bearerToken = req.headers.authorization?.startsWith("Bearer ")
		? req.headers.authorization?.split(" ")[1]
		: req.headers.authorization;

	const token =
		req.cookies?.access_token ?? req.cookies?.refresh_token ?? bearerToken;

	if (peekRole(token) === "ADMIN") {
		return next();
	}

	throw new AppError(
		status.SERVICE_UNAVAILABLE,
		"Under maintenance. Please try again later.",
	);
});

export default maintenanceMode;

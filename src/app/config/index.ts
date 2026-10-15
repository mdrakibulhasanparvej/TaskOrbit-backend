/** biome-ignore-all lint/style/noNonNullAssertion: <for env config> */
import path from "node:path";
import process, { env } from "node:process";
import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";

const envPath = path.join(process.cwd(), "/.env");

dotenv.config({ path: envPath, quiet: true });

export default {
	environment: env.ENVIRONMENT,
	port: env.PORT,
	frontend_url: env.FRONTEND_URL || "http://localhost:3000",
	database_url: env.DATABASE_URL!,
	bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS!,

	// JWT credentials
	jwt_access_secret: env.JWT_ACCESS_SECRET!,
	jwt_access_time: env.JWT_ACCESS_TIME as SignOptions["expiresIn"],
	jwt_refresh_secret: env.JWT_REFRESH_SECRET!,
	jwt_refresh_time: env.JWT_REFRESH_TIME as SignOptions["expiresIn"],

	// cloudinary credentials
	cloudinary_cloud_name: env.CLOUDINARY_CLOUD_NAME!,
	cloudinary_api_key: env.CLOUDINARY_API_KEY!,
	cloudinary_api_secret: env.CLOUDINARY_API_SECRET!,

	// redis credentials
	redis_username: env.REDIS_USERNAME!,
	redis_password: env.REDIS_PASSWORD!,
	redis_host: env.REDIS_HOST!,
	redis_port: env.REDIS_PORT!,

	// nodemailer credentials
	email_sender: env.EMAIL_SENDER!,
	google_app_password: env.GOOGLE_APP_PASSWORD!,

	// google oauth (ID token audience for POST /api/v1/auth/google)
	google_client_id: env.GOOGLE_CLIENT_ID,

	// platform admin credentials
	admin_name: env.ADMIN_NAME!,
	admin_email: env.ADMIN_EMAIL!,
	admin_password: env.ADMIN_PASSWORD!,

	// stripe
	stripe_secret_key: env.STRIPE_SECRET_KEY,
	stripe_webhook_secret: env.STRIPE_WEBHOOK_SECRET!,
};

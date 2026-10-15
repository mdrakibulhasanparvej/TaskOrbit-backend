import { OAuth2Client } from "google-auth-library";
import config from "../config";

/**
 * Google OAuth client used by `POST /api/v1/auth/google`.
 * The audience is `GOOGLE_CLIENT_ID` from the env — without it the service
 * layer answers 500 instead of silently accepting any signed token.
 */
const googleClient = new OAuth2Client(config.google_client_id);

export default googleClient;

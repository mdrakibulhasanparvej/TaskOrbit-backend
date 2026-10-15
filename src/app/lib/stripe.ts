import { Stripe } from "stripe";
import config from "../config";
import AppError from "../utils/appError";

const stripeSecretKey = config.stripe_secret_key;

if (!stripeSecretKey) {
	throw new AppError(404, "Stripe secret key missing");
}

const stripe = new Stripe(stripeSecretKey);

export default stripe;

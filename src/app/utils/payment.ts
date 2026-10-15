import status from "http-status";
import type Stripe from "stripe";
import type { Plan } from "../../../generated/prisma/enums";
import config from "../config";
import stripe from "../lib/stripe";
import AppError from "./appError";

export interface IStripeCheckoutSessionParams {
	customerEmail: string;
	userId: string;
	/**
	 * Anything but FREE — the service owns that rule, this layer only has to
	 * forward the value into Stripe metadata.
	 */
	plan: Plan;
	/** monthly price in the smallest currency unit (cents for USD) */
	unitAmount: number;
	/** display name shown on the hosted Stripe Checkout page */
	planLabel: string;
	successUrl: string;
	cancelUrl: string;
}

/**
 * Gateway glue only — pricing and every other business rule stay in
 * payment.service.ts. Inline `price_data` (instead of pre-created Stripe
 * Prices) means the demo needs no dashboard setup beyond a secret key.
 */
const createStripeCheckoutSession = async (
	params: IStripeCheckoutSessionParams,
): Promise<Stripe.Response<Stripe.Checkout.Session>> => {
	return await stripe.checkout.sessions.create({
		mode: "subscription",
		customer_email: params.customerEmail,
		success_url: params.successUrl,
		cancel_url: params.cancelUrl,
		metadata: { userId: params.userId, plan: params.plan },
		subscription_data: {
			metadata: { userId: params.userId, plan: params.plan },
		},
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: "usd",
					unit_amount: params.unitAmount,
					recurring: { interval: "month" },
					product_data: { name: `${params.planLabel} plan (monthly)` },
				},
			},
		],
	});
};

const retrieveStripeSession = async (
	sessionId: string,
): Promise<Stripe.Response<Stripe.Checkout.Session>> => {
	return await stripe.checkout.sessions.retrieve(sessionId);
};

/**
 * `current_period_end` lives on the subscription item in current Stripe API
 * versions, so the subscription has to be fetched by id.
 */
const retrieveStripeSubscription = async (
	subscriptionId: string,
): Promise<Stripe.Response<Stripe.Subscription>> => {
	return await stripe.subscriptions.retrieve(subscriptionId);
};

/**
 * Stripe signs the exact raw bytes of the body — this only works while the
 * route is guarded with `express.raw()` ahead of `express.json()` in app.ts.
 */
const verifyStripeSignature = (
	rawBody: Buffer,
	signature?: string,
): Stripe.Event => {
	if (!signature) {
		throw new AppError(status.BAD_REQUEST, "Missing Stripe signature header");
	}

	try {
		return stripe.webhooks.constructEvent(
			rawBody,
			signature,
			config.stripe_webhook_secret,
		);
	} catch {
		throw new AppError(status.BAD_REQUEST, "Invalid Stripe webhook signature");
	}
};

export {
	createStripeCheckoutSession,
	retrieveStripeSession,
	retrieveStripeSubscription,
	verifyStripeSignature,
};

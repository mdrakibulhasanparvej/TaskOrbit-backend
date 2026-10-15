import path from "node:path";
import ejs from "ejs";
import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import {
	NotificationType,
	PaymentGateway,
	PaymentStatus,
	Plan,
	ProjectStatus,
	SubscriptionStatus,
} from "../../../../generated/prisma/enums";
import config from "../../config";
import transporter, { brandLogoAttachment } from "../../lib/nodeMailer";
import { prisma } from "../../lib/prisma";
import type { IMeta } from "../../types";
import AppError from "../../utils/appError";
import recordAudit from "../../utils/audit";
import {
	createStripeCheckoutSession,
	type IStripeCheckoutSessionParams,
	retrieveStripeSession,
	retrieveStripeSubscription,
	verifyStripeSignature,
} from "../../utils/payment";
import { NotificationService } from "../notification/notification.service";
import type { IPaymentQuery, IPlanDefinition } from "./payment.interface";
import type { TCreateCheckoutPayload } from "./payment.schema";

/**
 * Service-layer pricing table — the project module keeps its own limit table
 * on purpose so plan checks never have to import this module (and therefore
 * never import the Stripe client).
 */
const PLANS: Record<Plan, IPlanDefinition> = {
	[Plan.FREE]: { label: "Free", price: 0, projects: 2, members: 3 },
	[Plan.PRO]: { label: "Pro", price: 12, projects: 15, members: 15 },
	[Plan.BUSINESS]: {
		label: "Business",
		price: 29,
		projects: null,
		members: null,
	},
};

const MONTHLY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

const ALLOWED_SORT_FIELDS = ["created_at", "amount", "plan", "status"] as const;

type TSortField = (typeof ALLOWED_SORT_FIELDS)[number];

type TCheckoutSession = Extract<
	TStripeEvent,
	{ type: "checkout.session.completed" }
>["data"]["object"];

type TStripeEvent = ReturnType<typeof verifyStripeSignature>;

type TInvoicePaidEvent = Extract<TStripeEvent, { type: "invoice.paid" }>;

type TSubscriptionDeletedEvent = Extract<
	TStripeEvent,
	{ type: "customer.subscription.deleted" }
>;

const paymentSelect = {
	id: true,
	plan: true,
	amount: true,
	currency: true,
	status: true,
	payment_gateway: true,
	transaction_id: true,
	created_at: true,
	updated_at: true,
	owner: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentSelect;

const subscriptionSelect = {
	id: true,
	plan: true,
	status: true,
	current_period_end: true,
	cancel_at_period_end: true,
	created_at: true,
	updated_at: true,
} satisfies Prisma.SubscriptionSelect;

const parsePlan = (value: string | undefined): Plan | null => {
	if (!value) {
		return null;
	}

	return Object.values(Plan).includes(value as Plan) ? (value as Plan) : null;
};

/**
 * Latest billing row for an owner — `null` means the owner has never paid and
 * is implicitly FREE. Only `activateSubscription` ever writes this table.
 */
const findLatestSubscription = async (ownerId: string) => {
	return await prisma.subscription.findFirst({
		where: { owner_id: ownerId },
		orderBy: { created_at: "desc" },
		select: subscriptionSelect,
	});
};

/** A plan only counts while its row is ACTIVE and its paid period is open. */
const isLiveSubscription = (
	subscription: Awaited<ReturnType<typeof findLatestSubscription>>,
) => {
	if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
		return false;
	}

	return (
		subscription.current_period_end === null ||
		subscription.current_period_end.getTime() > Date.now()
	);
};

const getPlans = async () => {
	return Object.values(Plan).map((plan) => ({
		plan,
		...PLANS[plan],
	}));
};

const getMySubscription = async (user: Express.User) => {
	const subscription = await findLatestSubscription(user.id);
	// `status: null` (no row) is how the response says "never subscribed"
	const plan = isLiveSubscription(subscription)
		? (subscription?.plan ?? Plan.FREE)
		: Plan.FREE;
	const definition = PLANS[plan];

	const [activeProjects, memberCount] = await Promise.all([
		prisma.project.count({
			where: { owner_id: user.id, status: { not: ProjectStatus.ARCHIVED } },
		}),
		prisma.projectMember.count({
			where: { project: { owner_id: user.id } },
		}),
	]);

	return {
		plan,
		label: definition.label,
		price: definition.price,
		status: subscription?.status ?? null,
		current_period_end: subscription?.current_period_end ?? null,
		cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
		limits: { projects: definition.projects, members: definition.members },
		usage: { projects: activeProjects, members: memberCount },
	};
};

const createCheckoutSession = async (
	user: Express.User,
	payload: TCreateCheckoutPayload,
) => {
	// the schema already rejects anything but a paid tier; keep the guard local
	// so a later schema change can't silently start selling the FREE plan
	const plan = parsePlan(payload.plan) ?? Plan.FREE;

	if (plan === Plan.FREE) {
		throw new AppError(
			status.BAD_REQUEST,
			"Only the PRO and BUSINESS plans can be purchased",
		);
	}

	const definition = PLANS[plan];

	const sessionParams: IStripeCheckoutSessionParams = {
		customerEmail: user.email,
		userId: user.id,
		plan,
		unitAmount: Math.round(definition.price * 100),
		planLabel: definition.label,
		successUrl: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: `${config.frontend_url}/payment/cancel`,
	};

	const session = await createStripeCheckoutSession(sessionParams);

	// PENDING until Stripe confirms — /verify and the webhook both flip it
	await prisma.payment.create({
		data: {
			plan,
			amount: definition.price,
			currency: "USD",
			status: PaymentStatus.PENDING,
			payment_gateway: PaymentGateway.STRIPE,
			transaction_id: session.id,
			owner_id: user.id,
		},
	});

	if (!session.url) {
		throw new AppError(
			status.BAD_GATEWAY,
			"Stripe did not return a checkout url",
		);
	}

	return { url: session.url, plan, amount: definition.price };
};

const stripeSubscriptionIdOf = (session: TCheckoutSession) => {
	const subscription = session.subscription;

	if (!subscription) {
		return null;
	}

	return typeof subscription === "string" ? subscription : subscription.id;
};

/** Stripe's period end, with a "now + one month" fallback for odd sessions. */
const resolvePeriodEnd = async (session: TCheckoutSession): Promise<Date> => {
	const subscriptionId = stripeSubscriptionIdOf(session);

	if (subscriptionId) {
		try {
			const subscription = await retrieveStripeSubscription(subscriptionId);
			const periodEnd = subscription.items.data[0]?.current_period_end;

			if (periodEnd) {
				return new Date(periodEnd * 1000);
			}
		} catch {
			// fall through to the default below
		}
	}

	return new Date(Date.now() + MONTHLY_PERIOD_MS);
};

const sendReceiptEmail = async (
	recipient: { name: string; email: string },
	plan: Plan,
	amount: number,
	currency: string,
	transactionId: string,
	renewalDate: Date | null,
) => {
	const filePath = path.join(
		process.cwd(),
		"/src/app/templates/payment-success.ejs",
	);
	const html = await ejs.renderFile(filePath, {
		name: recipient.name,
		planLabel: PLANS[plan].label,
		amount: amount.toFixed(2),
		currency: currency.toUpperCase(),
		transactionId,
		renewalDate: renewalDate ? renewalDate.toDateString() : "—",
	});

	try {
		await transporter.sendMail({
			from: config.email_sender,
			to: recipient.email,
			subject: `Your TaskFlow ${PLANS[plan].label} plan is active`,
			html,
			attachments: [brandLogoAttachment],
		});
	} catch (error) {
		console.log("Payment receipt email could not be sent", error);

		// without SMTP credentials the receipt stays visible on the dev console
		if (config.environment !== "development") {
			throw new AppError(
				status.BAD_GATEWAY,
				"Receipt email could not be sent. please try again later",
			);
		}
	}
};

/**
 * Side effects of a first activation. Deliberately best-effort: the money has
 * already been captured, so a Redis/SMTP hiccup must never fail the request.
 */
const announceActivation = async (
	ownerId: string,
	plan: Plan,
	amount: number,
	currency: string,
	transactionId: string,
	renewalDate: Date | null,
) => {
	const definition = PLANS[plan];

	try {
		await NotificationService.createNotification({
			user_id: ownerId,
			type: NotificationType.PAYMENT_SUCCESS,
			title: "Payment successful",
			message: `Your ${definition.label} plan is active — $${amount.toFixed(2)} ${currency.toUpperCase()} paid.`,
			link: "/billing",
			actor_id: null,
			actor_name: null,
		});
	} catch (error) {
		console.log("Payment notification could not be created", error);
	}

	const owner = await prisma.user.findUnique({
		where: { id: ownerId },
		select: { name: true, email: true, role: true },
	});

	if (!owner) {
		return;
	}

	// the checkout happened in Stripe, so the owner is the only actor we have
	await recordAudit({
		actor: { id: ownerId, name: owner.name, role: owner.role },
		action: "payment.success",
		entity: "payment",
		entityId: transactionId,
		meta: { plan, amount, currency },
	});

	await sendReceiptEmail(
		owner,
		plan,
		amount,
		currency,
		transactionId,
		renewalDate,
	);
};

/**
 * Single activation path shared by `/verify` and `checkout.session.completed`.
 * Idempotent on transaction_id: the PENDING → SUCCESS claim inside the
 * transaction happens exactly once, so a second call (webhook racing the
 * redirect, or a later replay) neither re-upgrades nor re-sends the receipt.
 */
const activateSubscription = async (session: TCheckoutSession) => {
	const transactionId = session.id;

	const result = await prisma.$transaction(async (tx) => {
		const payment = await tx.payment.findFirst({
			where: { transaction_id: transactionId },
		});

		if (!payment) {
			throw new AppError(
				status.NOT_FOUND,
				"No pending payment matches this checkout session",
			);
		}

		if (payment.status === PaymentStatus.SUCCESS) {
			return { payment, activated: false, renewalDate: null };
		}

		const claimed = await tx.payment.updateMany({
			where: { id: payment.id, status: PaymentStatus.PENDING },
			data: {
				status: PaymentStatus.SUCCESS,
				gateway_response: {
					session_id: session.id,
					amount_total: session.amount_total,
					currency: session.currency,
					subscription_id: stripeSubscriptionIdOf(session),
				},
			},
		});

		if (claimed.count === 0) {
			// a concurrent caller won the claim and has committed the upgrade
			const settled = await tx.payment.findUniqueOrThrow({
				where: { id: payment.id },
			});

			return { payment: settled, activated: false, renewalDate: null };
		}

		const purchasedPlan = parsePlan(session.metadata?.plan) ?? payment.plan;
		const renewalDate = await resolvePeriodEnd(session);

		// one row per owner — find-or-create rather than a schema unique
		const existing = await tx.subscription.findFirst({
			where: { owner_id: payment.owner_id },
			orderBy: { created_at: "asc" },
		});

		if (existing) {
			await tx.subscription.update({
				where: { id: existing.id },
				data: {
					plan: purchasedPlan,
					status: SubscriptionStatus.ACTIVE,
					current_period_end: renewalDate,
					cancel_at_period_end: false,
				},
			});
		} else {
			await tx.subscription.create({
				data: {
					owner_id: payment.owner_id,
					plan: purchasedPlan,
					status: SubscriptionStatus.ACTIVE,
					current_period_end: renewalDate,
				},
			});
		}

		const settled = await tx.payment.findUniqueOrThrow({
			where: { id: payment.id },
		});

		return { payment: settled, activated: true, renewalDate };
	});

	if (result.activated) {
		await announceActivation(
			result.payment.owner_id,
			result.payment.plan,
			result.payment.amount,
			result.payment.currency,
			result.payment.transaction_id ?? session.id,
			result.renewalDate,
		);
	}

	return result;
};

const verifyPayment = async (user: Express.User, sessionId: string) => {
	// owner check first — it is a local row lookup, so a session belonging to
	// someone else is refused without spending a Stripe round trip
	const payment = await prisma.payment.findFirst({
		where: { transaction_id: sessionId },
	});

	if (payment && payment.owner_id !== user.id) {
		throw new AppError(
			status.FORBIDDEN,
			"This checkout session belongs to another account",
		);
	}

	// already settled (by the webhook or an earlier call) — Stripe has nothing
	// left to confirm, so answering straight away keeps /verify idempotent
	if (payment && payment.status === PaymentStatus.SUCCESS) {
		return {
			plan: payment.plan,
			amount: payment.amount,
			transactionId: payment.transaction_id,
			status: payment.status,
		};
	}

	const session = await retrieveStripeSession(sessionId).catch(() => {
		throw new AppError(status.BAD_REQUEST, "Invalid checkout session id");
	});

	if (!payment) {
		throw new AppError(status.NOT_FOUND, "Payment not found");
	}

	if (session.payment_status !== "paid") {
		throw new AppError(status.BAD_REQUEST, "Payment is not complete yet");
	}

	const { payment: settled } = await activateSubscription(session);

	return {
		plan: settled.plan,
		amount: settled.amount,
		transactionId: settled.transaction_id,
		status: settled.status,
	};
};

/** `invoice.paid` — a renewal keeps the plan and pushes the period end forward. */
const extendRenewal = async (invoice: TInvoicePaidEvent["data"]["object"]) => {
	// the first invoice is already covered by checkout.session.completed
	if (invoice.billing_reason === "subscription_create") {
		return;
	}

	const userId = invoice.parent?.subscription_details?.metadata?.userId;

	if (!userId) {
		console.log("invoice.paid without a userId in subscription metadata");
		return;
	}

	const subscription = await prisma.subscription.findFirst({
		where: { owner_id: userId },
		orderBy: { created_at: "desc" },
		select: subscriptionSelect,
	});

	if (!subscription) {
		return;
	}

	const currentEnd =
		subscription.current_period_end &&
		subscription.current_period_end.getTime() > Date.now()
			? subscription.current_period_end.getTime()
			: Date.now();

	await prisma.subscription.update({
		where: { id: subscription.id },
		data: {
			plan: subscription.plan,
			status: SubscriptionStatus.ACTIVE,
			current_period_end: new Date(currentEnd + MONTHLY_PERIOD_MS),
			cancel_at_period_end: false,
		},
	});
};

/** `customer.subscription.deleted` — the paid period is over, limits return. */
const handleSubscriptionDeleted = async (
	stripeSubscription: TSubscriptionDeletedEvent["data"]["object"],
) => {
	const userId = stripeSubscription.metadata?.userId;

	if (!userId) {
		console.log("customer.subscription.deleted without a userId in metadata");
		return;
	}

	const subscription = await prisma.subscription.findFirst({
		where: { owner_id: userId },
		orderBy: { created_at: "desc" },
		select: subscriptionSelect,
	});

	if (!subscription) {
		return;
	}

	await prisma.subscription.update({
		where: { id: subscription.id },
		data: {
			plan: Plan.FREE,
			status: SubscriptionStatus.EXPIRED,
			cancel_at_period_end: false,
		},
	});
};

/**
 * Signature verification happens first (a bad signature throws 400); every
 * validly-signed event is acknowledged with 200 even when handling fails, so
 * Stripe never retries forever on our internal errors — failures are logged
 * instead. `/verify` stays authoritative for the success page.
 */
const handleWebhook = async (
	rawBody: Buffer,
	signature: string | undefined,
) => {
	const event = verifyStripeSignature(rawBody, signature);

	switch (event.type) {
		case "checkout.session.completed": {
			try {
				await activateSubscription(event.data.object);
			} catch (error) {
				console.log("checkout.session.completed could not activate", error);
			}
			break;
		}
		case "invoice.paid": {
			try {
				await extendRenewal(event.data.object);
			} catch (error) {
				console.log("invoice.paid could not extend the renewal", error);
			}
			break;
		}
		case "customer.subscription.deleted": {
			try {
				await handleSubscriptionDeleted(event.data.object);
			} catch (error) {
				console.log("customer.subscription.deleted could not downgrade", error);
			}
			break;
		}
		default:
			console.log(`Ignoring unhandled Stripe event type "${event.type}"`);
	}

	return { received: true };
};

const assertEnumFilter = <T extends string>(
	value: string | undefined,
	allowed: readonly T[],
	field: string,
): T | undefined => {
	if (!value) {
		return undefined;
	}

	if (!allowed.includes(value as T)) {
		throw new AppError(status.BAD_REQUEST, `Invalid ${field} filter`);
	}

	return value as T;
};

const listPayments = async (
	baseWhere: Prisma.PaymentWhereInput,
	query: IPaymentQuery,
) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || 10, 1);
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy as string | undefined;
	const sortField: TSortField =
		sortBy && (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortBy)
			? (sortBy as TSortField)
			: "created_at";
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const paymentStatus = assertEnumFilter(
		query.status,
		Object.values(PaymentStatus),
		"status",
	);
	const plan = assertEnumFilter(query.plan, Object.values(Plan), "plan");

	const where: Prisma.PaymentWhereInput = {
		AND: [
			baseWhere,
			...(paymentStatus ? [{ status: paymentStatus }] : []),
			...(plan ? [{ plan }] : []),
		],
	};

	const [payments, total] = await Promise.all([
		prisma.payment.findMany({
			where,
			select: paymentSelect,
			orderBy: { [sortField]: sortOrder },
			skip,
			take: limit,
		}),
		prisma.payment.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: payments, meta };
};

const getPaymentHistory = async (user: Express.User, query: IPaymentQuery) => {
	return await listPayments({ owner_id: user.id }, query);
};

/** Exported for the admin module (Phase 6), which calls this directly. */
const getAllPayments = async (query: IPaymentQuery) => {
	return await listPayments({}, query);
};

export const PaymentService = {
	getPlans,
	getMySubscription,
	createCheckoutSession,
	verifyPayment,
	handleWebhook,
	getPaymentHistory,
	getAllPayments,
	// shared with Phase 6's billing views
	PLANS,
};

import status from "http-status";
import AppError from "../../utils/appError";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import type { IPaymentQuery } from "./payment.interface";
import type { TCreateCheckoutPayload } from "./payment.schema";
import { PaymentService } from "./payment.service";

const getPlans = catchAsync(async (_, res) => {
	const result = await PaymentService.getPlans();

	sendResponse(res, {
		message: "Plans fetched successfully",
		data: result,
	});
});

const getMySubscription = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await PaymentService.getMySubscription(user);

	sendResponse(res, {
		message: "Subscription fetched successfully",
		data: result,
	});
});

const createCheckoutSession = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body as TCreateCheckoutPayload;

	const result = await PaymentService.createCheckoutSession(user, payload);

	sendResponse(res, {
		status: status.OK,
		message: "Checkout session created",
		data: result,
	});
});

const verifyPayment = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const sessionId = req.query.session_id;

	if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
		throw new AppError(status.BAD_REQUEST, "session_id is required");
	}

	const result = await PaymentService.verifyPayment(user, sessionId.trim());

	sendResponse(res, {
		message: "Payment verified successfully",
		data: result,
	});
});

const handleWebhook = catchAsync(async (req, res) => {
	const rawBody = req.body;

	// express.raw() is mounted on this exact path ahead of express.json()
	if (!Buffer.isBuffer(rawBody)) {
		throw new AppError(
			status.BAD_REQUEST,
			"Stripe webhook requires a raw request body",
		);
	}

	const signature = req.headers["stripe-signature"];
	await PaymentService.handleWebhook(
		rawBody,
		typeof signature === "string" ? signature : undefined,
	);

	// Stripe only inspects the status code — keep the acknowledgement minimal
	res.status(status.OK).json({ received: true });
});

const getPaymentHistory = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const query = req.query as unknown as IPaymentQuery;

	const result = await PaymentService.getPaymentHistory(user, query);

	sendResponse(res, {
		message: "Payment history fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getAllPayments = catchAsync(async (req, res) => {
	const query = req.query as unknown as IPaymentQuery;

	const result = await PaymentService.getAllPayments(query);

	sendResponse(res, {
		message: "Payments fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const PaymentController = {
	getPlans,
	getMySubscription,
	createCheckoutSession,
	verifyPayment,
	handleWebhook,
	getPaymentHistory,
	getAllPayments,
};

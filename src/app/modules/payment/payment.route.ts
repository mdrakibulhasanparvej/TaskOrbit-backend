import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import { createCheckoutSchema } from "./payment.schema";

const router = Router();

// public pricing table — /pricing renders before a visitor signs in
router.get("/plans", PaymentController.getPlans);

// raw-body only: Stripe signs the exact bytes, so this path is guarded in
// src/app.ts ahead of express.json() and must stay unauthenticated
router.post("/webhook", PaymentController.handleWebhook);

router.get(
	"/subscription",
	auth(Role.CLIENT),
	PaymentController.getMySubscription,
);

router.post(
	"/checkout",
	auth(Role.CLIENT),
	validateRequest(createCheckoutSchema),
	PaymentController.createCheckoutSession,
);

router.get("/verify", auth(Role.CLIENT), PaymentController.verifyPayment);

// static segment before "/history" so the admin list never shadows it
router.get(
	"/history/admin",
	auth(Role.ADMIN),
	PaymentController.getAllPayments,
);

router.get("/history", auth(Role.CLIENT), PaymentController.getPaymentHistory);

export const PaymentRoutes = router;

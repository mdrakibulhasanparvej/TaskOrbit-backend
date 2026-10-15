import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import config from "./app/config";
import errorHandler from "./app/middlewares/globalErrorHandler";
import maintenanceMode from "./app/middlewares/maintenance";
import { notFound } from "./app/middlewares/notFound";
import { AdminRoutes } from "./app/modules/admin/admin.route";
import { AnalyticsRoutes } from "./app/modules/analytics/analytics.route";
import { AttachmentRoutes } from "./app/modules/attachment/attachment.route";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import { CommentRoutes } from "./app/modules/comment/comment.route";
import { ContactRoutes } from "./app/modules/contact/contact.route";
import { NotificationRoutes } from "./app/modules/notification/notification.route";
import { PaymentRoutes } from "./app/modules/payment/payment.route";
import { ProjectRoutes } from "./app/modules/project/project.route";
import { TaskRoutes } from "./app/modules/task/task.route";
import { UserRoutes } from "./app/modules/user/user.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Stripe signs the exact raw bytes — this guard must precede express.json() so
// the webhook body is never re-parsed (it also marks the body as already read)
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// platform-wide maintenance switch — no-op unless maintenance_mode=true
app.use("/api/v1", maintenanceMode);

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/projects", ProjectRoutes);
app.use("/api/v1/tasks", TaskRoutes);
app.use("/api/v1/tasks", CommentRoutes);
app.use("/api/v1/tasks", AttachmentRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/contact", ContactRoutes);

app.get("/", async (_: Request, res: Response) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
	});
});

app.use(errorHandler);
app.use(notFound);

export default app;

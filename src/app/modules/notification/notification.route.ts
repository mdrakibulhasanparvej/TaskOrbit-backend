import { Router } from "express";
import auth from "../../middlewares/auth";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get("/", auth(), NotificationController.getNotifications);

// static routes before "/:id/..." so ids never swallow them
router.get("/unread-count", auth(), NotificationController.getUnreadCount);

router.patch("/read-all", auth(), NotificationController.markAllRead);

router.patch("/:id/read", auth(), NotificationController.markAsRead);

export const NotificationRoutes = router;

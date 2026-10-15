import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import type { INotificationQuery } from "./notification.interface";
import { NotificationService } from "./notification.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const getNotifications = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const query = req.query as unknown as INotificationQuery;

	const result = await NotificationService.getNotifications(user, query);

	sendResponse(res, {
		message: "Notifications fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const markAsRead = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await NotificationService.markAsRead(
		user,
		pathParam(req.params.id),
	);

	sendResponse(res, {
		message: "Notification marked as read",
		data: result,
	});
});

const markAllRead = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await NotificationService.markAllRead(user);

	sendResponse(res, {
		message: "All notifications marked as read",
		data: result,
	});
});

const getUnreadCount = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await NotificationService.getUnreadCount(user);

	sendResponse(res, {
		message: "Unread count fetched Successfully",
		data: result,
	});
});

export const NotificationController = {
	getNotifications,
	markAsRead,
	markAllRead,
	getUnreadCount,
};

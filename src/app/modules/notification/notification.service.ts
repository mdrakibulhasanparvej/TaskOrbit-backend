import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import {
	NotificationType,
	TaskStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import redisClient from "../../lib/redis";
import type { IMeta } from "../../types";
import AppError from "../../utils/appError";
import type { INotificationQuery } from "./notification.interface";

const DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000;
const SWEEP_LOCK_TTL_SECONDS = 60 * 60;
const DEFAULT_PAGE_LIMIT = 20;

const notificationSelect = {
	id: true,
	type: true,
	title: true,
	message: true,
	is_read: true,
	link: true,
	actor_id: true,
	actor_name: true,
	created_at: true,
} satisfies Prisma.NotificationSelect;

export interface INotificationPayload {
	user_id: string;
	type: NotificationType;
	title: string;
	message: string;
	link: string;
	actor_id: string | null;
	actor_name: string | null;
}

/**
 * Single write path for every in-app notification — task, comment and
 * attachment modules all fan out through here.
 */
const createNotification = async (payload: INotificationPayload) => {
	return await prisma.notification.create({
		data: payload,
		select: notificationSelect,
	});
};

/**
 * Lazy deadline sweep (no cron dependency): generates DEADLINE_APPROACHING
 * notifications for tasks assigned to the user that are due within the next
 * 24 hours. A Redis SETNX lock makes it hourly-idempotent; if Redis is
 * unreachable we still sweep and lean on the per-task link dedupe below, so a
 * Redis outage can never suppress deadline notifications.
 */
const runDeadlineSweep = async (userId: string) => {
	const now = new Date();
	const hourKey = `${now.toISOString().slice(0, 10)}-${String(now.getUTCHours()).padStart(2, "0")}`;
	const sweepKey = `deadline-sweep:${userId}:${hourKey}`;

	let shouldSweep = true;

	try {
		const lock = await redisClient.set(sweepKey, "1", {
			NX: true,
			EX: SWEEP_LOCK_TTL_SECONDS,
		});
		// another request already swept this hour
		shouldSweep = lock === "OK";
	} catch {
		// Redis unavailable — sweep anyway; the link dedupe below keeps it safe
		shouldSweep = true;
	}

	if (!shouldSweep) {
		return;
	}

	try {
		const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MS);

		const tasks = await prisma.task.findMany({
			where: {
				assignee_id: userId,
				status: { not: TaskStatus.DONE },
				due_date: { gte: now, lte: windowEnd },
			},
			select: { id: true, title: true },
		});

		if (tasks.length === 0) {
			return;
		}

		const links = tasks.map((task) => `/dashboard/tasks/${task.id}`);

		const existing = await prisma.notification.findMany({
			where: {
				user_id: userId,
				type: NotificationType.DEADLINE_APPROACHING,
				link: { in: links },
			},
			select: { link: true },
		});

		const existingLinks = new Set(existing.map((row) => row.link));

		const rows = tasks
			.filter((task) => !existingLinks.has(`/dashboard/tasks/${task.id}`))
			.map((task) => ({
				user_id: userId,
				type: NotificationType.DEADLINE_APPROACHING,
				title: "Deadline approaching",
				message: `Task "${task.title}" is due within the next 24 hours`,
				link: `/dashboard/tasks/${task.id}`,
				actor_id: null,
				actor_name: null,
			}));

		if (rows.length > 0) {
			await prisma.notification.createMany({ data: rows });
		}
	} catch {
		// best-effort lazy generation — the feed itself must never fail; the
		// next GET retries and the link dedupe keeps the sweep idempotent
	}
};

const getNotifications = async (
	user: Express.User,
	query: INotificationQuery,
) => {
	await runDeadlineSweep(user.id);

	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1);
	const skip = (page - 1) * limit;

	const unreadOnly = query.unreadOnly === "true";

	const where: Prisma.NotificationWhereInput = {
		user_id: user.id,
		...(unreadOnly ? { is_read: false } : {}),
	};

	const [notifications, total] = await Promise.all([
		prisma.notification.findMany({
			where,
			select: notificationSelect,
			orderBy: [{ created_at: "desc" }],
			skip,
			take: limit,
		}),
		prisma.notification.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: notifications, meta };
};

const markAsRead = async (user: Express.User, notificationId: string) => {
	const result = await prisma.notification.updateMany({
		where: { id: notificationId, user_id: user.id },
		data: { is_read: true },
	});

	if (result.count === 0) {
		throw new AppError(status.NOT_FOUND, "Notification not found");
	}

	return { id: notificationId, is_read: true };
};

const markAllRead = async (user: Express.User) => {
	const result = await prisma.notification.updateMany({
		where: { user_id: user.id, is_read: false },
		data: { is_read: true },
	});

	return { updated: result.count };
};

const getUnreadCount = async (user: Express.User) => {
	const count = await prisma.notification.count({
		where: { user_id: user.id, is_read: false },
	});

	return { unreadCount: count };
};

export const NotificationService = {
	createNotification,
	getNotifications,
	markAsRead,
	markAllRead,
	getUnreadCount,
};

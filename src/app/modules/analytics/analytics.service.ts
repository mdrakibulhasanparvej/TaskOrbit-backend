import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import {
	PaymentStatus,
	Plan,
	ProjectStatus,
	SubscriptionStatus,
	TaskStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import { PaymentService } from "../payment/payment.service";

const MONTH_BUCKET_COUNT = 12;
const WEEK_BUCKET_COUNT = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface IStatusCount {
	status: TaskStatus;
	count: number;
}

export interface IWorkloadRow {
	id: string;
	name: string;
	avatar_url: string | null;
	openTasks: number;
}

export interface IWeekBucket {
	/** local midnight of the bucket start, formatted `YYYY-MM-DD` */
	week: string;
	overdue: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

const formatDate = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const monthKey = (date: Date) => formatDate(date).slice(0, 7);

/** Oldest-first `YYYY-MM` keys for the last `count` calendar months. */
const lastMonthKeys = (count: number): string[] => {
	const now = new Date();
	const keys: string[] = [];

	for (let offset = count - 1; offset >= 0; offset -= 1) {
		keys.push(
			monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1)),
		);
	}

	return keys;
};

/** Oldest-first bucket starts covering the last `count` rolling weeks. */
const lastWeekStarts = (count: number): Date[] => {
	const now = new Date();
	// anchor to local midnight so a bucket never shifts inside a timezone
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const starts: Date[] = [];

	for (let offset = count - 1; offset >= 0; offset -= 1) {
		starts.push(new Date(today.getTime() - offset * WEEK_MS));
	}

	return starts;
};

/**
 * One row per TaskStatus (never just the populated ones) so every chart keeps a
 * stable axis and empty columns render as 0 instead of disappearing.
 */
const countTasksByStatus = async (
	taskWhere: Prisma.TaskWhereInput,
): Promise<IStatusCount[]> => {
	const groups = await prisma.task.groupBy({
		by: ["status"],
		where: taskWhere,
		_count: { _all: true },
	});

	const counts = new Map<TaskStatus, number>(
		groups.map((group) => [group.status, group._count._all]),
	);

	return Object.values(TaskStatus).map((taskStatus) => ({
		status: taskStatus,
		count: counts.get(taskStatus) ?? 0,
	}));
};

/** Same stable-axis guarantee for project statuses. */
const countProjectsByStatus = async (
	projectWhere: Prisma.ProjectWhereInput,
) => {
	const groups = await prisma.project.groupBy({
		by: ["status"],
		where: projectWhere,
		_count: { _all: true },
	});

	const counts = new Map<ProjectStatus, number>(
		groups.map((group) => [group.status, group._count._all]),
	);

	return Object.values(ProjectStatus).map((projectStatus) => ({
		status: projectStatus,
		count: counts.get(projectStatus) ?? 0,
	}));
};

/** Share of DONE tasks, as a 0..1 fraction (0 for an empty task set). */
const completionRateOf = (tasksByStatus: IStatusCount[]) => {
	const total = tasksByStatus.reduce((sum, row) => sum + row.count, 0);

	if (total === 0) {
		return 0;
	}

	const done =
		tasksByStatus.find((row) => row.status === TaskStatus.DONE)?.count ?? 0;

	return round2(done / total);
};

/**
 * Open tasks per person across the given projects: every project member shows
 * up (even at 0) plus any assignee who is not a listed member (the owner), so
 * the workload chart never loses a person.
 */
const buildWorkload = async (
	taskWhere: Prisma.TaskWhereInput,
	memberWhere: Prisma.ProjectMemberWhereInput,
): Promise<IWorkloadRow[]> => {
	const [openGroups, memberships] = await Promise.all([
		prisma.task.groupBy({
			by: ["assignee_id"],
			where: {
				...taskWhere,
				status: { not: TaskStatus.DONE },
				assignee_id: { not: null },
			},
			_count: { _all: true },
		}),
		prisma.projectMember.findMany({
			where: memberWhere,
			distinct: ["user_id"],
			select: { user_id: true },
		}),
	]);

	const openByUser = new Map<string, number>();
	const userIds = new Set<string>();

	for (const group of openGroups) {
		if (!group.assignee_id) {
			continue;
		}
		openByUser.set(group.assignee_id, group._count._all);
		userIds.add(group.assignee_id);
	}

	for (const membership of memberships) {
		userIds.add(membership.user_id);
	}

	if (userIds.size === 0) {
		return [];
	}

	const users = await prisma.user.findMany({
		where: { id: { in: [...userIds] } },
		select: { id: true, name: true, avatar_url: true },
	});

	return users
		.map((user) => ({
			...user,
			openTasks: openByUser.get(user.id) ?? 0,
		}))
		.sort((a, b) => b.openTasks - a.openTasks || a.name.localeCompare(b.name));
};

/**
 * Tasks that crossed their due_date without reaching DONE, bucketed by the week
 * their deadline fell in (8 rolling weeks, oldest first).
 */
const buildOverdueTrend = async (
	taskWhere: Prisma.TaskWhereInput,
): Promise<IWeekBucket[]> => {
	const starts = lastWeekStarts(WEEK_BUCKET_COUNT);
	const windowStart = starts[0] ?? new Date();
	const buckets: IWeekBucket[] = starts.map((start) => ({
		week: formatDate(start),
		overdue: 0,
	}));

	const overdueTasks = await prisma.task.findMany({
		where: {
			...taskWhere,
			status: { not: TaskStatus.DONE },
			due_date: { not: null, gte: windowStart, lt: new Date() },
		},
		select: { due_date: true },
	});

	for (const task of overdueTasks) {
		if (!task.due_date) {
			continue;
		}

		const index = Math.floor(
			(task.due_date.getTime() - windowStart.getTime()) / WEEK_MS,
		);
		const bucket =
			buckets[Math.min(Math.max(index, 0), buckets.length - 1)] ?? buckets[0];

		if (bucket) {
			bucket.overdue += 1;
		}
	}

	return buckets;
};

/** Platform-wide KPIs for the admin dashboard. */
const getAdminAnalytics = async () => {
	const now = new Date();
	const monthKeys = lastMonthKeys(MONTH_BUCKET_COUNT);
	const windowStart = new Date(
		now.getFullYear(),
		now.getMonth() - (MONTH_BUCKET_COUNT - 1),
		1,
	);

	const [
		totalUsers,
		activeProjects,
		totalTasks,
		liveSubscriptions,
		successPayments,
		signups,
		tasksByStatus,
	] = await Promise.all([
		prisma.user.count({ where: { is_deleted: false } }),
		prisma.project.count({
			where: { status: { not: ProjectStatus.ARCHIVED } },
		}),
		prisma.task.count(),
		// MRR = list price of every plan that is both ACTIVE and inside its paid period
		prisma.subscription.findMany({
			where: {
				status: SubscriptionStatus.ACTIVE,
				plan: { in: [Plan.PRO, Plan.BUSINESS] },
				OR: [{ current_period_end: null }, { current_period_end: { gt: now } }],
			},
			select: { plan: true },
		}),
		prisma.payment.findMany({
			where: {
				status: PaymentStatus.SUCCESS,
				created_at: { gte: windowStart },
			},
			select: { amount: true, created_at: true },
		}),
		prisma.user.findMany({
			where: { created_at: { gte: windowStart } },
			select: { created_at: true },
		}),
		countTasksByStatus({}),
	]);

	const mrr = liveSubscriptions.reduce(
		(sum, subscription) => sum + PaymentService.PLANS[subscription.plan].price,
		0,
	);

	const revenueByMonth = new Map<string, { revenue: number; payments: number }>(
		monthKeys.map((month) => [month, { revenue: 0, payments: 0 }]),
	);

	for (const payment of successPayments) {
		const bucket = revenueByMonth.get(monthKey(payment.created_at));
		if (bucket) {
			bucket.revenue = round2(bucket.revenue + payment.amount);
			bucket.payments += 1;
		}
	}

	const signupsByMonth = new Map<string, number>(
		monthKeys.map((month) => [month, 0]),
	);

	for (const signup of signups) {
		const month = monthKey(signup.created_at);
		const bucket = signupsByMonth.get(month);
		if (bucket !== undefined) {
			signupsByMonth.set(month, bucket + 1);
		}
	}

	return {
		totals: {
			users: totalUsers,
			activeProjects,
			tasks: totalTasks,
			paidSubscriptions: liveSubscriptions.length,
			mrr,
		},
		monthlyRevenue: monthKeys.map((month) => ({
			month,
			...(revenueByMonth.get(month) ?? { revenue: 0, payments: 0 }),
		})),
		monthlySignups: monthKeys.map((month) => ({
			month,
			signups: signupsByMonth.get(month) ?? 0,
		})),
		tasksByStatus,
	};
};

/** Charts for every project the manager owns. */
const getManagerAnalytics = async (user: Express.User) => {
	const ownerWhere: Prisma.ProjectWhereInput = { owner_id: user.id };
	const taskWhere: Prisma.TaskWhereInput = {
		project: { owner_id: user.id },
	};

	const [tasksByStatus, projectsByStatus, workload, overdueTrend, totalTasks] =
		await Promise.all([
			countTasksByStatus(taskWhere),
			countProjectsByStatus(ownerWhere),
			buildWorkload(taskWhere, { project: ownerWhere }),
			buildOverdueTrend(taskWhere),
			prisma.task.count({ where: taskWhere }),
		]);

	return {
		totals: {
			projects: projectsByStatus.reduce((sum, row) => sum + row.count, 0),
			tasks: totalTasks,
		},
		completionRate: completionRateOf(tasksByStatus),
		tasksByStatus,
		projectsByStatus,
		workload,
		overdueTrend,
	};
};

/** Owner-only, per-project variant of the manager charts. */
const getProjectAnalytics = async (user: Express.User, projectId: string) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId.trim() },
		select: { id: true, name: true, status: true, owner_id: true },
	});

	if (!project) {
		throw new AppError(status.NOT_FOUND, "Project not found");
	}

	if (project.owner_id !== user.id) {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can view this project's analytics",
		);
	}

	const taskWhere: Prisma.TaskWhereInput = { project_id: project.id };

	const [tasksByStatus, workload, overdueTrend, totalTasks] = await Promise.all(
		[
			countTasksByStatus(taskWhere),
			buildWorkload(taskWhere, { project_id: project.id }),
			buildOverdueTrend(taskWhere),
			prisma.task.count({ where: taskWhere }),
		],
	);

	return {
		project: { id: project.id, name: project.name, status: project.status },
		totals: { tasks: totalTasks },
		completionRate: completionRateOf(tasksByStatus),
		tasksByStatus,
		workload,
		overdueTrend,
	};
};

/** Personal progress cards for the TEAM_MEMBER dashboard. */
const getMemberProgress = async (user: Express.User) => {
	const taskWhere: Prisma.TaskWhereInput = { assignee_id: user.id };
	const now = new Date();

	const [tasksByStatus, totalTasks, overdueCount] = await Promise.all([
		countTasksByStatus(taskWhere),
		prisma.task.count({ where: taskWhere }),
		prisma.task.count({
			where: {
				assignee_id: user.id,
				status: { not: TaskStatus.DONE },
				due_date: { lt: now },
			},
		}),
	]);

	return {
		totals: { tasks: totalTasks, overdue: overdueCount },
		completionRate: completionRateOf(tasksByStatus),
		tasksByStatus,
		overdueCount,
	};
};

export const AnalyticsService = {
	getAdminAnalytics,
	getManagerAnalytics,
	getProjectAnalytics,
	getMemberProgress,
};

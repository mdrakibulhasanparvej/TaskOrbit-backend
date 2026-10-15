import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import {
	PaymentStatus,
	ProjectStatus,
	Role,
	UserStatus,
} from "../../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import type { IQuery } from "../../types";
import AppError from "../../utils/appError";
import recordAudit from "../../utils/audit";
import {
	getPlatformSettings,
	type IPlatformSettings,
	type SettingKey,
} from "../../utils/platformSettings";
import { PaymentService } from "../payment/payment.service";
import type {
	TUpdateSettingsPayload,
	TUpdateUserRolePayload,
	TUpdateUserStatusPayload,
} from "./admin.schema";

const DEFAULT_PAGE_LIMIT = 10;
const DEFAULT_ADMIN_EMAIL = "admin@taskflow.dev";
const TOP_PROJECT_LIMIT = 5;

/**
 * The platform must always keep at least one reachable admin, so the seed admin
 * (env-configured or the demo account) can never be suspended or demoted.
 */
const PROTECTED_ADMIN_EMAILS = [config.admin_email, DEFAULT_ADMIN_EMAIL].filter(
	(value): value is string => typeof value === "string" && value.length > 0,
);

const isProtectedAdmin = (email: string) =>
	PROTECTED_ADMIN_EMAILS.some(
		(candidate) => candidate.toLowerCase() === email.toLowerCase(),
	);

const USER_SORT_FIELDS = [
	"name",
	"email",
	"created_at",
	"last_login_at",
	"role",
	"user_status",
] as const;

type TUserSortField = (typeof USER_SORT_FIELDS)[number];

const PROJECT_SORT_FIELDS = [
	"name",
	"start_date",
	"end_date",
	"created_at",
] as const;

type TProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

const adminUserSelect = {
	id: true,
	name: true,
	email: true,
	avatar_url: true,
	role: true,
	user_status: true,
	is_active: true,
	is_verified: true,
	last_login_at: true,
	created_at: true,
	_count: { select: { owned_projects: true, assigned_tasks: true } },
} satisfies Prisma.UserSelect;

const adminProjectSelect = {
	id: true,
	name: true,
	description: true,
	status: true,
	start_date: true,
	end_date: true,
	owner_id: true,
	created_at: true,
	updated_at: true,
	owner: {
		select: { id: true, name: true, email: true, avatar_url: true, role: true },
	},
	_count: { select: { tasks: true, members: true } },
} satisfies Prisma.ProjectSelect;

const resolveSort = <T extends string>(
	sortBy: string | undefined,
	allowed: readonly T[],
	fallback: T,
): T =>
	sortBy && (allowed as readonly string[]).includes(sortBy)
		? (sortBy as T)
		: fallback;

const parsePage = (query: IQuery) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1);

	return { page, limit, skip: (page - 1) * limit };
};

/**
 * Canonical user directory (the `user` module keeps its own lighter `/` list).
 * Adds the project/task counters the admin table renders.
 */
const listUsers = async (query: IQuery) => {
	const { page, limit, skip } = parsePage(query);

	const sortField: TUserSortField = resolveSort(
		query.sortBy as string | undefined,
		USER_SORT_FIELDS,
		"created_at",
	);
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const search = typeof query.search === "string" ? query.search : undefined;
	const roleFilter =
		typeof query.role === "string" ? (query.role as Role) : undefined;
	const statusFilter = (
		typeof query.user_status === "string"
			? query.user_status
			: typeof query.status === "string"
				? query.status
				: undefined
	) as UserStatus | undefined;

	const andConditions: Prisma.UserWhereInput[] = [{ is_deleted: false }];

	if (search) {
		andConditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (roleFilter && Object.values(Role).includes(roleFilter)) {
		andConditions.push({ role: roleFilter });
	}

	if (statusFilter && Object.values(UserStatus).includes(statusFilter)) {
		andConditions.push({ user_status: statusFilter });
	}

	const where: Prisma.UserWhereInput = { AND: andConditions };

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: adminUserSelect,
			orderBy: { [sortField]: sortOrder },
			skip,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	return {
		data: users,
		meta: {
			page,
			limit,
			dataCount: total,
			totalPages: Math.ceil(total / limit) || 1,
		},
	};
};

const findUserOrThrow = async (userId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });

	if (!user || user.is_deleted) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	return user;
};

/**
 * Suspend/restore an account. `user_status` is the visible flag; `is_active`
 * flips with it so every other module agrees on the account's state.
 */
const setUserStatus = async (
	actor: Express.User,
	userId: string,
	payload: TUpdateUserStatusPayload,
) => {
	const target = await findUserOrThrow(userId);

	// protected first: the seed admin gets the specific message even when the
	// admin is trying to suspend their own account
	if (isProtectedAdmin(target.email)) {
		throw new AppError(
			status.FORBIDDEN,
			"The primary admin account can't be suspended",
		);
	}

	if (target.id === actor.id) {
		throw new AppError(
			status.BAD_REQUEST,
			"You can't change the status of your own account",
		);
	}

	const suspended = payload.user_status === UserStatus.SUSPENDED;

	const updated = await prisma.user.update({
		where: { id: target.id },
		data: {
			user_status: payload.user_status,
			is_active: !suspended,
		},
		omit: { password: true },
	});

	await recordAudit({
		actor,
		action: suspended ? "user.suspended" : "user.activated",
		entity: "user",
		entityId: target.id,
		meta: { email: target.email, previous_status: target.user_status },
	});

	return updated;
};

const changeUserRole = async (
	actor: Express.User,
	userId: string,
	payload: TUpdateUserRolePayload,
) => {
	const target = await findUserOrThrow(userId);

	if (isProtectedAdmin(target.email) && payload.role !== Role.ADMIN) {
		throw new AppError(
			status.FORBIDDEN,
			"The primary admin account must stay an admin",
		);
	}

	if (target.id === actor.id && payload.role !== Role.ADMIN) {
		throw new AppError(status.BAD_REQUEST, "You can't change your own role");
	}

	if (target.role === payload.role) {
		return {
			id: target.id,
			role: target.role,
			unchanged: true,
		};
	}

	const updated = await prisma.user.update({
		where: { id: target.id },
		data: { role: payload.role },
		omit: { password: true },
	});

	await recordAudit({
		actor,
		action: "user.role_changed",
		entity: "user",
		entityId: target.id,
		meta: { email: target.email, from: target.role, to: payload.role },
	});

	return updated;
};

/** Platform-wide project list — same filters as the manager list, no scoping. */
const allProjects = async (query: IQuery) => {
	const { page, limit, skip } = parsePage(query);

	const sortField: TProjectSortField = resolveSort(
		query.sortBy as string | undefined,
		PROJECT_SORT_FIELDS,
		"created_at",
	);
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const search = typeof query.search === "string" ? query.search : undefined;
	const ownerName =
		typeof query.ownerName === "string" ? query.ownerName : undefined;
	const statusFilter =
		typeof query.status === "string" ? query.status : undefined;

	const andConditions: Prisma.ProjectWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (ownerName) {
		andConditions.push({
			owner: { name: { contains: ownerName, mode: "insensitive" } },
		});
	}

	if (statusFilter) {
		if (!Object.values(ProjectStatus).includes(statusFilter as ProjectStatus)) {
			throw new AppError(status.BAD_REQUEST, "Invalid project status filter");
		}

		andConditions.push({ status: statusFilter as ProjectStatus });
	}

	const where: Prisma.ProjectWhereInput = { AND: andConditions };

	const [projects, total] = await Promise.all([
		prisma.project.findMany({
			where,
			select: adminProjectSelect,
			orderBy: { [sortField]: sortOrder },
			skip,
			take: limit,
		}),
		prisma.project.count({ where }),
	]);

	return {
		data: projects,
		meta: {
			page,
			limit,
			dataCount: total,
			totalPages: Math.ceil(total / limit) || 1,
		},
	};
};

/** Admin bypass of project ownership — still audited. */
const deleteAnyProject = async (actor: Express.User, projectId: string) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, name: true, owner_id: true },
	});

	if (!project) {
		throw new AppError(status.NOT_FOUND, "Project not found");
	}

	await prisma.project.delete({ where: { id: project.id } });

	await recordAudit({
		actor,
		action: "project.deleted",
		entity: "project",
		entityId: project.id,
		meta: { name: project.name, owner_id: project.owner_id },
	});

	return { id: project.id, name: project.name };
};

const allPayments = async (query: IQuery) => {
	return await PaymentService.getAllPayments(query);
};

const getReports = async (query: IQuery) => {
	const { page, limit, skip } = parsePage(query);

	const actionFilter =
		typeof query.action === "string" ? query.action : undefined;
	const entityFilter =
		typeof query.entity === "string" ? query.entity : undefined;

	const andConditions: Prisma.AuditLogWhereInput[] = [];

	if (actionFilter) {
		andConditions.push({
			action: { contains: actionFilter, mode: "insensitive" },
		});
	}

	if (entityFilter) {
		andConditions.push({
			entity: { equals: entityFilter, mode: "insensitive" },
		});
	}

	const where: Prisma.AuditLogWhereInput = { AND: andConditions };

	const [logs, logCount, users, projects, tasks, payments, topProjects] =
		await Promise.all([
			prisma.auditLog.findMany({
				where,
				orderBy: { created_at: "desc" },
				skip,
				take: limit,
			}),
			prisma.auditLog.count({ where }),
			prisma.user.count({ where: { is_deleted: false } }),
			prisma.project.count(),
			prisma.task.count(),
			prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
			prisma.project.findMany({
				orderBy: { tasks: { _count: "desc" } },
				take: TOP_PROJECT_LIMIT,
				select: adminProjectSelect,
			}),
		]);

	return {
		auditLogs: {
			data: logs,
			meta: {
				page,
				limit,
				dataCount: logCount,
				totalPages: Math.ceil(logCount / limit) || 1,
			},
		},
		totals: { users, projects, tasks, payments },
		topProjects,
	};
};

export type { IPlatformSettings };

/** Missing keys resolve to their documented defaults so the UI never sees null. */
const getSettings = async (): Promise<IPlatformSettings> => {
	return await getPlatformSettings();
};

const updateSettings = async (
	actor: Express.User,
	payload: TUpdateSettingsPayload,
) => {
	const changes: { key: SettingKey; value: string | boolean }[] = [];

	if (payload.maintenance_mode !== undefined) {
		changes.push({ key: "maintenance_mode", value: payload.maintenance_mode });
	}

	if (payload.registration_open !== undefined) {
		changes.push({
			key: "registration_open",
			value: payload.registration_open,
		});
	}

	if (payload.support_email !== undefined) {
		changes.push({ key: "support_email", value: payload.support_email });
	}

	for (const change of changes) {
		await prisma.platformSetting.upsert({
			where: { key: change.key },
			update: { value: change.value },
			create: { key: change.key, value: change.value },
		});
	}

	await recordAudit({
		actor,
		action: "settings.updated",
		entity: "platform_setting",
		meta: {
			updated: changes.map((change) => change.key),
		},
	});

	return await getSettings();
};

export const AdminService = {
	listUsers,
	setUserStatus,
	changeUserRole,
	allProjects,
	deleteAnyProject,
	allPayments,
	getReports,
	getSettings,
	updateSettings,
};

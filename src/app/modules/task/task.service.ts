import status from "http-status";
import type {
	Prisma,
	Project,
	Task,
} from "../../../../generated/prisma/client";
import {
	NotificationType,
	TaskPriority,
	TaskStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IMeta } from "../../types";
import AppError from "../../utils/appError";
import recordAudit from "../../utils/audit";
import { NotificationService } from "../notification/notification.service";
import type {
	ITaskBoard,
	ITaskPayload,
	ITaskQuery,
	ITaskUpdatePayload,
} from "./task.interface";
import type {
	TAssignTaskPayload,
	TUpdateTaskStatusPayload,
} from "./task.schema";

const ALLOWED_SORT_FIELDS = [
	"title",
	"status",
	"priority",
	"due_date",
	"position",
	"created_at",
	"updated_at",
] as const;

type TSortField = (typeof ALLOWED_SORT_FIELDS)[number];

const userBriefSelect = {
	id: true,
	name: true,
	avatar_url: true,
} satisfies Prisma.UserSelect;

const taskListSelect = {
	id: true,
	title: true,
	description: true,
	status: true,
	priority: true,
	due_date: true,
	labels: true,
	position: true,
	project_id: true,
	assignee_id: true,
	created_by_id: true,
	created_at: true,
	updated_at: true,
	assignee: { select: userBriefSelect },
	project: { select: { id: true, name: true, status: true } },
	_count: { select: { comments: true } },
} satisfies Prisma.TaskSelect;

const taskDetailSelect = {
	...taskListSelect,
	created_by: { select: userBriefSelect },
	project: { select: { id: true, name: true, status: true } },
} satisfies Prisma.TaskSelect;

const notifyTaskAssignee = async (task: Task, assigneeId: string | null) => {
	if (!assigneeId || assigneeId === task.created_by_id) {
		return;
	}

	const creator = await prisma.user.findUnique({
		where: { id: task.created_by_id },
		select: { name: true },
	});

	await NotificationService.createNotification({
		user_id: assigneeId,
		type: NotificationType.TASK_ASSIGNED,
		title: "Task assigned",
		message: `${creator?.name ?? "A teammate"} assigned you to "${task.title}"`,
		link: `/dashboard/tasks/${task.id}`,
		actor_id: task.created_by_id,
		actor_name: creator?.name ?? null,
	});
};

const notifyTaskStatusChanged = async (
	task: Task,
	newStatus: TaskStatus,
	actorId: string,
) => {
	const [project, actor] = await Promise.all([
		prisma.project.findUnique({
			where: { id: task.project_id },
			select: { owner_id: true },
		}),
		prisma.user.findUnique({
			where: { id: actorId },
			select: { name: true },
		}),
	]);

	if (!project) {
		return;
	}

	const recipients = new Set<string>();

	if (project.owner_id) {
		recipients.add(project.owner_id);
	}

	if (task.assignee_id) {
		recipients.add(task.assignee_id);
	}

	// the actor never notifies themselves
	recipients.delete(actorId);

	const statusLabel = newStatus.replaceAll("_", " ").toLowerCase();

	for (const recipientId of recipients) {
		await NotificationService.createNotification({
			user_id: recipientId,
			type: NotificationType.TASK_STATUS_CHANGED,
			title: "Task status changed",
			message: `${actor?.name ?? "A teammate"} moved "${task.title}" to ${statusLabel}`,
			link: `/dashboard/tasks/${task.id}`,
			actor_id: actorId,
			actor_name: actor?.name ?? null,
		});
	}
};

const findTaskOrThrow = async (taskId: string) => {
	const task = await prisma.task.findUnique({ where: { id: taskId } });

	if (!task) {
		throw new AppError(status.NOT_FOUND, "Task not found");
	}

	return task;
};

const findProjectOrThrow = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });

	if (!project) {
		throw new AppError(status.NOT_FOUND, "Project not found");
	}

	return project;
};

interface ITaskScope {
	project: Project;
	seesAll: boolean;
}

type TTaskScopeMode = "read" | "write";

/**
 * ADMIN and the project owner see every task of the project and a
 * PROJECT_MANAGER member sees every task of projects they belong to. On read
 * operations any project member (including a TEAM_MEMBER) sees every task of
 * the project, while on write/mutation operations a TEAM_MEMBER stays
 * restricted to the tasks assigned to them.
 */
const resolveTaskScope = async (
	projectId: string,
	user: Express.User,
	mode: TTaskScopeMode = "read",
): Promise<ITaskScope> => {
	const project = await findProjectOrThrow(projectId);

	if (user.role === "ADMIN" || project.owner_id === user.id) {
		return { project, seesAll: true };
	}

	const membership = await prisma.projectMember.findUnique({
		where: { project_id_user_id: { project_id: projectId, user_id: user.id } },
	});

	if (!membership) {
		throw new AppError(
			status.FORBIDDEN,
			"You are not a member of this project",
		);
	}

	// Every project member may VIEW the whole board/list; mutation is still
	// gated separately (moveTask/updateTask), so write mode keeps the old rule.
	return {
		project,
		seesAll: mode === "read" || user.role === "PROJECT_MANAGER",
	};
};

/** Every task mutation (except ADMIN delete) belongs to the project owner. */
const assertProjectOwner = (
	project: ITaskScope["project"],
	user: Express.User,
) => {
	if (project.owner_id !== user.id) {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can perform this action",
		);
	}
};

const assertAssignable = async (
	project: ITaskScope["project"],
	assigneeId: string,
) => {
	// the owner is not necessarily listed in project_members
	if (assigneeId === project.owner_id) {
		return;
	}

	const membership = await prisma.projectMember.findUnique({
		where: {
			project_id_user_id: { project_id: project.id, user_id: assigneeId },
		},
	});

	if (!membership) {
		throw new AppError(
			status.BAD_REQUEST,
			"Assignee must be a member of this project",
		);
	}
};

/** `in-progress` and `IN_PROGRESS` both resolve to the enum value. */
const normalizeEnumFilter = (
	rawValue: string,
	allowedValues: readonly string[],
	filterName: string,
): string => {
	const normalized = rawValue.trim().toUpperCase().replaceAll("-", "_");

	if (!allowedValues.includes(normalized)) {
		throw new AppError(status.BAD_REQUEST, `Invalid task ${filterName} filter`);
	}

	return normalized;
};

const emptyBoard = (): ITaskBoard => ({
	TODO: [],
	IN_PROGRESS: [],
	IN_REVIEW: [],
	DONE: [],
});

/**
 * Reindexes a Kanban column 1..n so ordering stays dense and stable. The moved
 * task (when provided) is excluded from the query and appended last.
 */
const reindexColumn = async (
	tx: Prisma.TransactionClient,
	projectId: string,
	column: TaskStatus,
	appendedTaskId?: string,
) => {
	const columnTasks = await tx.task.findMany({
		where: {
			project_id: projectId,
			status: column,
			...(appendedTaskId ? { id: { not: appendedTaskId } } : {}),
		},
		orderBy: [{ position: "asc" }, { created_at: "asc" }],
		select: { id: true, position: true },
	});

	if (appendedTaskId) {
		columnTasks.push({ id: appendedTaskId, position: Number.MAX_SAFE_INTEGER });
	}

	const renames = columnTasks
		.map((task, index) => ({ id: task.id, position: index + 1 }))
		.filter((row, index) => columnTasks[index]?.position !== row.position);

	for (const row of renames) {
		await tx.task.update({
			where: { id: row.id },
			data: { position: row.position },
		});
	}
};

const createTask = async (user: Express.User, payload: ITaskPayload) => {
	const project = await findProjectOrThrow(payload.projectId);

	assertProjectOwner(project, user);

	if (project.status === "ARCHIVED") {
		throw new AppError(
			status.BAD_REQUEST,
			"Tasks can't be added to an archived project",
		);
	}

	if (payload.assigneeId) {
		await assertAssignable(project, payload.assigneeId);
	}

	const lastPosition = await prisma.task.aggregate({
		where: { project_id: project.id, status: "TODO" },
		_max: { position: true },
	});

	const task = await prisma.task.create({
		data: {
			title: payload.title,
			...(payload.description !== undefined
				? { description: payload.description }
				: {}),
			...(payload.priority !== undefined ? { priority: payload.priority } : {}),
			...(payload.due_date !== undefined ? { due_date: payload.due_date } : {}),
			...(payload.labels !== undefined ? { labels: payload.labels } : {}),
			...(payload.assigneeId !== undefined
				? { assignee_id: payload.assigneeId }
				: {}),
			position: (lastPosition._max.position ?? 0) + 1,
			project_id: project.id,
			created_by_id: user.id,
		},
		select: taskDetailSelect,
	});

	if (payload.assigneeId) {
		await notifyTaskAssignee(task, payload.assigneeId);
	}

	return task;
};

const getTasks = async (query: ITaskQuery, user: Express.User) => {
	const projectId =
		typeof query.projectId === "string" ? query.projectId.trim() : "";

	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || 10, 1);
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy as string | undefined;
	const sortField: TSortField | undefined =
		sortBy && (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortBy)
			? (sortBy as TSortField)
			: undefined;
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const search = query.search as string | undefined;
	const statusFilter = query.status as string | undefined;
	const priorityFilter = query.priority as string | undefined;
	const assigneeFilter =
		typeof query.assigneeId === "string" ? query.assigneeId.trim() : "";
	const dueBefore =
		typeof query.dueBefore === "string" ? query.dueBefore.trim() : "";

	const andConditions: Prisma.TaskWhereInput[] = [];

	// With a projectId this is a scoped project list; without one it is the
	// authenticated user's cross-project "my tasks" view.
	if (projectId) {
		const { seesAll } = await resolveTaskScope(projectId, user);

		andConditions.push({ project_id: projectId });

		// a TEAM_MEMBER only ever lists the tasks assigned to them
		if (!seesAll) {
			andConditions.push({ assignee_id: user.id });
		} else if (assigneeFilter) {
			andConditions.push({ assignee_id: assigneeFilter });
		}
	} else {
		// Cross-project view: strictly the caller's own assignments, and only
		// inside projects they can still access (owner or active member).
		andConditions.push({ assignee_id: user.id });
		andConditions.push({
			project: {
				OR: [
					{ owner_id: user.id },
					{ members: { some: { user_id: user.id } } },
				],
			},
		});
	}

	if (search) {
		andConditions.push({
			OR: [
				{ title: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (statusFilter) {
		andConditions.push({
			status: normalizeEnumFilter(
				statusFilter,
				Object.values(TaskStatus),
				"status",
			) as TaskStatus,
		});
	}

	if (priorityFilter) {
		andConditions.push({
			priority: normalizeEnumFilter(
				priorityFilter,
				Object.values(TaskPriority),
				"priority",
			) as TaskPriority,
		});
	}

	if (dueBefore) {
		const dueBeforeDate = new Date(dueBefore);

		if (Number.isNaN(dueBeforeDate.getTime())) {
			throw new AppError(status.BAD_REQUEST, "Invalid dueBefore filter");
		}

		andConditions.push({ due_date: { lte: dueBeforeDate } });
	}

	const where: Prisma.TaskWhereInput = { AND: andConditions };

	const [tasks, total] = await Promise.all([
		prisma.task.findMany({
			where,
			select: taskListSelect,
			orderBy: sortField
				? [{ [sortField]: sortOrder }]
				: projectId
					? [{ position: "asc" }, { created_at: "desc" }]
					: [{ created_at: "desc" }],
			skip,
			take: limit,
		}),
		prisma.task.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: tasks, meta };
};

const getBoard = async (projectId: string, user: Express.User) => {
	const trimmedProjectId =
		typeof projectId === "string" ? projectId.trim() : "";

	if (!trimmedProjectId) {
		throw new AppError(
			status.BAD_REQUEST,
			"projectId query parameter is required",
		);
	}

	const { seesAll } = await resolveTaskScope(trimmedProjectId, user);

	const tasks = await prisma.task.findMany({
		where: {
			project_id: trimmedProjectId,
			...(seesAll ? {} : { assignee_id: user.id }),
		},
		select: taskListSelect,
		orderBy: [{ position: "asc" }, { created_at: "asc" }],
	});

	const board = emptyBoard();

	for (const task of tasks) {
		const column = board[task.status];

		if (column) {
			column.push(task);
		}
	}

	return board;
};

const getTaskById = async (taskId: string, user: Express.User) => {
	const task = await findTaskOrThrow(taskId);

	await resolveTaskScope(task.project_id, user);

	return await prisma.task.findUniqueOrThrow({
		where: { id: task.id },
		select: taskDetailSelect,
	});
};

const updateTask = async (
	taskId: string,
	user: Express.User,
	payload: ITaskUpdatePayload,
) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	const isProjectOwner = project.owner_id === user.id;
	const isAdmin = user.role === "ADMIN";
	const isAssignee = task.assignee_id === user.id;
	const isTeamMember = user.role === "TEAM_MEMBER";

	if (!isProjectOwner && !isAdmin) {
		// A TEAM_MEMBER may edit only the task assigned to them.
		if (!(isTeamMember && isAssignee)) {
			assertProjectOwner(project, user);
		}
	}

	if (isTeamMember && payload.assigneeId !== undefined) {
		throw new AppError(status.FORBIDDEN, "You can't reassign this task");
	}

	if (!isTeamMember && payload.assigneeId) {
		await assertAssignable(project, payload.assigneeId);
	}

	const updated = await prisma.task.update({
		where: { id: task.id },
		data: {
			...(payload.title !== undefined ? { title: payload.title } : {}),
			...(payload.description !== undefined
				? { description: payload.description }
				: {}),
			...(payload.priority !== undefined ? { priority: payload.priority } : {}),
			...(payload.due_date !== undefined ? { due_date: payload.due_date } : {}),
			...(payload.labels !== undefined ? { labels: payload.labels } : {}),
			...(!isTeamMember && payload.assigneeId !== undefined
				? { assignee_id: payload.assigneeId }
				: {}),
		},
		select: taskDetailSelect,
	});

	if (
		!isTeamMember &&
		payload.assigneeId &&
		payload.assigneeId !== task.assignee_id
	) {
		await notifyTaskAssignee(updated, payload.assigneeId);
	}

	return updated;
};

const deleteTask = async (taskId: string, user: Express.User) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	if (project.owner_id !== user.id && user.role !== "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can delete this task",
		);
	}

	await prisma.task.delete({ where: { id: task.id } });

	await recordAudit({
		actor: user,
		action: "task.deleted",
		entity: "task",
		entityId: task.id,
		meta: { title: task.title, project_id: task.project_id },
	});

	return { id: task.id, title: task.title };
};

const moveTask = async (
	taskId: string,
	user: Express.User,
	payload: TUpdateTaskStatusPayload,
) => {
	const task = await findTaskOrThrow(taskId);

	// the permission matrix keeps ADMIN off the board routes
	if (user.role === "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"You are not allowed to move tasks on this board",
		);
	}

	const { project } = await resolveTaskScope(task.project_id, user, "write");

	const isProjectOwner = project.owner_id === user.id;
	const isAssignee = task.assignee_id === user.id;

	if (!isProjectOwner && !isAssignee && user.role !== "PROJECT_MANAGER") {
		throw new AppError(
			status.FORBIDDEN,
			"You can only move tasks assigned to you",
		);
	}

	const previousStatus = task.status;

	const updated = await prisma.$transaction(async (tx) => {
		if (previousStatus !== payload.status) {
			await tx.task.update({
				where: { id: task.id },
				data: { status: payload.status },
			});
		}

		await reindexColumn(tx, project.id, payload.status, task.id);

		if (previousStatus !== payload.status) {
			await reindexColumn(tx, project.id, previousStatus);
		}

		return await tx.task.findUniqueOrThrow({
			where: { id: task.id },
			select: taskDetailSelect,
		});
	});

	if (previousStatus !== payload.status) {
		await notifyTaskStatusChanged(updated, payload.status, user.id);
	}

	return updated;
};

const assignTask = async (
	taskId: string,
	user: Express.User,
	payload: TAssignTaskPayload,
) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	assertProjectOwner(project, user);

	if (payload.assigneeId) {
		await assertAssignable(project, payload.assigneeId);
	}

	const updated = await prisma.task.update({
		where: { id: task.id },
		data: { assignee_id: payload.assigneeId },
		select: taskDetailSelect,
	});

	if (payload.assigneeId) {
		await notifyTaskAssignee(updated, payload.assigneeId);
	}

	return updated;
};

export const TaskService = {
	createTask,
	getTasks,
	getBoard,
	getTaskById,
	updateTask,
	deleteTask,
	moveTask,
	assignTask,
};

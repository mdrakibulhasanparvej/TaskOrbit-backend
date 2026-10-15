import status from "http-status";
import type {
	Comment,
	Prisma,
	Project,
} from "../../../../generated/prisma/client";
import { NotificationType } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { IMeta, IQuery } from "../../types";
import AppError from "../../utils/appError";
import { NotificationService } from "../notification/notification.service";
import type {
	TCreateCommentPayload,
	TUpdateCommentPayload,
} from "./comment.schema";

const DEFAULT_PAGE_LIMIT = 20;

// matches "@user@example.com" tokens inside a comment body
const MENTION_REGEX = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

const userBriefSelect = {
	id: true,
	name: true,
	avatar_url: true,
} satisfies Prisma.UserSelect;

const commentSelect = {
	id: true,
	body: true,
	parent_id: true,
	created_at: true,
	updated_at: true,
	author: { select: userBriefSelect },
} satisfies Prisma.CommentSelect;

const commentWithRepliesSelect = {
	...commentSelect,
	replies: {
		select: commentSelect,
		orderBy: [{ created_at: "asc" }],
	},
} satisfies Prisma.CommentSelect;

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

/** Owner and ADMIN bypass the membership row; everyone else needs one. */
const assertProjectMember = async (project: Project, userId: string) => {
	if (project.owner_id === userId) {
		return;
	}

	const membership = await prisma.projectMember.findUnique({
		where: { project_id_user_id: { project_id: project.id, user_id: userId } },
	});

	if (!membership) {
		throw new AppError(
			status.FORBIDDEN,
			"You are not a member of this project",
		);
	}
};

/**
 * Reading a task's comment thread is open to project members, the task
 * assignee and ADMIN — mirroring the task visibility rules from Phase 3.
 */
const assertCanViewTask = async (taskId: string, user: Express.User) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	if (
		user.role === "ADMIN" ||
		project.owner_id === user.id ||
		task.assignee_id === user.id
	) {
		return { task, project };
	}

	await assertProjectMember(project, user.id);

	return { task, project };
};

const extractMentionEmails = (body: string): string[] => {
	const matches = body.match(MENTION_REGEX) ?? [];
	return [...new Set(matches.map((token) => token.slice(1).toLowerCase()))];
};

const getComments = async (
	taskId: string,
	user: Express.User,
	query: IQuery,
) => {
	const { task } = await assertCanViewTask(taskId, user);

	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1);
	const skip = (page - 1) * limit;

	const where: Prisma.CommentWhereInput = {
		task_id: task.id,
		parent_id: null,
	};

	const [comments, total] = await Promise.all([
		prisma.comment.findMany({
			where,
			select: commentWithRepliesSelect,
			orderBy: [{ created_at: "asc" }],
			skip,
			take: limit,
		}),
		prisma.comment.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: comments, meta };
};

const createComment = async (
	taskId: string,
	user: Express.User,
	payload: TCreateCommentPayload,
) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	await assertProjectMember(project, user.id);

	let parent: Comment | null = null;

	if (payload.parent_id) {
		parent = await prisma.comment.findUnique({
			where: { id: payload.parent_id },
		});

		if (!parent || parent.task_id !== task.id) {
			throw new AppError(
				status.BAD_REQUEST,
				"Parent comment not found on this task",
			);
		}

		// threaded comments are capped at one nesting level (top level + replies)
		if (parent.parent_id) {
			throw new AppError(
				status.BAD_REQUEST,
				"You can reply only to top-level comments",
			);
		}
	}

	const comment = await prisma.comment.create({
		data: {
			body: payload.body,
			task_id: task.id,
			author_id: user.id,
			parent_id: parent?.id ?? null,
		},
		select: commentWithRepliesSelect,
	});

	const actorName = comment.author.name;
	const link = `/dashboard/tasks/${task.id}`;
	const notified = new Set<string>();

	const notify = async (
		recipientId: string | null,
		notificationType: NotificationType,
		title: string,
		message: string,
	) => {
		if (!recipientId || recipientId === user.id || notified.has(recipientId)) {
			return;
		}

		notified.add(recipientId);

		await NotificationService.createNotification({
			user_id: recipientId,
			type: notificationType,
			title,
			message,
			link,
			actor_id: user.id,
			actor_name: actorName,
		});
	};

	// replies notify the parent author, top-level comments notify the assignee
	if (parent) {
		await notify(
			parent.author_id,
			NotificationType.COMMENT_ADDED,
			"New reply",
			`${actorName} replied to your comment on "${task.title}"`,
		);
	} else {
		await notify(
			task.assignee_id,
			NotificationType.COMMENT_ADDED,
			"New comment",
			`${actorName} commented on "${task.title}"`,
		);
	}

	const mentionEmails = extractMentionEmails(payload.body);

	if (mentionEmails.length > 0) {
		const mentionedUsers = await prisma.user.findMany({
			where: {
				// mentions are case-insensitive — extractMentionEmails lowercases
				email: { in: mentionEmails, mode: "insensitive" },
				is_deleted: false,
				OR: [
					{ id: project.owner_id },
					{ project_memberships: { some: { project_id: project.id } } },
				],
			},
			select: { id: true },
		});

		for (const mentioned of mentionedUsers) {
			await notify(
				mentioned.id,
				NotificationType.MENTION,
				"Mentioned in a comment",
				`${actorName} mentioned you in a comment on "${task.title}"`,
			);
		}
	}

	return comment;
};

const updateComment = async (
	commentId: string,
	user: Express.User,
	payload: TUpdateCommentPayload,
) => {
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
	});

	if (!comment) {
		throw new AppError(status.NOT_FOUND, "Comment not found");
	}

	if (comment.author_id !== user.id) {
		throw new AppError(status.FORBIDDEN, "You can only edit your own comments");
	}

	// updated_at is bumped automatically by @updatedAt
	return await prisma.comment.update({
		where: { id: comment.id },
		data: { body: payload.body },
		select: commentSelect,
	});
};

const deleteComment = async (commentId: string, user: Express.User) => {
	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
	});

	if (!comment) {
		throw new AppError(status.NOT_FOUND, "Comment not found");
	}

	const task = await findTaskOrThrow(comment.task_id);
	const project = await findProjectOrThrow(task.project_id);

	const isAuthor = comment.author_id === user.id;
	const isOwner = project.owner_id === user.id;

	if (!isAuthor && !isOwner && user.role !== "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"You are not allowed to delete this comment",
		);
	}

	// replies cascade with the parent row
	await prisma.comment.delete({ where: { id: comment.id } });

	return { id: comment.id, task_id: comment.task_id };
};

export const CommentService = {
	getComments,
	createComment,
	updateComment,
	deleteComment,
};

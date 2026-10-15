import status from "http-status";
import type { Prisma, Project } from "../../../../generated/prisma/client";
import type { Plan } from "../../../../generated/prisma/enums";
import { cloudinary } from "../../lib/cloudinary";
import type { TMulterFile } from "../../lib/multer";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/appError";
import { ProjectService } from "../project/project.service";

const MAX_FILES_PER_UPLOAD = 5;

const userBriefSelect = {
	id: true,
	name: true,
	avatar_url: true,
} satisfies Prisma.UserSelect;

const attachmentSelect = {
	id: true,
	file_name: true,
	url: true,
	mime_type: true,
	size: true,
	task_id: true,
	created_at: true,
	uploaded_by: { select: userBriefSelect },
} satisfies Prisma.AttachmentSelect;

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
 * File attachments are a paid extra — gated on the project owner's effective
 * plan, which resolves the owner's active Subscription (Phase 5 billing).
 */
const assertAttachmentsAllowed = async (ownerId: string) => {
	const plan: Plan = await ProjectService.getEffectivePlan(ownerId);

	if (plan === "FREE") {
		throw new AppError(
			status.FORBIDDEN,
			"File attachments require a Pro or Business plan",
		);
	}
};

const normalizeFiles = (
	files: TMulterFile | TMulterFile[] | null | undefined,
): TMulterFile[] => {
	if (!files) {
		return [];
	}

	return Array.isArray(files) ? files : [files];
};

const uploadAttachments = async (
	taskId: string,
	user: Express.User,
	rawFiles: TMulterFile | TMulterFile[] | null,
) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	await assertProjectMember(project, user.id);
	await assertAttachmentsAllowed(project.owner_id);

	const files = normalizeFiles(rawFiles);

	if (files.length === 0) {
		throw new AppError(status.BAD_REQUEST, "At least one file is required");
	}

	if (files.length > MAX_FILES_PER_UPLOAD) {
		throw new AppError(
			status.BAD_REQUEST,
			`You can upload up to ${MAX_FILES_PER_UPLOAD} files at a time`,
		);
	}

	const uploaded = await Promise.all(
		files.map(async (file) => {
			const result = await cloudinary.uploader.upload(
				`data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
				{
					folder: `taskflow/tasks/${task.id}`,
					resource_type: "auto",
				},
			);

			return { file, result };
		}),
	);

	const rows = await prisma.attachment.createManyAndReturn({
		data: uploaded.map(({ file, result }) => ({
			file_name: file.originalname,
			url: result.secure_url,
			public_id: result.public_id,
			mime_type: file.mimetype,
			size: file.size,
			task_id: task.id,
			uploaded_by_id: user.id,
		})),
		select: attachmentSelect,
	});

	return rows;
};

const getTaskAttachments = async (taskId: string, user: Express.User) => {
	const task = await findTaskOrThrow(taskId);
	const project = await findProjectOrThrow(task.project_id);

	// reading attachment metadata is free — same visibility as task comments
	if (
		user.role !== "ADMIN" &&
		project.owner_id !== user.id &&
		task.assignee_id !== user.id
	) {
		await assertProjectMember(project, user.id);
	}

	return await prisma.attachment.findMany({
		where: { task_id: task.id },
		select: attachmentSelect,
		orderBy: [{ created_at: "desc" }],
	});
};

const deleteAttachment = async (attachmentId: string, user: Express.User) => {
	const attachment = await prisma.attachment.findUnique({
		where: { id: attachmentId },
	});

	if (!attachment) {
		throw new AppError(status.NOT_FOUND, "Attachment not found");
	}

	const task = await findTaskOrThrow(attachment.task_id);
	const project = await findProjectOrThrow(task.project_id);

	const isUploader = attachment.uploaded_by_id === user.id;
	const isOwner = project.owner_id === user.id;

	if (!isUploader && !isOwner && user.role !== "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"You are not allowed to delete this attachment",
		);
	}

	// a missing remote asset must not block the DB delete
	try {
		await cloudinary.uploader.destroy(attachment.public_id, {
			resource_type: "auto",
		});
	} catch {
		// asset already gone remotely — proceed with the row delete
	}

	await prisma.attachment.delete({ where: { id: attachment.id } });

	return { id: attachment.id, file_name: attachment.file_name };
};

export const AttachmentService = {
	uploadAttachments,
	getTaskAttachments,
	deleteAttachment,
};

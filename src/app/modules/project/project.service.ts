import crypto from "node:crypto";
import path from "node:path";
import ejs from "ejs";
import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import {
	NotificationType,
	type Plan,
	ProjectStatus,
} from "../../../../generated/prisma/enums";
import config from "../../config";
import transporter, { brandLogoAttachment } from "../../lib/nodeMailer";
import { prisma } from "../../lib/prisma";
import type { IMeta } from "../../types";
import AppError from "../../utils/appError";
import recordAudit from "../../utils/audit";
import { NotificationService } from "../notification/notification.service";
import type {
	IProjectPayload,
	IProjectQuery,
	IProjectUpdatePayload,
} from "./project.interface";
import type {
	TInvitationTokenPayload,
	TInviteMemberPayload,
} from "./project.schema";

const PLAN_LIMITS: Record<
	Plan,
	{ projects: number | null; members: number | null }
> = {
	FREE: { projects: 2, members: 3 },
	PRO: { projects: 15, members: 15 },
	BUSINESS: { projects: null, members: null },
};

const INVITATION_TTL_DAYS = 7;
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;

const ALLOWED_SORT_FIELDS = [
	"name",
	"start_date",
	"end_date",
	"created_at",
] as const;

type TSortField = (typeof ALLOWED_SORT_FIELDS)[number];

const userBriefSelect = {
	id: true,
	name: true,
	email: true,
	avatar_url: true,
	role: true,
} satisfies Prisma.UserSelect;

const projectDetailSelect = {
	id: true,
	name: true,
	description: true,
	status: true,
	start_date: true,
	end_date: true,
	owner_id: true,
	created_at: true,
	updated_at: true,
	owner: { select: userBriefSelect },
	members: {
		select: {
			id: true,
			joined_at: true,
			user: { select: userBriefSelect },
		},
		orderBy: { joined_at: "asc" },
	},
	_count: { select: { tasks: true, members: true } },
} satisfies Prisma.ProjectSelect;

const projectListSelect = {
	id: true,
	name: true,
	description: true,
	status: true,
	start_date: true,
	end_date: true,
	owner_id: true,
	created_at: true,
	updated_at: true,
	owner: { select: userBriefSelect },
	_count: { select: { members: true } },
} satisfies Prisma.ProjectSelect;

const invitationSelect = {
	id: true,
	email: true,
	status: true,
	expires_at: true,
	// 🎯 Return the acceptance token so the invitee can accept/decline the
	// invitation from the in-app list (GET /projects/invitations/mine).
	token: true,
	created_at: true,
	updated_at: true,
	project: {
		select: {
			id: true,
			name: true,
			status: true,
			owner: { select: userBriefSelect },
		},
	},
	invited_by: { select: userBriefSelect },
} satisfies Prisma.ProjectInvitationSelect;

/**
 * Single plan source of truth for every limit check in this module (project
 * creation, member invites) and for the Phase 4 attachment gate.
 * Reads the owner's active Subscription — the only row `payment` activation
 * ever writes — and falls back to FREE for owners without live billing.
 */
const getEffectivePlan = async (ownerId: string): Promise<Plan> => {
	const subscription = await prisma.subscription.findFirst({
		where: {
			owner_id: ownerId,
			status: "ACTIVE",
			OR: [
				{ current_period_end: null },
				{ current_period_end: { gt: new Date() } },
			],
		},
		orderBy: { created_at: "desc" },
		select: { plan: true },
	});

	return subscription?.plan ?? "FREE";
};

const planLimitMessage = (plan: Plan, entity: "projects" | "members") => {
	const limit = PLAN_LIMITS[plan][entity];
	const noun = entity === "projects" ? "projects" : "members per project";
	return `Plan limit reached. Your ${plan} plan allows up to ${limit} ${noun}. Please upgrade your plan to continue.`;
};

const findProjectOrThrow = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });

	if (!project) {
		throw new AppError(status.NOT_FOUND, "Project not found");
	}

	return project;
};

/**
 * ADMIN sees everything, the owner sees their own project, everyone else must
 * hold a ProjectMember row for this project.
 */
const assertProjectAccess = async (projectId: string, user: Express.User) => {
	const project = await findProjectOrThrow(projectId);

	if (user.role === "ADMIN" || project.owner_id === user.id) {
		return project;
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

	return project;
};

const assertProjectOwner = async (projectId: string, user: Express.User) => {
	const project = await findProjectOrThrow(projectId);

	if (project.owner_id !== user.id) {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can perform this action",
		);
	}

	return project;
};

const assertMemberLimit = async (projectId: string, ownerId: string) => {
	const plan = await getEffectivePlan(ownerId);
	const limit = PLAN_LIMITS[plan].members;

	if (limit === null) {
		return;
	}

	const memberCount = await prisma.projectMember.count({
		where: { project_id: projectId },
	});

	if (memberCount >= limit) {
		throw new AppError(status.FORBIDDEN, planLimitMessage(plan, "members"));
	}
};

const sendInvitationMail = async (
	recipientName: string | null,
	email: string,
	projectName: string,
	inviterName: string,
	acceptUrl: string,
	expiresAt: Date,
) => {
	const filePath = path.join(
		process.cwd(),
		"/src/app/templates/project-invitation.ejs",
	);
	const html = await ejs.renderFile(filePath, {
		name: recipientName || "there",
		email,
		projectName,
		inviterName,
		acceptUrl,
		expiresOn: expiresAt.toDateString(),
		expiresInDays: INVITATION_TTL_DAYS,
	});

	try {
		await transporter.sendMail({
			from: config.email_sender,
			to: email,
			subject: `${inviterName} invited you to "${projectName}" on TaskFlow`,
			html,
			attachments: [brandLogoAttachment],
		});
	} catch (error) {
		console.log("Invitation email could not be sent", error);

		// without SMTP credentials the accept link stays available on the dev console
		if (config.environment === "development") {
			console.log(`[DEV]: Project invitation link -> ${acceptUrl}`);
		} else {
			throw new AppError(
				status.BAD_GATEWAY,
				"Invitation email could not be sent. please try again later",
			);
		}
	}
};

const createProject = async (user: Express.User, payload: IProjectPayload) => {
	const plan = await getEffectivePlan(user.id);
	const projectLimit = PLAN_LIMITS[plan].projects;

	const project = await prisma.$transaction(async (tx) => {
		if (projectLimit !== null) {
			const activeProjects = await tx.project.count({
				where: { owner_id: user.id, status: { not: "ARCHIVED" } },
			});

			if (activeProjects >= projectLimit) {
				throw new AppError(
					status.FORBIDDEN,
					planLimitMessage(plan, "projects"),
				);
			}
		}

		return await tx.project.create({
			data: {
				name: payload.name,
				...(payload.description !== undefined
					? { description: payload.description }
					: {}),
				...(payload.status !== undefined ? { status: payload.status } : {}),
				start_date: payload.start_date,
				...(payload.end_date !== undefined
					? { end_date: payload.end_date }
					: {}),
				owner_id: user.id,
			},
			select: projectDetailSelect,
		});
	});

	// audited after the transaction so a rolled-back create leaves no trail
	await recordAudit({
		actor: user,
		action: "project.created",
		entity: "project",
		entityId: project.id,
		meta: { name: project.name, status: project.status },
	});

	return project;
};

const getAllProjects = async (query: IProjectQuery, user: Express.User) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || 10, 1);
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy as string | undefined;
	const sortField: TSortField =
		sortBy && (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortBy)
			? (sortBy as TSortField)
			: "created_at";
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const search = query.search as string | undefined;
	const statusFilter = query.status;

	const andConditions: Prisma.ProjectWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (statusFilter) {
		if (!Object.values(ProjectStatus).includes(statusFilter)) {
			throw new AppError(status.BAD_REQUEST, "Invalid project status filter");
		}

		andConditions.push({ status: statusFilter });
	}

	// manager sees own + member projects, ADMIN sees the whole platform
	if (user.role !== "ADMIN") {
		andConditions.push({
			OR: [{ owner_id: user.id }, { members: { some: { user_id: user.id } } }],
		});
	}

	const where: Prisma.ProjectWhereInput = { AND: andConditions };

	const [projects, total] = await Promise.all([
		prisma.project.findMany({
			where,
			select: projectListSelect,
			orderBy: { [sortField]: sortOrder },
			skip,
			take: limit,
		}),
		prisma.project.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: projects, meta };
};

const getProjectById = async (projectId: string, user: Express.User) => {
	const project = await assertProjectAccess(projectId, user);

	return await prisma.project.findUniqueOrThrow({
		where: { id: project.id },
		select: projectDetailSelect,
	});
};

const updateProject = async (
	projectId: string,
	user: Express.User,
	payload: IProjectUpdatePayload,
) => {
	const project = await findProjectOrThrow(projectId);

	if (project.owner_id !== user.id && user.role !== "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can update this project",
		);
	}

	const updated = await prisma.project.update({
		where: { id: projectId },
		data: {
			...(payload.name !== undefined ? { name: payload.name } : {}),
			...(payload.description !== undefined
				? { description: payload.description }
				: {}),
			...(payload.status !== undefined ? { status: payload.status } : {}),
			...(payload.start_date !== undefined
				? { start_date: payload.start_date }
				: {}),
			...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
		},
		select: projectDetailSelect,
	});

	await recordAudit({
		actor: user,
		action: "project.updated",
		entity: "project",
		entityId: updated.id,
		meta: { name: updated.name, status: updated.status },
	});

	return updated;
};

const deleteProject = async (projectId: string, user: Express.User) => {
	const project = await findProjectOrThrow(projectId);

	if (project.owner_id !== user.id && user.role !== "ADMIN") {
		throw new AppError(
			status.FORBIDDEN,
			"Only the project owner can delete this project",
		);
	}

	await prisma.project.delete({ where: { id: projectId } });

	await recordAudit({
		actor: user,
		action: "project.deleted",
		entity: "project",
		entityId: project.id,
		meta: { name: project.name, owner_id: project.owner_id },
	});

	return { id: project.id, name: project.name };
};

const getProjectMembers = async (projectId: string, user: Express.User) => {
	await assertProjectAccess(projectId, user);

	return await prisma.projectMember.findMany({
		where: { project_id: projectId },
		select: {
			id: true,
			joined_at: true,
			user: { select: userBriefSelect },
		},
		orderBy: { joined_at: "asc" },
	});
};

const removeMember = async (
	projectId: string,
	memberId: string,
	user: Express.User,
) => {
	await assertProjectOwner(projectId, user);

	const member = await prisma.projectMember.findFirst({
		where: { id: memberId, project_id: projectId },
	});

	if (!member) {
		throw new AppError(status.NOT_FOUND, "Member not found in this project");
	}

	await prisma.projectMember.delete({ where: { id: member.id } });

	return { id: member.id };
};

const inviteMember = async (
	projectId: string,
	user: Express.User,
	payload: TInviteMemberPayload,
) => {
	const project = await assertProjectOwner(projectId, user);
	const email = payload.email;

	if (email.toLowerCase() === user.email.toLowerCase()) {
		throw new AppError(status.BAD_REQUEST, "You can't invite yourself");
	}

	await assertMemberLimit(projectId, project.owner_id);

	const existingMember = await prisma.projectMember.findFirst({
		where: {
			project_id: projectId,
			user: { email: { equals: email, mode: "insensitive" } },
		},
	});

	if (existingMember) {
		throw new AppError(
			status.CONFLICT,
			"This email already belongs to a project member",
		);
	}

	const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
	const token = crypto.randomBytes(32).toString("hex");

	// a repeated invite regenerates the token instead of stacking PENDING rows
	const pendingInvitation = await prisma.projectInvitation.findFirst({
		where: {
			project_id: projectId,
			status: "PENDING",
			email: { equals: email, mode: "insensitive" },
		},
	});

	const invitation = pendingInvitation
		? await prisma.projectInvitation.update({
				where: { id: pendingInvitation.id },
				data: { token, expires_at: expiresAt },
				select: invitationSelect,
			})
		: await prisma.projectInvitation.create({
				data: {
					email,
					token,
					project_id: projectId,
					invited_by_id: user.id,
					expires_at: expiresAt,
				},
				select: invitationSelect,
			});

	const [invitedUser, inviter] = await Promise.all([
		prisma.user.findFirst({
			where: { email: { equals: email, mode: "insensitive" } },
			select: { id: true, name: true },
		}),
		prisma.user.findUnique({
			where: { id: user.id },
			select: { name: true },
		}),
	]);

	const inviterName = inviter?.name ?? "A project manager";

	// the invitee may already have an account — mirror the email into their
	// in-app notification center (INVITE_RECEIVED existed in the enum since
	// Phase 1 but was never emitted until now)
	if (invitedUser) {
		await NotificationService.createNotification({
			user_id: invitedUser.id,
			type: NotificationType.INVITE_RECEIVED,
			title: "Project invitation",
			message: `${inviterName} invited you to join "${project.name}"`,
			link: `/invitations?token=${token}`,
			actor_id: user.id,
			actor_name: inviter?.name ?? null,
		});
	}

	await sendInvitationMail(
		invitedUser?.name ?? null,
		email,
		project.name,
		inviterName,
		`${config.frontend_url}/invitations?token=${token}`,
		expiresAt,
	);

	return invitation;
};

const getProjectInvitations = async (projectId: string, user: Express.User) => {
	await assertProjectOwner(projectId, user);

	return await prisma.projectInvitation.findMany({
		where: { project_id: projectId },
		select: invitationSelect,
		orderBy: { created_at: "desc" },
	});
};

const loadInvitationForResponse = async (token: string) => {
	const invitation = await prisma.projectInvitation.findUnique({
		where: { token },
		include: { project: true },
	});

	if (!invitation) {
		throw new AppError(status.NOT_FOUND, "Invalid or expired invitation");
	}

	const isExpired = invitation.expires_at.getTime() < Date.now();

	if (invitation.status !== "PENDING" || isExpired) {
		if (invitation.status === "PENDING" && isExpired) {
			await prisma.projectInvitation.update({
				where: { id: invitation.id },
				data: { status: "EXPIRED" },
			});
		}

		throw new AppError(status.NOT_FOUND, "Invalid or expired invitation");
	}

	return invitation;
};

const assertInvitationBelongsTo = (
	invitationEmail: string,
	user: Express.User,
) => {
	if (invitationEmail.toLowerCase() !== user.email.toLowerCase()) {
		throw new AppError(
			status.FORBIDDEN,
			"This invitation was sent to a different email address",
		);
	}
};

const acceptInvitation = async (
	user: Express.User,
	payload: TInvitationTokenPayload,
) => {
	const invitation = await loadInvitationForResponse(payload.token);

	assertInvitationBelongsTo(invitation.email, user);

	const projectId = invitation.project_id;

	const existingMember = await prisma.projectMember.findUnique({
		where: { project_id_user_id: { project_id: projectId, user_id: user.id } },
	});

	if (!existingMember) {
		// the invite may have been sent under a larger plan — re-check at accept time
		await assertMemberLimit(projectId, invitation.project.owner_id);
	}

	const project = await prisma.$transaction(async (tx) => {
		if (!existingMember) {
			await tx.projectMember.create({
				data: { project_id: projectId, user_id: user.id },
			});
		}

		await tx.projectInvitation.update({
			where: { id: invitation.id },
			data: { status: "ACCEPTED" },
		});

		return await tx.project.findUniqueOrThrow({
			where: { id: projectId },
			select: projectDetailSelect,
		});
	});

	await recordAudit({
		actor: user,
		action: "invitation.accepted",
		entity: "project_invitation",
		entityId: invitation.id,
		meta: { project_id: projectId, project_name: project.name },
	});

	return project;
};

const declineInvitation = async (
	user: Express.User,
	payload: TInvitationTokenPayload,
) => {
	const invitation = await loadInvitationForResponse(payload.token);

	assertInvitationBelongsTo(invitation.email, user);

	return await prisma.projectInvitation.update({
		where: { id: invitation.id },
		data: { status: "DECLINED" },
		select: invitationSelect,
	});
};

const getMyInvitations = async (user: Express.User) => {
	return await prisma.projectInvitation.findMany({
		where: {
			email: { equals: user.email, mode: "insensitive" },
			status: "PENDING",
			expires_at: { gt: new Date() },
		},
		select: invitationSelect,
		orderBy: { created_at: "desc" },
	});
};

export const ProjectService = {
	createProject,
	getAllProjects,
	getProjectById,
	updateProject,
	deleteProject,
	getProjectMembers,
	removeMember,
	inviteMember,
	getProjectInvitations,
	acceptInvitation,
	declineInvitation,
	getMyInvitations,
	// plan source of truth — reads the active Subscription written by billing
	getEffectivePlan,
};

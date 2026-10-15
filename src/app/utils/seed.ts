import path from "node:path";
import { pathToFileURL } from "node:url";
import {
	ContactStatus,
	NotificationType,
	PaymentGateway,
	PaymentStatus,
	Plan,
	ProjectStatus,
	Role,
	SubscriptionStatus,
	TaskPriority,
	TaskStatus,
	UserStatus,
} from "../../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./hashPassword";

/**
 * Deterministic, idempotent demo dataset — run with `npm run seed`.
 *
 * Every row is keyed by a fixed uuid (or a natural unique key), so re-running
 * refreshes the data instead of duplicating it. Due dates are computed relative
 * to the run time, which keeps the "2 overdue / 3 due within 24h" story true
 * no matter when the seed runs.
 *
 * Demo accounts (all verified):
 *   admin@taskflow.dev    / Admin@123    ADMIN
 *   manager@taskflow.dev  / Manager@123  PROJECT_MANAGER
 *   member@taskflow.dev   / Member@123   TEAM_MEMBER
 *   alex|priya|sam|taylor|noah@taskflow.dev / Member@123 (TEAM_MEMBER)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

/** `seedId("a", 3)` → `a0000000-0000-4000-8000-000000000003` (valid uuid). */
const seedId = (tag: string, index: number) =>
	`${tag}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

export const seedAdmin = async () => {
	const adminEmail = config.admin_email;
	const adminPassword = config.admin_password;

	if (!adminEmail || !adminPassword) {
		return console.log(
			"ADMIN_EMAIL / ADMIN_PASSWORD not set, env admin not seeded",
		);
	}

	const existingAdmin = await prisma.user.findUnique({
		where: { email: adminEmail },
	});

	if (existingAdmin) {
		if (existingAdmin.role !== "ADMIN" || !existingAdmin.is_verified) {
			await prisma.user.update({
				where: { id: existingAdmin.id },
				data: { role: "ADMIN", is_verified: true },
			});
			return console.log("Admin account role/verification restored");
		}
		return console.log("Admin exists");
	}

	const hashedPassword = await hashPassword(adminPassword);

	await prisma.user.create({
		data: {
			name: config.admin_name || "TaskFlow Admin",
			email: adminEmail,
			password: hashedPassword,
			role: "ADMIN",
			provider: "CREDENTIALS",
			user_status: "ACTIVE",
			is_verified: true,
		},
	});

	return console.log("Admin created");
};

interface ISeedAccount {
	id: string;
	name: string;
	email: string;
	password: string;
	role: Role;
}

const DEMO_ACCOUNTS: ISeedAccount[] = [
	{
		id: seedId("a", 1),
		name: "TaskFlow Admin",
		email: "admin@taskflow.dev",
		password: "Admin@123",
		role: Role.ADMIN,
	},
	{
		id: seedId("a", 2),
		name: "Maya Manager",
		email: "manager@taskflow.dev",
		password: "Manager@123",
		role: Role.PROJECT_MANAGER,
	},
	{
		id: seedId("a", 3),
		name: "Mia Member",
		email: "member@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
	{
		id: seedId("a", 4),
		name: "Alex Rivera",
		email: "alex@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
	{
		id: seedId("a", 5),
		name: "Priya Nair",
		email: "priya@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
	{
		id: seedId("a", 6),
		name: "Sam Okafor",
		email: "sam@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
	{
		id: seedId("a", 7),
		name: "Taylor Brooks",
		email: "taylor@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
	{
		id: seedId("a", 8),
		name: "Noah Chen",
		email: "noah@taskflow.dev",
		password: "Member@123",
		role: Role.TEAM_MEMBER,
	},
];

const ACCOUNT_BY_EMAIL = new Map(
	DEMO_ACCOUNTS.map((account) => [account.email, account]),
);

const account = (email: string) => {
	const found = ACCOUNT_BY_EMAIL.get(email);

	if (!found) {
		throw new Error(`Seed account "${email}" is not defined`);
	}

	return found;
};

const MEMBER_EMAILS = [
	"member@taskflow.dev",
	"alex@taskflow.dev",
	"priya@taskflow.dev",
	"sam@taskflow.dev",
	"taylor@taskflow.dev",
	"noah@taskflow.dev",
];

const seedAccounts = async () => {
	for (const demo of DEMO_ACCOUNTS) {
		const password = await hashPassword(demo.password);

		await prisma.user.upsert({
			where: { email: demo.email },
			update: {
				name: demo.name,
				password,
				role: demo.role,
				user_status: UserStatus.ACTIVE,
				is_active: true,
				is_verified: true,
				// a fresh seed run also lifts any forced-password-change flag
				need_password_change: false,
			},
			create: {
				id: demo.id,
				name: demo.name,
				email: demo.email,
				password,
				role: demo.role,
				provider: "CREDENTIALS",
				user_status: UserStatus.ACTIVE,
				is_active: true,
				is_verified: true,
				need_password_change: false,
			},
		});
	}

	console.log(`${DEMO_ACCOUNTS.length} demo accounts ready`);
};

/** Manager is on PRO so plan-gated features (attachments, 15 projects) work. */
const seedSubscription = async (ownerId: string) => {
	const data = {
		plan: Plan.PRO,
		status: SubscriptionStatus.ACTIVE,
		current_period_end: daysFromNow(20),
		cancel_at_period_end: false,
	};

	const existing = await prisma.subscription.findFirst({
		where: { owner_id: ownerId },
	});

	if (existing) {
		await prisma.subscription.update({ where: { id: existing.id }, data });
		return;
	}

	await prisma.subscription.create({ data: { ...data, owner_id: ownerId } });
};

const seedPayments = async (ownerId: string) => {
	const now = new Date();
	// one settled payment in each of the last two months so the revenue chart
	// and the billing history are both non-empty
	const rows = [
		{
			transaction_id: "ch_seed_pro_last_month",
			created_at: new Date(now.getFullYear(), now.getMonth() - 1, 15, 10),
		},
		{
			transaction_id: "ch_seed_pro_this_month",
			created_at: new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				10,
			),
		},
	];

	for (const [index, row] of rows.entries()) {
		await prisma.payment.upsert({
			where: { transaction_id: row.transaction_id },
			update: {
				owner_id: ownerId,
				plan: Plan.PRO,
				amount: 12,
				status: PaymentStatus.SUCCESS,
				created_at: row.created_at,
			},
			create: {
				id: seedId("7", index + 1),
				transaction_id: row.transaction_id,
				plan: Plan.PRO,
				amount: 12,
				currency: "USD",
				status: PaymentStatus.SUCCESS,
				payment_gateway: PaymentGateway.STRIPE,
				owner_id: ownerId,
				created_at: row.created_at,
			},
		});
	}

	console.log("Pro subscription + 2 payments ready");
};

interface ISeedProjectSpec {
	id: string;
	name: string;
	description: string;
	status: ProjectStatus;
	startDaysAgo: number;
	endInDays: number | null;
	/** indexes into MEMBER_EMAILS */
	members: number[];
}

const PROJECT_SPECS: ISeedProjectSpec[] = [
	{
		id: seedId("b", 1),
		name: "Website Redesign",
		description:
			"Rebuild the marketing site with a new information architecture, refreshed visual system and a faster frontend.",
		status: ProjectStatus.ACTIVE,
		startDaysAgo: 60,
		endInDays: 30,
		members: [0, 1, 2, 3, 4, 5],
	},
	{
		id: seedId("b", 2),
		name: "Mobile App Launch",
		description:
			"Ship the first public release of the iOS/Android companion app, including onboarding, push notifications and store assets.",
		status: ProjectStatus.ACTIVE,
		startDaysAgo: 30,
		endInDays: 60,
		members: [0, 1, 2, 3],
	},
	{
		id: seedId("b", 3),
		name: "Brand Guidelines",
		description:
			"Document the color, typography and logo rules the whole product and marketing team has to follow.",
		status: ProjectStatus.COMPLETED,
		startDaysAgo: 120,
		endInDays: 20,
		members: [0, 1, 2],
	},
];

const seedProjects = async (ownerId: string) => {
	for (const spec of PROJECT_SPECS) {
		await prisma.project.upsert({
			where: { id: spec.id },
			update: {
				name: spec.name,
				description: spec.description,
				status: spec.status,
				start_date: daysFromNow(-spec.startDaysAgo),
				end_date: spec.endInDays === null ? null : daysFromNow(spec.endInDays),
				owner_id: ownerId,
			},
			create: {
				id: spec.id,
				name: spec.name,
				description: spec.description,
				status: spec.status,
				start_date: daysFromNow(-spec.startDaysAgo),
				end_date: spec.endInDays === null ? null : daysFromNow(spec.endInDays),
				owner_id: ownerId,
			},
		});

		for (const memberIndex of spec.members) {
			const member = account(MEMBER_EMAILS[memberIndex] as string);

			await prisma.projectMember.upsert({
				where: {
					project_id_user_id: {
						project_id: spec.id,
						user_id: member.id,
					},
				},
				update: {},
				create: { project_id: spec.id, user_id: member.id },
			});
		}
	}

	console.log(`${PROJECT_SPECS.length} projects + memberships ready`);
};

interface ISeedTaskSpec {
	/** 1-based, also the uuid index */
	index: number;
	/** 0-based index into PROJECT_SPECS */
	project: number;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	labels: string[];
	/** days from now (neg = overdue), null = no deadline */
	dueIn: number | null;
	/** index into MEMBER_EMAILS */
	assignee: number;
}

const TASK_SPECS: ISeedTaskSpec[] = [
	// --- Website Redesign (2 of each status, 1 overdue, 2 due within 24h)
	{
		index: 1,
		project: 0,
		title: "Audit current site map",
		description: "Inventory every live URL and flag redirect candidates.",
		status: TaskStatus.DONE,
		priority: TaskPriority.MEDIUM,
		labels: ["research"],
		dueIn: null,
		assignee: 0,
	},
	{
		index: 2,
		project: 0,
		title: "Design new homepage mockups",
		description:
			"Desktop and mobile layouts for the new hero and feature grid.",
		status: TaskStatus.IN_PROGRESS,
		priority: TaskPriority.HIGH,
		labels: ["design", "frontend"],
		dueIn: 0.7,
		assignee: 0,
	},
	{
		index: 3,
		project: 0,
		title: "Build hero section",
		description: "Implement the approved hero with responsive breakpoints.",
		status: TaskStatus.IN_PROGRESS,
		priority: TaskPriority.MEDIUM,
		labels: ["frontend"],
		dueIn: 5,
		assignee: 4,
	},
	{
		index: 4,
		project: 0,
		title: "Migrate blog content",
		description: "Move the 42 legacy posts into the new CMS structure.",
		status: TaskStatus.TODO,
		priority: TaskPriority.LOW,
		labels: ["content"],
		dueIn: 10,
		assignee: 2,
	},
	{
		index: 5,
		project: 0,
		title: "Set up analytics events",
		description: "Track CTA clicks, form starts and newsletter signups.",
		status: TaskStatus.TODO,
		priority: TaskPriority.MEDIUM,
		labels: ["analytics"],
		dueIn: 0.5,
		assignee: 5,
	},
	{
		index: 6,
		project: 0,
		title: "Accessibility audit",
		description: "WCAG 2.2 AA pass over the key templates — overdue.",
		status: TaskStatus.IN_REVIEW,
		priority: TaskPriority.URGENT,
		labels: ["qa", "a11y"],
		dueIn: -3,
		assignee: 1,
	},
	{
		index: 7,
		project: 0,
		title: "Client review round 2",
		description: "Consolidate feedback from the stakeholder walkthrough.",
		status: TaskStatus.DONE,
		priority: TaskPriority.LOW,
		labels: ["design"],
		dueIn: null,
		assignee: 4,
	},
	{
		index: 8,
		project: 0,
		title: "Navigation copy review",
		description: "Tighten menu labels before handoff.",
		status: TaskStatus.IN_REVIEW,
		priority: TaskPriority.MEDIUM,
		labels: ["content", "review"],
		dueIn: 2,
		assignee: 5,
	},
	// --- Mobile App Launch (2 of each status, 1 overdue)
	{
		index: 9,
		project: 1,
		title: "Define onboarding flow",
		description: "First-run experience from signup to first project.",
		status: TaskStatus.DONE,
		priority: TaskPriority.HIGH,
		labels: ["product"],
		dueIn: null,
		assignee: 0,
	},
	{
		index: 10,
		project: 1,
		title: "Implement push notifications",
		description: "Task assigned + deadline reminders on both platforms.",
		status: TaskStatus.IN_PROGRESS,
		priority: TaskPriority.HIGH,
		labels: ["mobile", "backend"],
		dueIn: 0.9,
		assignee: 0,
	},
	{
		index: 11,
		project: 1,
		title: "App store screenshots",
		description: "Localized screenshot set for the store listings.",
		status: TaskStatus.IN_PROGRESS,
		priority: TaskPriority.MEDIUM,
		labels: ["marketing"],
		dueIn: 7,
		assignee: 3,
	},
	{
		index: 12,
		project: 1,
		title: "Beta tester recruitment",
		description: "Recruit 50 testers through the newsletter.",
		status: TaskStatus.TODO,
		priority: TaskPriority.MEDIUM,
		labels: ["marketing"],
		dueIn: 14,
		assignee: 0,
	},
	{
		index: 13,
		project: 1,
		title: "Crash reporting setup",
		description: "Wire symbolication and alerting for release builds.",
		status: TaskStatus.TODO,
		priority: TaskPriority.LOW,
		labels: ["mobile", "qa"],
		dueIn: null,
		assignee: 1,
	},
	{
		index: 14,
		project: 1,
		title: "Localize strings",
		description: "Extract every user-facing string — overdue.",
		status: TaskStatus.IN_REVIEW,
		priority: TaskPriority.HIGH,
		labels: ["mobile", "i18n"],
		dueIn: -20,
		assignee: 2,
	},
	{
		index: 15,
		project: 1,
		title: "Performance profiling",
		description: "Cold start and scroll frame profiling on mid-range devices.",
		status: TaskStatus.DONE,
		priority: TaskPriority.MEDIUM,
		labels: ["mobile"],
		dueIn: null,
		assignee: 3,
	},
	{
		index: 16,
		project: 1,
		title: "Release notes v1.0",
		description: "Draft store copy and in-app changelog.",
		status: TaskStatus.IN_REVIEW,
		priority: TaskPriority.LOW,
		labels: ["marketing"],
		dueIn: 3,
		assignee: 1,
	},
	// --- Brand Guidelines (completed project: every task DONE, no deadlines)
	{
		index: 17,
		project: 2,
		title: "Collect brand references",
		description: "Competitor and aspiration boards.",
		status: TaskStatus.DONE,
		priority: TaskPriority.LOW,
		labels: ["research"],
		dueIn: null,
		assignee: 1,
	},
	{
		index: 18,
		project: 2,
		title: "Draft color palette",
		description: "Primary, secondary and semantic color ramps.",
		status: TaskStatus.DONE,
		priority: TaskPriority.MEDIUM,
		labels: ["design"],
		dueIn: null,
		assignee: 2,
	},
	{
		index: 19,
		project: 2,
		title: "Typography selection",
		description: "Heading/body pairing with license review.",
		status: TaskStatus.DONE,
		priority: TaskPriority.MEDIUM,
		labels: ["design"],
		dueIn: null,
		assignee: 0,
	},
	{
		index: 20,
		project: 2,
		title: "Logo usage rules",
		description: "Clear space, minimum size and misuse examples.",
		status: TaskStatus.DONE,
		priority: TaskPriority.HIGH,
		labels: ["design"],
		dueIn: null,
		assignee: 1,
	},
	{
		index: 21,
		project: 2,
		title: "Finalize icon set",
		description: "24px grid icons for the product UI.",
		status: TaskStatus.DONE,
		priority: TaskPriority.MEDIUM,
		labels: ["design"],
		dueIn: null,
		assignee: 2,
	},
	{
		index: 22,
		project: 2,
		title: "Publish guidelines PDF",
		description: "Export and share the final document.",
		status: TaskStatus.DONE,
		priority: TaskPriority.HIGH,
		labels: ["docs"],
		dueIn: null,
		assignee: 1,
	},
	{
		index: 23,
		project: 2,
		title: "Team walkthrough session",
		description: "Walk the whole company through the rules.",
		status: TaskStatus.DONE,
		priority: TaskPriority.LOW,
		labels: ["docs"],
		dueIn: null,
		assignee: 2,
	},
	{
		index: 24,
		project: 2,
		title: "Archive source files",
		description: "Move working files to the archive bucket.",
		status: TaskStatus.DONE,
		priority: TaskPriority.LOW,
		labels: ["ops"],
		dueIn: null,
		assignee: 2,
	},
];

const seedTasks = async () => {
	// dense per-column position so the seeded boards render top-to-bottom
	const positions = new Map<string, number>();

	for (const spec of TASK_SPECS) {
		const project = PROJECT_SPECS[spec.project];

		if (!project) {
			throw new Error(`Task ${spec.index} points at an unknown project`);
		}

		const column = `${project.id}:${spec.status}`;
		const nextPosition = (positions.get(column) ?? 0) + 1;
		positions.set(column, nextPosition);

		const assignee = account(MEMBER_EMAILS[spec.assignee] as string);
		const creator = account("manager@taskflow.dev");
		const dueDate = spec.dueIn === null ? null : daysFromNow(spec.dueIn);

		const data = {
			title: spec.title,
			description: spec.description,
			status: spec.status,
			priority: spec.priority,
			labels: spec.labels,
			due_date: dueDate,
			position: nextPosition,
			project_id: project.id,
			assignee_id: assignee.id,
			created_by_id: creator.id,
		};

		await prisma.task.upsert({
			where: { id: seedId("c", spec.index) },
			update: data,
			create: { id: seedId("c", spec.index), ...data },
		});
	}

	console.log(`${TASK_SPECS.length} tasks ready`);
};

interface ISeedCommentSpec {
	id: string;
	taskIndex: number;
	authorEmail: string;
	body: string;
	parentId: string | null;
	createdDaysAgo: number;
}

const COMMENT_SPECS: ISeedCommentSpec[] = [
	{
		id: seedId("d", 1),
		taskIndex: 2,
		authorEmail: "manager@taskflow.dev",
		body: "Love this direction — can we push the hero headline a touch larger?",
		parentId: null,
		createdDaysAgo: 6,
	},
	{
		id: seedId("d", 2),
		taskIndex: 2,
		authorEmail: "member@taskflow.dev",
		body: "Agreed. I'll also tighten the spacing below the fold.",
		parentId: null,
		createdDaysAgo: 5,
	},
	{
		id: seedId("d", 3),
		taskIndex: 2,
		authorEmail: "alex@taskflow.dev",
		body: "Mockups are in the shared drive — ready for review.",
		parentId: null,
		createdDaysAgo: 4,
	},
	{
		id: seedId("d", 4),
		taskIndex: 2,
		authorEmail: "manager@taskflow.dev",
		body: "Bumped it to 72px in the latest revision.",
		parentId: seedId("d", 1),
		createdDaysAgo: 3,
	},
];

const seedComments = async () => {
	for (const spec of COMMENT_SPECS) {
		const task_id = seedId("c", spec.taskIndex);
		const author = account(spec.authorEmail);
		const data = {
			body: spec.body,
			task_id,
			author_id: author.id,
			parent_id: spec.parentId,
			created_at: daysFromNow(-spec.createdDaysAgo),
		};

		await prisma.comment.upsert({
			where: { id: spec.id },
			update: data,
			create: { id: spec.id, ...data },
		});
	}

	console.log(`${COMMENT_SPECS.length} comments ready`);
};

const seedNotifications = async () => {
	const member = account("member@taskflow.dev");
	const manager = account("manager@taskflow.dev");
	const alex = account("alex@taskflow.dev");
	const taskLink = `/dashboard/tasks/${seedId("c", 2)}`;

	const rows = [
		{
			id: seedId("e", 1),
			type: NotificationType.TASK_ASSIGNED,
			title: "Task assigned",
			message: 'Maya Manager assigned you to "Design new homepage mockups"',
			link: taskLink,
			is_read: true,
			actor_id: manager.id,
			actor_name: manager.name,
			created_at: daysFromNow(-3),
		},
		{
			id: seedId("e", 2),
			type: NotificationType.COMMENT_ADDED,
			title: "New comment",
			message: 'Alex Rivera commented on "Design new homepage mockups"',
			link: taskLink,
			is_read: false,
			actor_id: alex.id,
			actor_name: alex.name,
			created_at: daysFromNow(-1),
		},
		{
			id: seedId("e", 3),
			type: NotificationType.DEADLINE_APPROACHING,
			title: "Deadline approaching",
			message:
				'Task "Design new homepage mockups" is due within the next 24 hours',
			link: taskLink,
			is_read: false,
			actor_id: null,
			actor_name: null,
			created_at: daysFromNow(-0.25),
		},
	];

	for (const row of rows) {
		await prisma.notification.upsert({
			where: { id: row.id },
			update: {
				type: row.type,
				title: row.title,
				message: row.message,
				link: row.link,
				is_read: row.is_read,
				user_id: member.id,
				actor_id: row.actor_id,
				actor_name: row.actor_name,
				created_at: row.created_at,
			},
			create: { ...row, user_id: member.id },
		});
	}

	console.log(`${rows.length} notifications ready`);
};

const CONTACT_SEEDS = [
	{
		id: seedId("f", 1),
		name: "Jordan Lee",
		email: "jordan.lee@example.com",
		subject: "Question about the Business plan",
		message:
			"Do you support invoiced billing and SSO on the Business plan? We're a team of 40 and procurement needs a PO flow.",
		status: ContactStatus.NEW,
		createdDaysAgo: 1,
	},
	{
		id: seedId("f", 2),
		name: "Rita Chen",
		email: "rita.chen@example.com",
		subject: "API rate limits",
		message:
			"What is the rate limit on the public API? We're building a reporting sync and want to stay well inside it.",
		status: ContactStatus.READ,
		createdDaysAgo: 4,
	},
];

const seedContacts = async () => {
	for (const row of CONTACT_SEEDS) {
		const data = {
			name: row.name,
			email: row.email,
			subject: row.subject,
			message: row.message,
			status: row.status,
			created_at: daysFromNow(-row.createdDaysAgo),
		};

		await prisma.contactMessage.upsert({
			where: { id: row.id },
			update: data,
			create: { id: row.id, ...data },
		});
	}

	console.log(`${CONTACT_SEEDS.length} contact messages ready`);
};

const seedAuditLogs = async () => {
	const admin = account("admin@taskflow.dev");
	const manager = account("manager@taskflow.dev");
	const member = account("member@taskflow.dev");

	const rows = [
		{
			index: 1,
			actor: manager,
			action: "project.created",
			entity: "project",
			entity_id: PROJECT_SPECS[2]?.id ?? null,
			meta: { name: "Brand Guidelines", status: ProjectStatus.COMPLETED },
			createdDaysAgo: 120,
		},
		{
			index: 2,
			actor: manager,
			action: "project.created",
			entity: "project",
			entity_id: PROJECT_SPECS[0]?.id ?? null,
			meta: { name: "Website Redesign", status: ProjectStatus.ACTIVE },
			createdDaysAgo: 60,
		},
		{
			index: 3,
			actor: manager,
			action: "project.created",
			entity: "project",
			entity_id: PROJECT_SPECS[1]?.id ?? null,
			meta: { name: "Mobile App Launch", status: ProjectStatus.ACTIVE },
			createdDaysAgo: 30,
		},
		{
			index: 4,
			actor: member,
			action: "invitation.accepted",
			entity: "project_invitation",
			// invitations are consumed by the flow, so the id is not kept around
			entity_id: null,
			meta: {
				project_id: PROJECT_SPECS[0]?.id ?? null,
				project_name: "Website Redesign",
			},
			createdDaysAgo: 25,
		},
		{
			index: 5,
			actor: admin,
			action: "settings.updated",
			entity: "platform_setting",
			entity_id: null,
			meta: { updated: ["registration_open"] },
			createdDaysAgo: 15,
		},
		{
			index: 6,
			actor: manager,
			action: "project.updated",
			entity: "project",
			entity_id: PROJECT_SPECS[2]?.id ?? null,
			meta: { name: "Brand Guidelines", status: ProjectStatus.COMPLETED },
			createdDaysAgo: 20,
		},
		{
			index: 7,
			actor: manager,
			action: "payment.success",
			entity: "payment",
			entity_id: "ch_seed_pro_last_month",
			meta: { plan: Plan.PRO, amount: 12, currency: "USD" },
			createdDaysAgo: 30,
		},
		{
			index: 8,
			actor: manager,
			action: "payment.success",
			entity: "payment",
			entity_id: "ch_seed_pro_this_month",
			meta: { plan: Plan.PRO, amount: 12, currency: "USD" },
			createdDaysAgo: 10,
		},
		{
			index: 9,
			actor: manager,
			action: "task.deleted",
			entity: "task",
			entity_id: seedId("c", 99),
			meta: {
				title: "Old pricing page draft",
				project_id: PROJECT_SPECS[0]?.id ?? null,
			},
			createdDaysAgo: 7,
		},
		{
			index: 10,
			actor: admin,
			action: "contact.status_changed",
			entity: "contact_message",
			entity_id: CONTACT_SEEDS[1]?.id ?? null,
			meta: { from: ContactStatus.NEW, to: ContactStatus.READ },
			createdDaysAgo: 3,
		},
	];

	for (const row of rows) {
		const data = {
			actor_id: row.actor.id,
			actor_name: row.actor.name,
			actor_role: row.actor.role,
			action: row.action,
			entity: row.entity,
			entity_id: row.entity_id,
			meta: row.meta,
			created_at: daysFromNow(-row.createdDaysAgo),
		};

		await prisma.auditLog.upsert({
			where: { id: seedId("9", row.index) },
			update: data,
			create: { id: seedId("9", row.index), ...data },
		});
	}

	console.log(`${rows.length} audit log entries ready`);
};

const seedSettings = async () => {
	const rows: { key: string; value: boolean | string }[] = [
		{ key: "maintenance_mode", value: false },
		{ key: "registration_open", value: true },
		{
			key: "support_email",
			value: config.admin_email || "support@taskflow.dev",
		},
	];

	for (const row of rows) {
		await prisma.platformSetting.upsert({
			where: { key: row.key },
			update: { value: row.value },
			create: { key: row.key, value: row.value },
		});
	}

	console.log(`${rows.length} platform settings ready`);
};

export const runSeed = async () => {
	console.log("Seeding TaskFlow demo data...");

	// the env-configured admin (Phase 1 behaviour) plus the demo trio
	await seedAdmin();
	await seedAccounts();

	const manager = account("manager@taskflow.dev");
	await seedSubscription(manager.id);
	await seedPayments(manager.id);
	await seedProjects(manager.id);
	await seedTasks();
	await seedComments();
	await seedNotifications();
	await seedContacts();
	await seedAuditLogs();
	await seedSettings();

	console.log("\nDemo data ready. Sign in with:");
	console.log("  admin@taskflow.dev    / Admin@123    (ADMIN)");
	console.log("  manager@taskflow.dev  / Manager@123  (PROJECT_MANAGER)");
	console.log("  member@taskflow.dev   / Member@123   (TEAM_MEMBER)");
};

/** `npm run seed` (tsx src/app/utils/seed.ts) — never triggered by server boot. */
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const invokedDirectly =
	pathToFileURL(entryPath).href === import.meta.url ||
	entryPath.replaceAll("\\", "/").endsWith("src/app/utils/seed.ts");

if (invokedDirectly) {
	runSeed()
		.then(async () => {
			await prisma.$disconnect();
		})
		.catch(async (error) => {
			console.error("Seed failed", error);
			await prisma.$disconnect();
			process.exit(1);
		});
}

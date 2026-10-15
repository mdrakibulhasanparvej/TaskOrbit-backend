import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import { ContactStatus } from "../../../../generated/prisma/enums";
import config from "../../config";
import transporter from "../../lib/nodeMailer";
import { prisma } from "../../lib/prisma";
import type { IMeta, IQuery } from "../../types";
import AppError from "../../utils/appError";
import recordAudit from "../../utils/audit";
import type {
	TCreateContactPayload,
	TUpdateContactStatusPayload,
} from "./contact.schema";

const DEFAULT_PAGE_LIMIT = 10;

const contactSelect = {
	id: true,
	name: true,
	email: true,
	subject: true,
	message: true,
	status: true,
	created_at: true,
	updated_at: true,
} satisfies Prisma.ContactMessageSelect;

/** Falls back to the platform admin inbox when no support_email is configured. */
const resolveSupportInbox = async (): Promise<string> => {
	const setting = await prisma.platformSetting.findUnique({
		where: { key: "support_email" },
		select: { value: true },
	});

	if (typeof setting?.value === "string" && setting.value.length > 0) {
		return setting.value;
	}

	return config.admin_email;
};

/**
 * Best-effort copy to the support inbox: the message is already persisted, so a
 * missing SMTP credential must never turn a public form submission into an error.
 */
const notifySupportInbox = async (payload: TCreateContactPayload) => {
	try {
		const inbox = await resolveSupportInbox();

		await transporter.sendMail({
			from: config.email_sender,
			to: inbox,
			subject: `[TaskFlow Contact] ${payload.subject}`,
			text: `New contact message on TaskFlow\n\nName: ${payload.name}\nEmail: ${payload.email}\nSubject: ${payload.subject}\n\n${payload.message}`,
		});
	} catch (error) {
		console.log("Contact notification email could not be sent", error);
	}
};

const createContactMessage = async (payload: TCreateContactPayload) => {
	const message = await prisma.contactMessage.create({
		data: payload,
		select: contactSelect,
	});

	await notifySupportInbox(payload);

	return message;
};

const listContactMessages = async (query: IQuery) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1);
	const skip = (page - 1) * limit;

	const statusFilter =
		typeof query.status === "string" ? query.status : undefined;

	if (
		statusFilter &&
		!Object.values(ContactStatus).includes(statusFilter as ContactStatus)
	) {
		throw new AppError(status.BAD_REQUEST, "Invalid contact status filter");
	}

	const where: Prisma.ContactMessageWhereInput = statusFilter
		? { status: statusFilter as ContactStatus }
		: {};

	const [messages, total] = await Promise.all([
		prisma.contactMessage.findMany({
			where,
			select: contactSelect,
			orderBy: { created_at: "desc" },
			skip,
			take: limit,
		}),
		prisma.contactMessage.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: messages, meta };
};

const updateContactStatus = async (
	actor: Express.User,
	messageId: string,
	payload: TUpdateContactStatusPayload,
) => {
	const existing = await prisma.contactMessage.findUnique({
		where: { id: messageId },
	});

	if (!existing) {
		throw new AppError(status.NOT_FOUND, "Contact message not found");
	}

	const updated = await prisma.contactMessage.update({
		where: { id: existing.id },
		data: { status: payload.status },
		select: contactSelect,
	});

	if (existing.status !== payload.status) {
		await recordAudit({
			actor,
			action: "contact.status_changed",
			entity: "contact_message",
			entityId: existing.id,
			meta: { from: existing.status, to: payload.status },
		});
	}

	return updated;
};

export const ContactService = {
	createContactMessage,
	listContactMessages,
	updateContactStatus,
};

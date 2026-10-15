import type { Prisma } from "../../../generated/prisma/client";
import type { Role } from "../../../generated/prisma/enums";
import { prisma } from "../lib/prisma";

/**
 * Who performed the action. Only `id` is required — `name`/`role` are snapshotted
 * onto the row, and a missing name is resolved from the users table so the log
 * stays readable after the actor is renamed or deleted.
 */
export interface IAuditActor {
	id: string;
	name?: string | null;
	role?: Role | null;
}

export interface IRecordAuditInput {
	/** `null`/omitted = system action (seed, Stripe webhook, cron-style sweep) */
	actor?: IAuditActor | null;
	/** dotted verb, e.g. `project.created`, `user.suspended`, `payment.success` */
	action: string;
	entity: string;
	entityId?: string | null;
	meta?: Prisma.InputJsonValue;
}

/**
 * Single write path for the audit trail. Deliberately fire-and-forget: an audit
 * failure (DB hiccup, bad meta payload) is logged and swallowed so it can never
 * fail the business request that triggered it.
 */
export const recordAudit = async (input: IRecordAuditInput): Promise<void> => {
	try {
		let actorName = input.actor?.name ?? null;

		if (input.actor && !actorName) {
			const actor = await prisma.user.findUnique({
				where: { id: input.actor.id },
				select: { name: true },
			});
			actorName = actor?.name ?? null;
		}

		await prisma.auditLog.create({
			data: {
				actor_id: input.actor?.id ?? null,
				actor_name: actorName,
				actor_role: input.actor?.role ?? null,
				action: input.action,
				entity: input.entity,
				entity_id: input.entityId ?? null,
				...(input.meta === undefined ? {} : { meta: input.meta }),
			},
		});
	} catch (error) {
		console.log("Audit log could not be written", error);
	}
};

export default recordAudit;

import z from "zod";
import { Role, UserStatus } from "../../../../generated/prisma/enums";

export const updateUserStatusSchema = z.object(
	{
		user_status: z.enum(UserStatus, {
			error: "user_status must be ACTIVE or SUSPENDED",
		}),
	},
	"Please provide a valid object",
);

export const updateUserRoleSchema = z.object(
	{
		role: z.enum(Role, {
			error: "role must be ADMIN, PROJECT_MANAGER or TEAM_MEMBER",
		}),
	},
	"Please provide a valid object",
);

export const updateSettingsSchema = z
	.object(
		{
			maintenance_mode: z.boolean().optional(),
			registration_open: z.boolean().optional(),
			support_email: z.email("Invalid email format").optional(),
		},
		"Please provide a valid object",
	)
	.refine(
		(payload) =>
			payload.maintenance_mode !== undefined ||
			payload.registration_open !== undefined ||
			payload.support_email !== undefined,
		{ message: "Provide at least one setting to update" },
	);

export type TUpdateUserStatusPayload = z.infer<typeof updateUserStatusSchema>;
export type TUpdateUserRolePayload = z.infer<typeof updateUserRoleSchema>;
export type TUpdateSettingsPayload = z.infer<typeof updateSettingsSchema>;

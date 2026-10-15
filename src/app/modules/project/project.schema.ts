import z from "zod";
import { ProjectStatus } from "../../../../generated/prisma/enums";

export const createProjectSchema = z.object(
	{
		name: z
			.string("Project name is required")
			.trim()
			.min(1, "Project name can't be empty")
			.max(100, "Project name can't be more than 100 characters"),
		description: z
			.string("Description must be text")
			.max(2000, "Description can't be more than 2000 characters")
			.nullish(),
		status: z.enum(ProjectStatus).optional(),
		start_date: z.coerce.date({ error: "Start date is required" }),
		end_date: z.coerce
			.date({ error: "End date must be a valid date" })
			.nullish(),
	},
	"Please provide a valid object",
);

export const updateProjectSchema = createProjectSchema.partial();

export const inviteMemberSchema = z.object(
	{
		email: z.email("Invalid email format"),
	},
	"Please provide a valid object",
);

export const invitationTokenSchema = z.object(
	{
		token: z
			.string("Invitation token is required")
			.min(1, "Invitation token is required"),
	},
	"Please provide a valid object",
);

export type TCreateProjectPayload = z.infer<typeof createProjectSchema>;
export type TUpdateProjectPayload = z.infer<typeof updateProjectSchema>;
export type TInviteMemberPayload = z.infer<typeof inviteMemberSchema>;
export type TInvitationTokenPayload = z.infer<typeof invitationTokenSchema>;

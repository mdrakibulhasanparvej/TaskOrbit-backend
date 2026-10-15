import z from "zod";
import { ContactStatus } from "../../../../generated/prisma/enums";

export const createContactSchema = z.object(
	{
		name: z
			.string("Name is required")
			.trim()
			.min(1, "Name can't be empty")
			.max(100, "Name can't be more than 100 characters"),
		email: z.email("Invalid email format"),
		subject: z
			.string("Subject is required")
			.trim()
			.min(1, "Subject can't be empty")
			.max(150, "Subject can't be more than 150 characters"),
		message: z
			.string("Message is required")
			.trim()
			.min(1, "Message can't be empty")
			.max(5000, "Message can't be more than 5000 characters"),
	},
	"Please provide a valid object",
);

export const updateContactStatusSchema = z.object(
	{
		status: z.enum(ContactStatus, {
			error: "status must be NEW, READ or RESOLVED",
		}),
	},
	"Please provide a valid object",
);

export type TCreateContactPayload = z.infer<typeof createContactSchema>;
export type TUpdateContactStatusPayload = z.infer<
	typeof updateContactStatusSchema
>;

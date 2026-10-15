import z from "zod";
import { multerFileSchema } from "../../lib/multer";

const passwordField = z
	.string("password is required")
	.min(8, "password must be 8 characters long")
	.max(24, "password can't be more that 24 characters")
	.regex(/[a-z]/, "password should have one small letter")
	.regex(/[A-Z]/, "password should have one capital letter");

export const updateProfileSchema = z.object({
	name: z
		.string("Name must be string")
		.min(1, "Name can't be empty")
		.optional(),
	email: z.email("Invalid email format").optional(),
});

export const changePasswordSchema = z.object({
	current_password: z.string("Current password is required"),
	new_password: passwordField,
});

export const updateAvatarSchema = z.object({
	avatar: multerFileSchema,
});

export type TUpdateProfilePayload = z.infer<typeof updateProfileSchema>;
export type TChangePasswordPayload = z.infer<typeof changePasswordSchema>;
export type TUpdateAvatarPayload = z.infer<typeof updateAvatarSchema>;

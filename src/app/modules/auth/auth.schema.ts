import z from "zod";

const passwordField = z
	.string("password is required")
	.min(8, "password must be 8 characters long")
	.max(24, "password can't be more that 24 characters")
	.regex(/[a-z]/, "password should have one small letter")
	.regex(/[A-Z]/, "password should have one capital letter");

export const registerSchema = z.object(
	{
		name: z.string("Name is required").min(1, "Name is required"),
		email: z.email("Invalid email format"),
		password: passwordField,
		role: z.enum(["PROJECT_MANAGER", "TEAM_MEMBER"]),
	},
	"Please provide a valid object",
);

export const verifyOtpSchema = z.object({
	email: z.email("Invalid email format"),
	otp: z.string("OTP is required").length(6, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
	email: z.email("Invalid email format"),
});

export const loginSchema = z.object({
	email: z.email("Invalid email format"),
	password: passwordField,
});

export type TRegisterPayload = z.infer<typeof registerSchema>;
export type TVerifyOtpPayload = z.infer<typeof verifyOtpSchema>;
export type TResendOtpPayload = z.infer<typeof resendOtpSchema>;
export type TLoginPayload = z.infer<typeof loginSchema>;

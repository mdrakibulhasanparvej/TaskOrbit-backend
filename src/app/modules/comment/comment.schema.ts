import z from "zod";

const COMMENT_MAX_LENGTH = 5000;

const bodyField = z
	.string("Comment body is required")
	.trim()
	.min(1, "Comment body can't be empty")
	.max(
		COMMENT_MAX_LENGTH,
		`Comment body can't be more than ${COMMENT_MAX_LENGTH} characters`,
	);

export const createCommentSchema = z.object(
	{
		body: bodyField,
		parent_id: z
			.string("Parent must be a comment id")
			.min(1, "Parent must be a comment id")
			.nullish(),
	},
	"Please provide a valid object",
);

export const updateCommentSchema = z.object(
	{
		body: bodyField,
	},
	"Please provide a valid object",
);

export type TCreateCommentPayload = z.infer<typeof createCommentSchema>;
export type TUpdateCommentPayload = z.infer<typeof updateCommentSchema>;

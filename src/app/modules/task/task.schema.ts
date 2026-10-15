import z from "zod";
import { TaskPriority, TaskStatus } from "../../../../generated/prisma/enums";

const LABEL_MAX_LENGTH = 30;
const LABELS_MAX_COUNT = 10;

export const createTaskSchema = z.object(
	{
		projectId: z.string("Project is required").min(1, "Project is required"),
		title: z
			.string("Task title is required")
			.trim()
			.min(1, "Task title can't be empty")
			.max(200, "Task title can't be more than 200 characters"),
		description: z
			.string("Description must be text")
			.max(5000, "Description can't be more than 5000 characters")
			.nullish(),
		priority: z
			.enum(TaskPriority, { error: "Invalid task priority" })
			.optional(),
		due_date: z.coerce
			.date({ error: "Due date must be a valid date" })
			.nullish(),
		labels: z
			.array(
				z
					.string("Labels must be text")
					.trim()
					.min(1, "Labels can't contain empty values")
					.max(
						LABEL_MAX_LENGTH,
						`A label can't be more than ${LABEL_MAX_LENGTH} characters`,
					),
			)
			.max(LABELS_MAX_COUNT, `You can add up to ${LABELS_MAX_COUNT} labels`)
			.optional(),
		assigneeId: z
			.string("Assignee must be a user id")
			.min(1, "Assignee must be a user id")
			.nullish(),
	},
	"Please provide a valid object",
);

// status is intentionally excluded — the Kanban column move has its own endpoint
export const updateTaskSchema = createTaskSchema
	.omit({ projectId: true })
	.partial();

export const updateTaskStatusSchema = z.object(
	{
		status: z.enum(TaskStatus, { error: "Task status is required" }),
	},
	"Please provide a valid object",
);

export const assignTaskSchema = z.object(
	{
		assigneeId: z
			.string("Assignee must be a user id")
			.min(1, "Assignee must be a user id")
			.nullable(),
	},
	"Please provide a valid object",
);

export type TCreateTaskPayload = z.infer<typeof createTaskSchema>;
export type TUpdateTaskPayload = z.infer<typeof updateTaskSchema>;
export type TUpdateTaskStatusPayload = z.infer<typeof updateTaskStatusSchema>;
export type TAssignTaskPayload = z.infer<typeof assignTaskSchema>;

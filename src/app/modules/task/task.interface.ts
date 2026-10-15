import type z from "zod";
import type { Task } from "../../../../generated/prisma/client";
import type {
	TaskPriority,
	TaskStatus,
} from "../../../../generated/prisma/enums";
import type { IQuery } from "../../types";
import type { createTaskSchema, updateTaskSchema } from "./task.schema";

export interface ITaskQuery extends IQuery {
	projectId: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	assigneeId?: string;
	dueBefore?: string;
}

export interface IKanbanColumn {
	status: TaskStatus;
	tasks: Task[];
}

/** Shape returned by `GET /tasks/board` — one array per Kanban column. */
export type ITaskBoard = Record<TaskStatus, Task[]>;

export type ITaskPayload = z.infer<typeof createTaskSchema>;
export type ITaskUpdatePayload = z.infer<typeof updateTaskSchema>;

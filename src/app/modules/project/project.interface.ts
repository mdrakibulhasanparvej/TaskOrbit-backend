import type z from "zod";
import type { ProjectStatus } from "../../../../generated/prisma/enums";
import type { IQuery } from "../../types";
import type {
	createProjectSchema,
	updateProjectSchema,
} from "./project.schema";

export interface IProjectQuery extends IQuery {
	status?: ProjectStatus;
}

export type IProjectPayload = z.infer<typeof createProjectSchema>;
export type IProjectUpdatePayload = z.infer<typeof updateProjectSchema>;

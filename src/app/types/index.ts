import type { Role } from "../../../generated/prisma/enums";

export interface IMeta {
	limit: number;
	page: number;
	totalPages: number;
	dataCount: number;
}

export interface IResponsePayload<T = unknown> {
	status?: number;
	success?: boolean;
	message: string;
	data?: T;
	meta?: IMeta;
}

export interface IJwtPayload {
	id: string;
	email: string;
	role: Role;
	/** refresh tokens carry a unique id so rotated-out tokens can be revoked */
	jti?: string;
}

export interface RequestUser {
	id: string;
	email: string;
	role: Role;
}

export interface IQuery {
	searchTerm?: string;
	page?: string;
	limit?: string;
	sortOrder?: "asc" | "desc";
	sortBy?: string;

	// biome-ignore lint/suspicious/noExplicitAny: <flexible query params>
	[key: string]: any;
}

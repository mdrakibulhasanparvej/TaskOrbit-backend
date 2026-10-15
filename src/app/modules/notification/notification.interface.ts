import type { IQuery } from "../../types";

export interface INotificationQuery extends IQuery {
	unreadOnly?: string;
}

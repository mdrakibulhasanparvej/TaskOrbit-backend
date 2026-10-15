import status from "http-status";
import type { IQuery } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ContactService } from "./contact.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const createContactMessage = catchAsync(async (req, res) => {
	const payload = req.body;

	const result = await ContactService.createContactMessage(payload);

	sendResponse(res, {
		status: status.CREATED,
		message: "Message received. We'll get back to you soon",
		data: result,
	});
});

const listContactMessages = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await ContactService.listContactMessages(query);

	sendResponse(res, {
		message: "Contact messages fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const updateContactStatus = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ContactService.updateContactStatus(
		user,
		pathParam(req.params.id),
		req.body,
	);

	sendResponse(res, {
		message: "Contact message updated Successfully",
		data: result,
	});
});

export const ContactController = {
	createContactMessage,
	listContactMessages,
	updateContactStatus,
};

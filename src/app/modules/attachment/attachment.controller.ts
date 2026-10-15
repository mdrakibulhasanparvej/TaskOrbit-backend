import status from "http-status";
import type { TMulterFile } from "../../lib/multer";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AttachmentService } from "./attachment.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const uploadAttachments = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const files = (req.body?.files ?? null) as TMulterFile | TMulterFile[] | null;

	const result = await AttachmentService.uploadAttachments(
		pathParam(req.params.taskId),
		user,
		files,
	);

	sendResponse(res, {
		status: status.CREATED,
		message: "Attachments uploaded Successfully",
		data: result,
	});
});

const getTaskAttachments = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AttachmentService.getTaskAttachments(
		pathParam(req.params.taskId),
		user,
	);

	sendResponse(res, {
		message: "Attachments fetched Successfully",
		data: result,
	});
});

const deleteAttachment = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AttachmentService.deleteAttachment(
		pathParam(req.params.attachmentId),
		user,
	);

	sendResponse(res, {
		message: "Attachment deleted Successfully",
		data: result,
	});
});

export const AttachmentController = {
	uploadAttachments,
	getTaskAttachments,
	deleteAttachment,
};

import status from "http-status";
import type { IQuery } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CommentService } from "./comment.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const getComments = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const query = req.query as unknown as IQuery;

	const result = await CommentService.getComments(
		pathParam(req.params.taskId),
		user,
		query,
	);

	sendResponse(res, {
		message: "Comments fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createComment = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await CommentService.createComment(
		pathParam(req.params.taskId),
		user,
		payload,
	);

	sendResponse(res, {
		status: status.CREATED,
		message: "Comment created Successfully",
		data: result,
	});
});

const updateComment = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await CommentService.updateComment(
		pathParam(req.params.commentId),
		user,
		payload,
	);

	sendResponse(res, {
		message: "Comment updated Successfully",
		data: result,
	});
});

const deleteComment = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await CommentService.deleteComment(
		pathParam(req.params.commentId),
		user,
	);

	sendResponse(res, {
		message: "Comment deleted Successfully",
		data: result,
	});
});

export const CommentController = {
	getComments,
	createComment,
	updateComment,
	deleteComment,
};

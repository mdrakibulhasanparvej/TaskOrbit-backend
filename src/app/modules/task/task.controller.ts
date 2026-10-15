import status from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import type { ITaskQuery } from "./task.interface";
import { TaskService } from "./task.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const getTasks = catchAsync(async (req, res) => {
	const query = req.query as unknown as ITaskQuery;
	const user = req.user as Express.User;

	const result = await TaskService.getTasks(query, user);

	sendResponse(res, {
		message: "Tasks fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createTask = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await TaskService.createTask(user, payload);

	sendResponse(res, {
		status: status.CREATED,
		message: "Task created Successfully",
		data: result,
	});
});

const getBoard = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const projectId = req.query.projectId as string | undefined;

	const result = await TaskService.getBoard(projectId ?? "", user);

	sendResponse(res, {
		message: "Task board fetched Successfully",
		data: result,
	});
});

const getTaskById = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await TaskService.getTaskById(pathParam(req.params.id), user);

	sendResponse(res, {
		message: "Task fetched Successfully",
		data: result,
	});
});

const updateTask = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await TaskService.updateTask(
		pathParam(req.params.id),
		user,
		payload,
	);

	sendResponse(res, {
		message: "Task updated Successfully",
		data: result,
	});
});

const deleteTask = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await TaskService.deleteTask(pathParam(req.params.id), user);

	sendResponse(res, {
		message: "Task deleted Successfully",
		data: result,
	});
});

const moveTask = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await TaskService.moveTask(
		pathParam(req.params.id),
		user,
		payload,
	);

	sendResponse(res, {
		message: "Task moved Successfully",
		data: result,
	});
});

const assignTask = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await TaskService.assignTask(
		pathParam(req.params.id),
		user,
		payload,
	);

	sendResponse(res, {
		message: "Task assigned Successfully",
		data: result,
	});
});

export const TaskController = {
	getTasks,
	createTask,
	getBoard,
	getTaskById,
	updateTask,
	deleteTask,
	moveTask,
	assignTask,
};

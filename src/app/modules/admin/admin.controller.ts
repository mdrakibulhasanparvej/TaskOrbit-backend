import type { IQuery } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const listUsers = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await AdminService.listUsers(query);

	sendResponse(res, {
		message: "Users fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const setUserStatus = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AdminService.setUserStatus(
		user,
		pathParam(req.params.id),
		req.body,
	);

	sendResponse(res, {
		message: "User status updated Successfully",
		data: result,
	});
});

const changeUserRole = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AdminService.changeUserRole(
		user,
		pathParam(req.params.id),
		req.body,
	);

	sendResponse(res, {
		message: "User role updated Successfully",
		data: result,
	});
});

const allProjects = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await AdminService.allProjects(query);

	sendResponse(res, {
		message: "Projects fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const deleteAnyProject = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AdminService.deleteAnyProject(
		user,
		pathParam(req.params.id),
	);

	sendResponse(res, {
		message: "Project deleted Successfully",
		data: result,
	});
});

const allPayments = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await AdminService.allPayments(query);

	sendResponse(res, {
		message: "Payments fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getReports = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await AdminService.getReports(query);

	sendResponse(res, {
		message: "Reports fetched Successfully",
		data: result,
	});
});

const getSettings = catchAsync(async (_, res) => {
	const result = await AdminService.getSettings();

	sendResponse(res, {
		message: "Settings fetched Successfully",
		data: result,
	});
});

const updateSettings = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AdminService.updateSettings(user, req.body);

	sendResponse(res, {
		message: "Settings updated Successfully",
		data: result,
	});
});

export const AdminController = {
	listUsers,
	setUserStatus,
	changeUserRole,
	allProjects,
	deleteAnyProject,
	allPayments,
	getReports,
	getSettings,
	updateSettings,
};

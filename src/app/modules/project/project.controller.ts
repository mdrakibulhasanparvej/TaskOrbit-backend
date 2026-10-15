import status from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import type { IProjectQuery } from "./project.interface";
import { ProjectService } from "./project.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const getMyProjects = catchAsync(async (req, res) => {
	const query = req.query as unknown as IProjectQuery;
	const user = req.user as Express.User;

	const result = await ProjectService.getAllProjects(query, user);

	sendResponse(res, {
		message: "Projects fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createProject = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await ProjectService.createProject(user, payload);

	sendResponse(res, {
		status: status.CREATED,
		message: "Project created Successfully",
		data: result,
	});
});

const getProjectById = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.getProjectById(
		pathParam(req.params.id),
		user,
	);

	sendResponse(res, {
		message: "Project fetched Successfully",
		data: result,
	});
});

const updateProject = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await ProjectService.updateProject(
		pathParam(req.params.id),
		user,
		payload,
	);

	sendResponse(res, {
		message: "Project updated Successfully",
		data: result,
	});
});

const deleteProject = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.deleteProject(
		pathParam(req.params.id),
		user,
	);

	sendResponse(res, {
		message: "Project deleted Successfully",
		data: result,
	});
});

const getProjectMembers = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.getProjectMembers(
		pathParam(req.params.id),
		user,
	);

	sendResponse(res, {
		message: "Project members fetched Successfully",
		data: result,
	});
});

const removeMember = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.removeMember(
		pathParam(req.params.id),
		pathParam(req.params.memberId),
		user,
	);

	sendResponse(res, {
		message: "Member removed Successfully",
		data: result,
	});
});

const inviteMember = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await ProjectService.inviteMember(
		pathParam(req.params.id),
		user,
		payload,
	);

	sendResponse(res, {
		status: status.CREATED,
		message: "Invitation sent Successfully",
		data: result,
	});
});

const getProjectInvitations = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.getProjectInvitations(
		pathParam(req.params.id),
		user,
	);

	sendResponse(res, {
		message: "Project invitations fetched Successfully",
		data: result,
	});
});

const acceptInvitation = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await ProjectService.acceptInvitation(user, payload);

	sendResponse(res, {
		message: "Invitation accepted Successfully",
		data: result,
	});
});

const declineInvitation = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await ProjectService.declineInvitation(user, payload);

	sendResponse(res, {
		message: "Invitation declined Successfully",
		data: result,
	});
});

const getMyInvitations = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await ProjectService.getMyInvitations(user);

	sendResponse(res, {
		message: "Invitations fetched Successfully",
		data: result,
	});
});

export const ProjectController = {
	getMyProjects,
	createProject,
	getProjectById,
	updateProject,
	deleteProject,
	getProjectMembers,
	removeMember,
	inviteMember,
	getProjectInvitations,
	acceptInvitation,
	declineInvitation,
	getMyInvitations,
};

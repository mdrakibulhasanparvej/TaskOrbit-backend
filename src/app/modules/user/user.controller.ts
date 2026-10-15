import type { IQuery } from "../../types";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";

const getAllUsers = catchAsync(async (req, res) => {
	const query = req.query as unknown as IQuery;

	const result = await UserService.getAllUsers(query);

	sendResponse(res, {
		message: "Users fetched Successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyProfile = catchAsync(async (req, res) => {
	const userId = req.user?.id as string;

	const result = await UserService.getMyProfile(userId);

	sendResponse(res, {
		message: "Profile data fetched Successfully",
		data: result,
	});
});

const updateProfile = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	const result = await UserService.updateProfile(user, payload);

	sendResponse(res, {
		message: "Profile updated Successfully",
		data: result,
	});
});

const changePassword = catchAsync(async (req, res) => {
	const user = req.user as Express.User;
	const payload = req.body;

	await UserService.changePassword(user, payload);

	sendResponse(res, {
		message: "Password changed Successfully",
	});
});

const updateAvatar = catchAsync(async (req, res) => {
	const avatar = req.file as Express.Multer.File;
	const user = req.user as Express.User;

	const result = await UserService.updateAvatar(user, avatar);

	sendResponse(res, {
		message: "Avatar updated Successfully",
		data: { avatar_url: result },
	});
});

export const UserController = {
	getAllUsers,
	getMyProfile,
	updateProfile,
	changePassword,
	updateAvatar,
};

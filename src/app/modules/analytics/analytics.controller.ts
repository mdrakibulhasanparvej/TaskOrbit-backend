import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";

// route params are index-signature based, but always present once a route matched
const pathParam = (value: string | string[] | undefined) => value as string;

const getAdminAnalytics = catchAsync(async (_, res) => {
	const result = await AnalyticsService.getAdminAnalytics();

	sendResponse(res, {
		message: "Platform analytics fetched Successfully",
		data: result,
	});
});

const getManagerAnalytics = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AnalyticsService.getManagerAnalytics(user);

	sendResponse(res, {
		message: "Manager analytics fetched Successfully",
		data: result,
	});
});

const getProjectAnalytics = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AnalyticsService.getProjectAnalytics(
		user,
		pathParam(req.params.projectId),
	);

	sendResponse(res, {
		message: "Project analytics fetched Successfully",
		data: result,
	});
});

const getMemberProgress = catchAsync(async (req, res) => {
	const user = req.user as Express.User;

	const result = await AnalyticsService.getMemberProgress(user);

	sendResponse(res, {
		message: "Progress fetched Successfully",
		data: result,
	});
});

export const AnalyticsController = {
	getAdminAnalytics,
	getManagerAnalytics,
	getProjectAnalytics,
	getMemberProgress,
};

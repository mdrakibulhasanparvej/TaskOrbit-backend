import type { Response } from "express";
import status from "http-status";
import type { IResponsePayload } from "../types/index.js";

const sendResponse = (res: Response, payload: IResponsePayload) => {
	const responseStatus = payload.status ? payload.status : status.OK;
	const responseSuccess = payload.success ? payload.success : true;
	const responseData = payload.data ? payload.data : undefined;
	const responseMeta = payload.meta ? payload.meta : undefined;

	res.status(responseStatus).json({
		success: responseSuccess,
		message: payload.message,
		data: responseData,
		meta: responseMeta,
	});
};

export default sendResponse;

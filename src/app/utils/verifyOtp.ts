import status from "http-status";
import redisClient from "../lib/redis";
import AppError from "./appError";

interface OtpPayload {
	otp: number;
	otpKey: string;
}
export const verifyOtp = async (payload: OtpPayload) => {
	const redisOtp = await redisClient.get(payload.otpKey);

	if (!redisOtp) {
		throw new AppError(status.NOT_FOUND, "OTP expired, please try again");
	}

	if (payload.otp !== Number(redisOtp)) {
		throw new AppError(status.BAD_REQUEST, "Invalid OTP");
	}

	await redisClient.del(payload.otpKey);

	return true;
};

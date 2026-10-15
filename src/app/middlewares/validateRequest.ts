import type z from "zod";
import { catchAsync } from "../utils/catchAsync";

const validateRequest = (schema: z.ZodObject) => {
	return catchAsync((req, _, next) => {
		const payload = req.body;

		const result = schema.parse(payload);

		req.body = result;

		next();
	});
};

export default validateRequest;

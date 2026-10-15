import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import config from "../config";
import AppError from "../utils/appError";

const { JsonWebTokenError } = jwt;

const errorHandler = async (
	err: unknown,
	_: Request,
	res: Response,
	__: NextFunction,
) => {
	let statusCode: number = status.INTERNAL_SERVER_ERROR;
	let message: string = "";
	let errorName: string = "Internal Server Error";
	let errorStack: string | undefined;

	if (err instanceof Prisma.PrismaClientValidationError) {
		errorName = err.name;
		statusCode = status.BAD_REQUEST;
		message = "You have provided incorrect field type or missing fields";
		errorStack = err.stack;
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		errorName = err.name;
		statusCode = status.BAD_REQUEST;
		errorStack = err.stack;
		if (err.code === "P2002") {
			message = "Duplicate Key Error";
		} else if (err.code === "P2003") {
			message = "Foreign key constraint failed";
		} else if (err.code === "P2025") {
			message =
				"An operation failed because it depends on one or more records that were required but not found.";
		}
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		errorName = err.name;
		errorStack = err.stack;
		if (err.errorCode === "P1000") {
			statusCode = status.UNAUTHORIZED;
			message =
				"Authentication failed against database server. Please Check Your Credentials";
		} else if (err.errorCode === "P1001") {
			statusCode = status.BAD_REQUEST;
			message = "Can't reach database server";
		}
	} else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		errorName = err.name;
		statusCode = status.INTERNAL_SERVER_ERROR;
		message = "Error occurred during query execution";
		errorStack = err.stack;
	} else if (err instanceof ZodError) {
		statusCode = status.BAD_REQUEST;
		errorName = "ValidationError";
		errorStack = err.stack;

		const formattedIssues = err.issues.map((issue) => {
			const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "field";
			return `${fieldPath}: ${issue.message}`;
		});
		message = formattedIssues.join("; ");
	} else if (err instanceof JsonWebTokenError) {
		errorName = err.name;
		message = "Invalid Token";
		errorStack = err.stack;
		statusCode = status.BAD_REQUEST;
	} else if (err instanceof AppError) {
		errorName = err.name;
		message = err.message;
		errorStack = err.stack;
		statusCode = err.code;
	} else if (err instanceof Error) {
		errorName = err.name;
		errorStack = err.stack;
		message = err.message;
	}

	res.status(statusCode).json({
		success: false,
		errorName,
		message,
		stack: config.environment === "development" ? errorStack : undefined,
	});
};

export default errorHandler;

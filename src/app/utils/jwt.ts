import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { IJwtPayload } from "../types/index.js";

const { JsonWebTokenError } = jwt;

const signToken = (
	payload: IJwtPayload,
	secret: string,
	expiresIn?: SignOptions["expiresIn"],
) => {
	return expiresIn
		? jwt.sign(payload, secret, { expiresIn })
		: jwt.sign(payload, secret);
};

const verifyToken = (token: string, secret: string) => {
	try {
		const decode = jwt.verify(token, secret) as IJwtPayload;
		return {
			success: true,
			message: "token verified",
			data: decode,
			error: undefined,
		};
	} catch (err: unknown) {
		return {
			success: false,
			message:
				err instanceof JsonWebTokenError
					? err.message
					: "error while verifying token",
			data: undefined,
			error: err,
		};
	}
};

export { signToken, verifyToken };

class AppError extends Error {
	public readonly code: number;

	constructor(code: number, message: string) {
		super(message);
		this.code = code;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export default AppError;

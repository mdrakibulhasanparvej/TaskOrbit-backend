import bcrypt from "bcryptjs";
import config from "../config";

const hashPassword = async (password: string) => {
	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bcrypt_salt_rounds),
	);
	return hashedPassword;
};

const comparePassword = async (password: string, hashedPassword: string) => {
	const result = await bcrypt.compare(password, hashedPassword);
	return result;
};

export { comparePassword, hashPassword };

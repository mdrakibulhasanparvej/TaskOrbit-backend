import path from "node:path";
import nodeMailer from "nodemailer";
import config from "../config";

const transporter = nodeMailer.createTransport({
	service: "gmail",
	auth: {
		user: config.email_sender,
		pass: config.google_app_password,
	},
});

export const brandLogoAttachment = {
	filename: "brand-logo.png",
	path: path.resolve(process.cwd(), "public", "brand-logo.png"),
	cid: "brand-logo",
};

export default transporter;

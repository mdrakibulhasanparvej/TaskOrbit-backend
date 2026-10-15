import app from "./app";
import config from "./app/config";
import transporter from "./app/lib/nodeMailer";
import { prisma } from "./app/lib/prisma";
import redisClient from "./app/lib/redis";
import { seedAdmin } from "./app/utils/seed";

const port = config.port;

if (!port) {
	throw new Error("port is missing in env");
}

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Connected to database successfully");

		await redisClient.connect();
		console.log("Redis connected successfully");

		await transporter.verify().catch((error: unknown) => {
			console.log("nodemailer not reachable, OTP mails will fail", error);
		});
		await seedAdmin();

		app.listen(port, () => {
			console.log(`Server is running on port: ${port}`);
		});
	} catch (error) {
		console.log(`Failed to start the server`, error);
		prisma.$disconnect();
		process.exit(1);
	}
};

main();

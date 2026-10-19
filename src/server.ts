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

		// Redis is a cache/OTP store and must never block or crash the API.
		// Connect in the background: the client's keep-alive ping and reconnect
		// strategy restore the link on their own, and Redis-backed features
		// degrade gracefully while it is unavailable.
		redisClient
			.connect()
			.then(() => {
				console.log("Redis connected successfully");
			})
			.catch((error: unknown) => {
				console.error(
					"Redis initial connection failed; retrying in the background",
					error,
				);
			});

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

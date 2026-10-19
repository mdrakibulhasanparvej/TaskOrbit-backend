import { createClient } from "redis";
import config from "../config";

/**
 * Redis is a cache/OTP/session-tracking store — it must never be able to take
 * the whole API down.
 *
 * - `pingInterval` sends a PING every 30s so idle connections are not silently
 *   culled by a proxy/NAT and later surface as an ECONNRESET.
 * - `socket.keepAlive` enables TCP keep-alive at the OS level.
 * - `reconnectStrategy` retries forever with capped backoff instead of giving
 *   up after the first failure.
 * - The `error` listener is MANDATORY: node-redis re-emits socket errors (e.g.
 *   ECONNRESET, or a failed keep-alive ping) on the client, and an EventEmitter
 *   `error` event with no listener is an unhandled error that terminates the
 *   Node process.
 */
const redisClient = createClient({
	username: config.redis_username,
	password: config.redis_password,
	// Keep-alive PING so long-lived idle connections stay alive.
	pingInterval: 30_000,
	socket: {
		host: config.redis_host,
		port: Number(config.redis_port),
		connectTimeout: 10_000,
		keepAlive: true,
		keepAliveInitialDelay: 5_000,
		// Never give up: back off to at most 5s between attempts.
		reconnectStrategy: (retries) => Math.min(retries * 200, 5_000),
	},
});

redisClient.on("error", (error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`[redis] client error: ${message}`);
});

redisClient.on("connect", () => {
	console.log("[redis] connecting...");
});

redisClient.on("ready", () => {
	console.log("[redis] connection ready");
});

redisClient.on("reconnecting", () => {
	console.warn("[redis] reconnecting...");
});

redisClient.on("end", () => {
	console.warn("[redis] connection closed");
});

export default redisClient;

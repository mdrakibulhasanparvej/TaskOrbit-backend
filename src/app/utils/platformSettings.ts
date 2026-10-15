import config from "../config";
import { prisma } from "../lib/prisma";

export interface IPlatformSettings {
	maintenance_mode: boolean;
	registration_open: boolean;
	support_email: string;
}

export const PLATFORM_SETTING_KEYS = [
	"maintenance_mode",
	"registration_open",
	"support_email",
] as const;

export type SettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

/**
 * Single reader for the `platform_settings` table — the admin settings
 * endpoints, the register gate and the maintenance guard all share it so a
 * default can never drift between call sites.
 *
 * Missing keys resolve to their documented defaults:
 * `maintenance_mode=false`, `registration_open=true`,
 * `support_email=config.admin_email`.
 */
export const getPlatformSettings = async (): Promise<IPlatformSettings> => {
	const rows = await prisma.platformSetting.findMany({
		where: { key: { in: [...PLATFORM_SETTING_KEYS] } },
		select: { key: true, value: true },
	});

	const values = new Map(rows.map((row) => [row.key, row.value]));
	const supportEmail = values.get("support_email");

	return {
		maintenance_mode: values.get("maintenance_mode") === true,
		registration_open: values.get("registration_open") !== false,
		support_email:
			typeof supportEmail === "string" && supportEmail.length > 0
				? supportEmail
				: config.admin_email,
	};
};

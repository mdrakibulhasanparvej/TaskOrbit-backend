import z from "zod";
import { Plan } from "../../../../generated/prisma/enums";

/**
 * FREE is never purchasable — checkout only upgrades a paid tier.
 */
export const createCheckoutSchema = z.object(
	{
		plan: z
			.enum(Plan, { error: "Plan must be PRO or BUSINESS" })
			.refine((plan) => plan !== Plan.FREE, {
				message: "Only the PRO and BUSINESS plans can be purchased",
			}),
	},
	"Please provide a valid object",
);

export type TCreateCheckoutPayload = z.infer<typeof createCheckoutSchema>;

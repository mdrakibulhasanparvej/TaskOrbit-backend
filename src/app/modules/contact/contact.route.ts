import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ContactController } from "./contact.controller";
import {
	createContactSchema,
	updateContactStatusSchema,
} from "./contact.schema";

const router = Router();

// public form — anyone can write in, only ADMIN can read the inbox
router.post(
	"/",
	validateRequest(createContactSchema),
	ContactController.createContactMessage,
);

router.get("/", auth(Role.ADMIN), ContactController.listContactMessages);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(updateContactStatusSchema),
	ContactController.updateContactStatus,
);

export const ContactRoutes = router;

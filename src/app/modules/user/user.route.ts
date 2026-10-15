import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import upload from "../../lib/multer";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import mergeMulterPayload from "../../utils/mergeMulterPayload";
import { UserController } from "./user.controller";
import {
	changePasswordSchema,
	updateAvatarSchema,
	updateProfileSchema,
} from "./user.schema";

const router = Router();

router.get("/", auth(Role.ADMIN), UserController.getAllUsers);

router.get("/me", auth(), UserController.getMyProfile);

router.patch(
	"/me",
	auth(),
	validateRequest(updateProfileSchema),
	UserController.updateProfile,
);

router.patch(
	"/me/password",
	auth(),
	validateRequest(changePasswordSchema),
	UserController.changePassword,
);

router.patch(
	"/me/avatar",
	auth(),
	upload.single("avatar"),
	mergeMulterPayload("avatar"),
	validateRequest(updateAvatarSchema),
	UserController.updateAvatar,
);

export const UserRoutes = router;

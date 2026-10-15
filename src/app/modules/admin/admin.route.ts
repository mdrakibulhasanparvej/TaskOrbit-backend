import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import {
	updateSettingsSchema,
	updateUserRoleSchema,
	updateUserStatusSchema,
} from "./admin.schema";

const router = Router();

// every route is ADMIN-only — the role layer also gives each 401 on mismatch
router.get("/users", auth(Role.ADMIN), AdminController.listUsers);

router.patch(
	"/users/:id/status",
	auth(Role.ADMIN),
	validateRequest(updateUserStatusSchema),
	AdminController.setUserStatus,
);

router.patch(
	"/users/:id/role",
	auth(Role.ADMIN),
	validateRequest(updateUserRoleSchema),
	AdminController.changeUserRole,
);

router.get("/projects", auth(Role.ADMIN), AdminController.allProjects);

router.delete(
	"/projects/:id",
	auth(Role.ADMIN),
	AdminController.deleteAnyProject,
);

router.get("/payments", auth(Role.ADMIN), AdminController.allPayments);

router.get("/reports", auth(Role.ADMIN), AdminController.getReports);

// static "/settings" before any "/:id" style route is ever introduced
router.get("/settings", auth(Role.ADMIN), AdminController.getSettings);

router.patch(
	"/settings",
	auth(Role.ADMIN),
	validateRequest(updateSettingsSchema),
	AdminController.updateSettings,
);

export const AdminRoutes = router;

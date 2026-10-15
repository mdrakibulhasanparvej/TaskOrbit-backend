import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get("/admin", auth(Role.ADMIN), AnalyticsController.getAdminAnalytics);

router.get(
	"/manager",
	auth(Role.PROJECT_MANAGER),
	AnalyticsController.getManagerAnalytics,
);

router.get(
	"/project/:projectId",
	auth(Role.PROJECT_MANAGER),
	AnalyticsController.getProjectAnalytics,
);

router.get(
	"/member",
	auth(Role.TEAM_MEMBER),
	AnalyticsController.getMemberProgress,
);

export const AnalyticsRoutes = router;

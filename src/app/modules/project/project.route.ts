import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectController } from "./project.controller";
import {
	createProjectSchema,
	invitationTokenSchema,
	inviteMemberSchema,
	updateProjectSchema,
} from "./project.schema";

const router = Router();

// static invitation routes first so they never collide with "/:id"
router.post(
	"/invitations/accept",
	auth(Role.TEAM_MEMBER, Role.PROJECT_MANAGER),
	validateRequest(invitationTokenSchema),
	ProjectController.acceptInvitation,
);

router.post(
	"/invitations/decline",
	auth(Role.TEAM_MEMBER, Role.PROJECT_MANAGER),
	validateRequest(invitationTokenSchema),
	ProjectController.declineInvitation,
);

router.get("/invitations/mine", auth(), ProjectController.getMyInvitations);

router.get(
	"/",
	auth(Role.PROJECT_MANAGER, Role.ADMIN),
	ProjectController.getMyProjects,
);

router.post(
	"/",
	auth(Role.PROJECT_MANAGER),
	validateRequest(createProjectSchema),
	ProjectController.createProject,
);

router.get(
	"/:id",
	auth(Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER),
	ProjectController.getProjectById,
);

router.patch(
	"/:id",
	auth(Role.PROJECT_MANAGER),
	validateRequest(updateProjectSchema),
	ProjectController.updateProject,
);

router.delete(
	"/:id",
	auth(Role.PROJECT_MANAGER, Role.ADMIN),
	ProjectController.deleteProject,
);

router.get(
	"/:id/members",
	auth(Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER),
	ProjectController.getProjectMembers,
);

router.delete(
	"/:id/members/:memberId",
	auth(Role.PROJECT_MANAGER),
	ProjectController.removeMember,
);

router.post(
	"/:id/invitations",
	auth(Role.PROJECT_MANAGER),
	validateRequest(inviteMemberSchema),
	ProjectController.inviteMember,
);

router.get(
	"/:id/invitations",
	auth(Role.PROJECT_MANAGER),
	ProjectController.getProjectInvitations,
);

export const ProjectRoutes = router;

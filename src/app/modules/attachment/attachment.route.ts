import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import upload from "../../lib/multer";
import auth from "../../middlewares/auth";
import mergeMulterPayload from "../../utils/mergeMulterPayload";
import { AttachmentController } from "./attachment.controller";

const router = Router();

router.post(
	"/:taskId/attachments",
	auth(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
	upload.array("files", 5),
	mergeMulterPayload("files"),
	AttachmentController.uploadAttachments,
);

router.get(
	"/:taskId/attachments",
	auth(),
	AttachmentController.getTaskAttachments,
);

// namespaced under "/attachments" so the id never collides with the task
// "/:id" routes that share the /api/v1/tasks mount prefix
router.delete(
	"/attachments/:attachmentId",
	auth(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
	AttachmentController.deleteAttachment,
);

export const AttachmentRoutes = router;

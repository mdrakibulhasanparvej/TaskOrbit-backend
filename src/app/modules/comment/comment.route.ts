import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { CommentController } from "./comment.controller";
import { createCommentSchema, updateCommentSchema } from "./comment.schema";

const router = Router();

router.get("/:taskId/comments", auth(), CommentController.getComments);

router.post(
	"/:taskId/comments",
	auth(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
	validateRequest(createCommentSchema),
	CommentController.createComment,
);

// namespaced under "/comments" so they never collide with the task "/:id"
// routes that share the /api/v1/tasks mount prefix
router.patch(
	"/comments/:commentId",
	auth(),
	validateRequest(updateCommentSchema),
	CommentController.updateComment,
);

router.delete(
	"/comments/:commentId",
	auth(Role.PROJECT_MANAGER, Role.ADMIN),
	CommentController.deleteComment,
);

export const CommentRoutes = router;

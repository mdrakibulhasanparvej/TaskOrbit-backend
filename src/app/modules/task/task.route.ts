import { Router } from "express";
import { Role } from "../../../../generated/prisma/enums";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import {
	assignTaskSchema,
	createTaskSchema,
	updateTaskSchema,
	updateTaskStatusSchema,
} from "./task.schema";

const router = Router();

router.get("/", auth(), TaskController.getTasks);

router.post(
	"/",
	auth(Role.PROJECT_MANAGER),
	validateRequest(createTaskSchema),
	TaskController.createTask,
);

// static route first so it never collides with "/:id"
router.get("/board", auth(), TaskController.getBoard);

router.get("/:id", auth(), TaskController.getTaskById);

router.patch(
	"/:id",
	auth(Role.PROJECT_MANAGER),
	validateRequest(updateTaskSchema),
	TaskController.updateTask,
);

router.delete(
	"/:id",
	auth(Role.PROJECT_MANAGER, Role.ADMIN),
	TaskController.deleteTask,
);

router.patch(
	"/:id/status",
	auth(),
	validateRequest(updateTaskStatusSchema),
	TaskController.moveTask,
);

router.patch(
	"/:id/assign",
	auth(Role.PROJECT_MANAGER),
	validateRequest(assignTaskSchema),
	TaskController.assignTask,
);

export const TaskRoutes = router;

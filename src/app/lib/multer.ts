import multer from "multer";
import z from "zod";

// 10MB per-file cap, shared by avatar and task attachment uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
	limits: { fileSize: MAX_FILE_SIZE },
});

export type TMulterFile = Express.Multer.File;

export const multerFileSchema = z.object({
	fieldname: z.string(),
	originalname: z.string(),
	encoding: z.string(),
	mimetype: z.string(),
	buffer: z.instanceof(Buffer),
	size: z.number(),
});
export default upload;

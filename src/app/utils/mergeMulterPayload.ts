import type { NextFunction, Request, Response } from "express";
import type { TMulterFile } from "../lib/multer";

const mergeMulterPayload = (...fields: string[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		// express 5 leaves req.body undefined when no body parser matched
		if (!req.body) {
			req.body = {};
		}

		// parse the data from body.data
		if (req.body.data) {
			try {
				const parsedData = JSON.parse(req.body.data);
				req.body = { ...req.body, ...parsedData };
				delete req.body.data;
			} catch (_) {
				return res
					.status(400)
					.json({ message: "Invalid JSON format in body data" });
			}
		}

		if (req.files) {
			// upload.array() yields a flat array; upload.fields() yields an object
			// keyed by fieldname — normalize both to the keyed shape
			let files: { [fieldname: string]: TMulterFile[] };

			if (Array.isArray(req.files)) {
				files = {};
				for (const file of req.files as TMulterFile[]) {
					const group = files[file.fieldname] ?? [];
					group.push(file);
					files[file.fieldname] = group;
				}
			} else {
				files = req.files as { [fieldname: string]: TMulterFile[] };
			}

			fields.forEach((field) => {
				if (files[field]?.length) {
					const fieldFiles = files[field] as TMulterFile[];
					req.body[field] =
						fieldFiles.length === 1 ? fieldFiles[0] : fieldFiles;
				} else {
					req.body[field] = null;
				}
			});
		}

		if (req.file) {
			const fieldName = fields[0] as string;
			req.body[fieldName] = req.file;
		}

		next();
	};
};

export default mergeMulterPayload;

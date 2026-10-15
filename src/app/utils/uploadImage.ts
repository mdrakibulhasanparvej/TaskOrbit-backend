import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { cloudinary } from "../lib/cloudinary";
import AppError from "./appError";

const uploadImage = async (
	buffer: Buffer | undefined,
	options?: UploadApiOptions,
) => {
	return await new Promise<UploadApiResponse | null>((resolve, reject) => {
		if (!buffer) {
			return resolve(null);
		}
		const upload_stream = cloudinary.uploader.upload_stream(
			{
				resource_type: "auto",
				transformation: [{ quality: "auto", fetch_format: "auto" }],
				...options,
			},
			(err, result) => {
				if (err || !result) {
					console.log("Cloudinary error", err);
					return reject(
						new AppError(err?.http_code as number, err?.message as string),
					);
				}
				return resolve(result);
			},
		);
		streamifier.createReadStream(buffer).pipe(upload_stream);
	});
};

export default uploadImage;

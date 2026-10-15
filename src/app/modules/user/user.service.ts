import status from "http-status";
import type { Prisma } from "../../../../generated/prisma/client";
import type { Role, UserStatus } from "../../../../generated/prisma/enums";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import type { IMeta, IQuery } from "../../types";
import AppError from "../../utils/appError";
import { comparePassword, hashPassword } from "../../utils/hashPassword";
import uploadImage from "../../utils/uploadImage";
import type {
	TChangePasswordPayload,
	TUpdateProfilePayload,
} from "./user.schema";

const ALLOWED_SORT_FIELDS = [
	"name",
	"email",
	"created_at",
	"last_login_at",
	"role",
	"user_status",
] as const;

type TSortField = (typeof ALLOWED_SORT_FIELDS)[number];

const userSelect = {
	id: true,
	name: true,
	email: true,
	avatar_url: true,
	role: true,
	user_status: true,
	is_active: true,
	is_verified: true,
	last_login_at: true,
	created_at: true,
} satisfies Prisma.UserSelect;

const getAllUsers = async (query: IQuery) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.max(Number(query.limit) || 10, 1);
	const skip = (page - 1) * limit;

	const sortBy = query.sortBy as string | undefined;
	const sortField: TSortField =
		sortBy && (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortBy)
			? (sortBy as TSortField)
			: "created_at";
	const sortOrder: Prisma.SortOrder =
		query.sortOrder === "asc" ? "asc" : "desc";

	const search = query.search as string | undefined;
	const roleFilter = query.role as Role | undefined;
	const statusFilter = query.status as UserStatus | undefined;

	const andConditions: Prisma.UserWhereInput[] = [{ is_deleted: false }];

	if (search) {
		andConditions.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			],
		});
	}

	if (roleFilter) {
		andConditions.push({ role: roleFilter });
	}

	if (statusFilter) {
		andConditions.push({ user_status: statusFilter });
	}

	const where: Prisma.UserWhereInput = { AND: andConditions };

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: userSelect,
			orderBy: { [sortField]: sortOrder },
			skip,
			take: limit,
		}),
		prisma.user.count({ where }),
	]);

	const meta: IMeta = {
		page,
		limit,
		dataCount: total,
		totalPages: Math.ceil(total / limit) || 1,
	};

	return { data: users, meta };
};

const getMyProfile = async (userId: string) => {
	const userProfile = await prisma.user.findUnique({
		where: { id: userId },
		omit: { password: true },
	});

	if (!userProfile) {
		throw new AppError(status.NOT_FOUND, "User profile not found");
	}

	return userProfile;
};

const updateProfile = async (
	user: Express.User,
	payload: TUpdateProfilePayload,
) => {
	const { name, email } = payload;

	if (email && email !== user.email) {
		const isEmailTaken = await prisma.user.findUnique({
			where: { email },
		});

		if (isEmailTaken) {
			throw new AppError(status.CONFLICT, "This email is already in use");
		}
	}

	const updatedUser = await prisma.user.update({
		where: { id: user.id },
		data: {
			...(name ? { name } : {}),
			...(email ? { email } : {}),
		},
		omit: { password: true },
	});

	return updatedUser;
};

const changePassword = async (
	user: Express.User,
	payload: TChangePasswordPayload,
) => {
	const { current_password, new_password } = payload;

	const existingUser = await prisma.user.findUnique({
		where: { id: user.id },
	});

	if (!existingUser) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	if (!existingUser.password) {
		throw new AppError(
			status.BAD_REQUEST,
			"No password is set for this account",
		);
	}

	const isCurrentPasswordValid = await comparePassword(
		current_password,
		existingUser.password,
	);

	if (!isCurrentPasswordValid) {
		throw new AppError(status.UNAUTHORIZED, "Current password is incorrect");
	}

	const hashedPassword = await hashPassword(new_password);

	await prisma.user.update({
		where: { id: user.id },
		// a deliberate password change also lifts the forced-change flag that
		// reset-password may have set
		data: { password: hashedPassword, need_password_change: false },
	});

	return true;
};

const updateAvatar = async (
	user: Express.User,
	avatar: Express.Multer.File,
) => {
	const existingUser = await prisma.user.findUnique({
		where: { id: user.id },
	});

	if (!existingUser) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	const avatarDetails = await uploadImage(avatar.buffer, {
		folder: "profile/avatar",
	});

	if (!avatarDetails) {
		throw new AppError(status.BAD_REQUEST, "Avatar file is required");
	}

	await prisma.user.update({
		where: { id: user.id },
		data: {
			avatar_url: avatarDetails.secure_url,
			avatar_public_id: avatarDetails.public_id,
		},
	});

	if (existingUser.avatar_public_id) {
		await cloudinary.uploader.destroy(existingUser.avatar_public_id);
	}

	return avatarDetails.secure_url;
};

export const UserService = {
	getAllUsers,
	getMyProfile,
	updateProfile,
	changePassword,
	updateAvatar,
};

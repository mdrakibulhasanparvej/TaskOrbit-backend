-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "need_password_change" BOOLEAN NOT NULL DEFAULT false;

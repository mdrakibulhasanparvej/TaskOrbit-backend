
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

// src/app/config/index.ts
import path from "path";
import process2, { env } from "process";
import dotenv from "dotenv";
var envPath = path.join(process2.cwd(), "/.env");
dotenv.config({ path: envPath, quiet: true });
var config_default = {
  environment: env.ENVIRONMENT,
  port: env.PORT,
  frontend_url: env.FRONTEND_URL || "http://localhost:3000",
  database_url: env.DATABASE_URL,
  bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS,
  // JWT credentials
  jwt_access_secret: env.JWT_ACCESS_SECRET,
  jwt_access_time: env.JWT_ACCESS_TIME,
  jwt_refresh_secret: env.JWT_REFRESH_SECRET,
  jwt_refresh_time: env.JWT_REFRESH_TIME,
  // cloudinary credentials
  cloudinary_cloud_name: env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: env.CLOUDINARY_API_SECRET,
  // redis credentials
  redis_username: env.REDIS_USERNAME,
  redis_password: env.REDIS_PASSWORD,
  redis_host: env.REDIS_HOST,
  redis_port: env.REDIS_PORT,
  // nodemailer credentials
  email_sender: env.EMAIL_SENDER,
  google_app_password: env.GOOGLE_APP_PASSWORD,
  // google oauth (ID token audience for POST /api/v1/auth/google)
  google_client_id: env.GOOGLE_CLIENT_ID,
  // platform admin credentials
  admin_name: env.ADMIN_NAME,
  admin_email: env.ADMIN_EMAIL,
  admin_password: env.ADMIN_PASSWORD,
  // stripe
  stripe_secret_key: env.STRIPE_SECRET_KEY,
  stripe_webhook_secret: env.STRIPE_WEBHOOK_SECRET
};

// src/app/middlewares/globalErrorHandler.ts
import status from "http-status";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

// generated/prisma/client.ts
import "process";
import * as path2 from "path";
import { fileURLToPath } from "url";
import "@prisma/client/runtime/client";

// generated/prisma/enums.ts
var Role = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  TEAM_MEMBER: "TEAM_MEMBER",
  CLIENT: "CLIENT"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED"
};
var ProjectStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED"
};
var TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE"
};
var TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT"
};
var Plan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS"
};
var SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  PAST_DUE: "PAST_DUE"
};
var PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};
var PaymentGateway = {
  STRIPE: "STRIPE",
  SSLCOMMERZ: "SSLCOMMERZ"
};
var NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  MENTION: "MENTION",
  DEADLINE_APPROACHING: "DEADLINE_APPROACHING",
  INVITE_RECEIVED: "INVITE_RECEIVED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS"
};
var ContactStatus = {
  NEW: "NEW",
  READ: "READ",
  RESOLVED: "RESOLVED"
};

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [
    "partialIndexes"
  ],
  "clientVersion": "7.10.0",
  "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
  "activeProvider": "postgresql",
  "inlineSchema": `model Attachment {
  id             String  @id @default(uuid())
  file_name      String
  url            String
  public_id      String
  mime_type      String?
  size           Int?
  task_id        String
  uploaded_by_id String

  task        Task @relation(fields: [task_id], references: [id], onDelete: Cascade)
  uploaded_by User @relation(fields: [uploaded_by_id], references: [id], onDelete: Cascade)

  created_at DateTime @default(now())

  @@index([task_id])
  @@index([uploaded_by_id])
  @@map("attachments")
}

// Deliberately relation-free: an audit trail must survive the deletion of the
// users and projects it references, so actor/entity ids stay plain strings.
model AuditLog {
  id         String  @id @default(uuid())
  actor_id   String?
  // denormalized snapshot \u2014 the actor's display name at the time of the action
  actor_name String?
  actor_role Role?

  // dotted verb, e.g. "project.created", "user.suspended", "payment.success"
  action    String
  entity    String
  entity_id String?
  meta      Json?

  created_at DateTime @default(now())

  @@index([action])
  @@index([entity])
  @@index([created_at])
  @@map("audit_logs")
}

model Comment {
  id        String  @id @default(uuid())
  body      String
  task_id   String
  author_id String
  parent_id String?

  task    Task      @relation(fields: [task_id], references: [id], onDelete: Cascade)
  author  User      @relation(fields: [author_id], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parent_id], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([task_id])
  @@index([author_id])
  @@index([parent_id])
  @@map("comments")
}

model ContactMessage {
  id      String        @id @default(uuid())
  name    String
  email   String
  subject String
  message String
  status  ContactStatus @default(NEW)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([status])
  @@map("contact_messages")
}

enum Providers {
  GOOGLE
  CREDENTIALS
}

enum Role {
  ADMIN
  PROJECT_MANAGER
  TEAM_MEMBER
  CLIENT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Plan {
  FREE
  PRO
  BUSINESS
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAST_DUE
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum PaymentGateway {
  STRIPE
  SSLCOMMERZ
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_STATUS_CHANGED
  COMMENT_ADDED
  MENTION
  DEADLINE_APPROACHING
  INVITE_RECEIVED
  PAYMENT_SUCCESS
}

enum ContactStatus {
  NEW
  READ
  RESOLVED
}

model Notification {
  id      String           @id @default(uuid())
  type    NotificationType
  title   String
  message String
  is_read Boolean          @default(false)
  link    String?

  user_id String
  user    User   @relation(fields: [user_id], references: [id], onDelete: Cascade)

  // plain ids (no relation) keep user deletes non-blocking; name is snapshotted
  actor_id   String?
  actor_name String?

  created_at DateTime @default(now())

  @@index([user_id, is_read])
  @@map("notifications")
}

model Payment {
  id               String         @id @default(uuid())
  plan             Plan
  amount           Float
  currency         String         @default("USD")
  status           PaymentStatus  @default(PENDING)
  payment_gateway  PaymentGateway @default(STRIPE)
  // Stripe Checkout Session id \u2014 the idempotency key for activation
  transaction_id   String?        @unique
  gateway_response Json?

  owner_id String
  owner    User   @relation(fields: [owner_id], references: [id], onDelete: Cascade)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([owner_id])
  @@index([owner_id, status])
  @@map("payments")
}

model ProjectMember {
  id         String @id @default(uuid())
  project_id String
  user_id    String

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  joined_at  DateTime @default(now())
  created_at DateTime @default(now())

  @@unique([project_id, user_id])
  @@index([user_id])
  @@map("project_members")
}

model ProjectInvitation {
  id     String           @id @default(uuid())
  email  String
  token  String           @unique
  status InvitationStatus @default(PENDING)

  project_id    String
  invited_by_id String

  project    Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  invited_by User    @relation(fields: [invited_by_id], references: [id], onDelete: Cascade)

  expires_at DateTime
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([email])
  @@index([project_id])
  @@map("project_invitations")
}

model Project {
  id          String        @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(PLANNING)

  start_date DateTime
  end_date   DateTime?

  owner_id String
  owner    User   @relation(fields: [owner_id], references: [id], onDelete: Cascade)

  members     ProjectMember[]
  invitations ProjectInvitation[]
  tasks       Task[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([owner_id])
  @@map("projects")
}

generator client {
  provider        = "prisma-client"
  output          = "../../generated/prisma"
  previewFeatures = ["partialIndexes"]
}

datasource db {
  provider = "postgresql"
}

// Feature flags and platform-wide knobs, addressed by a stable string key.
// Seeded keys: maintenance_mode (false), registration_open (true),
// support_email (string).
model PlatformSetting {
  id    String @id @default(uuid())
  key   String @unique
  value Json

  updated_at DateTime @updatedAt

  @@map("platform_settings")
}

model Subscription {
  id                   String             @id @default(uuid())
  plan                 Plan               @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  current_period_end   DateTime?
  cancel_at_period_end Boolean            @default(false)

  owner_id String
  owner    User   @relation(fields: [owner_id], references: [id], onDelete: Cascade)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // one row per owner, enforced by the service (find-or-create inside the
  // activation transaction) rather than by a schema-level unique constraint
  @@index([owner_id])
  @@index([owner_id, status])
  @@map("subscriptions")
}

model Task {
  id          String  @id @default(uuid())
  title       String
  description String?

  status   TaskStatus   @default(TODO)
  priority TaskPriority @default(MEDIUM)
  due_date DateTime?
  labels   String[]     @default([])

  // ordering inside a Kanban column
  position Int @default(0)

  project_id String
  project    Project @relation(fields: [project_id], references: [id], onDelete: Cascade)

  assignee_id String?
  assignee    User?   @relation("TaskAssignee", fields: [assignee_id], references: [id], onDelete: SetNull)

  created_by_id String
  created_by    User   @relation("TaskCreator", fields: [created_by_id], references: [id], onDelete: Cascade)

  comments    Comment[]
  attachments Attachment[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([project_id])
  @@index([assignee_id])
  @@map("tasks")
}

model User {
  id       String  @id @default(uuid())
  name     String
  email    String  @unique
  password String?

  google_id String? @unique

  avatar_url       String?
  avatar_public_id String?

  role        Role       @default(TEAM_MEMBER)
  provider    Providers  @default(CREDENTIALS)
  user_status UserStatus @default(ACTIVE)

  is_active   Boolean @default(true)
  is_deleted  Boolean @default(false)
  is_verified Boolean @default(false)

  need_password_change Boolean   @default(false)
  deleted_at           DateTime?

  last_login_at DateTime?

  owned_projects      Project[]
  project_memberships ProjectMember[]
  invitations_sent    ProjectInvitation[]
  assigned_tasks      Task[]              @relation("TaskAssignee")
  created_tasks       Task[]              @relation("TaskCreator")
  comments            Comment[]
  attachments         Attachment[]
  notifications       Notification[]
  subscriptions       Subscription[]
  payments            Payment[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([role])
  @@index([user_status])
  @@map("users")
}
`,
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Attachment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"file_name","kind":"scalar","type":"String"},{"name":"url","kind":"scalar","type":"String"},{"name":"public_id","kind":"scalar","type":"String"},{"name":"mime_type","kind":"scalar","type":"String"},{"name":"size","kind":"scalar","type":"Int"},{"name":"task_id","kind":"scalar","type":"String"},{"name":"uploaded_by_id","kind":"scalar","type":"String"},{"name":"task","kind":"object","type":"Task","relationName":"AttachmentToTask"},{"name":"uploaded_by","kind":"object","type":"User","relationName":"AttachmentToUser"},{"name":"created_at","kind":"scalar","type":"DateTime"}],"dbName":"attachments","schema":null},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"actor_id","kind":"scalar","type":"String"},{"name":"actor_name","kind":"scalar","type":"String"},{"name":"actor_role","kind":"enum","type":"Role"},{"name":"action","kind":"scalar","type":"String"},{"name":"entity","kind":"scalar","type":"String"},{"name":"entity_id","kind":"scalar","type":"String"},{"name":"meta","kind":"scalar","type":"Json"},{"name":"created_at","kind":"scalar","type":"DateTime"}],"dbName":"audit_logs","schema":null},"Comment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"task_id","kind":"scalar","type":"String"},{"name":"author_id","kind":"scalar","type":"String"},{"name":"parent_id","kind":"scalar","type":"String"},{"name":"task","kind":"object","type":"Task","relationName":"CommentToTask"},{"name":"author","kind":"object","type":"User","relationName":"CommentToUser"},{"name":"parent","kind":"object","type":"Comment","relationName":"CommentReplies"},{"name":"replies","kind":"object","type":"Comment","relationName":"CommentReplies"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"comments","schema":null},"ContactMessage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"subject","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ContactStatus"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"contact_messages","schema":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"NotificationType"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"is_read","kind":"scalar","type":"Boolean"},{"name":"link","kind":"scalar","type":"String"},{"name":"user_id","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"actor_id","kind":"scalar","type":"String"},{"name":"actor_name","kind":"scalar","type":"String"},{"name":"created_at","kind":"scalar","type":"DateTime"}],"dbName":"notifications","schema":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"plan","kind":"enum","type":"Plan"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"payment_gateway","kind":"enum","type":"PaymentGateway"},{"name":"transaction_id","kind":"scalar","type":"String"},{"name":"gateway_response","kind":"scalar","type":"Json"},{"name":"owner_id","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"payments","schema":null},"ProjectMember":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"project_id","kind":"scalar","type":"String"},{"name":"user_id","kind":"scalar","type":"String"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectMember"},{"name":"user","kind":"object","type":"User","relationName":"ProjectMemberToUser"},{"name":"joined_at","kind":"scalar","type":"DateTime"},{"name":"created_at","kind":"scalar","type":"DateTime"}],"dbName":"project_members","schema":null},"ProjectInvitation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"token","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"InvitationStatus"},{"name":"project_id","kind":"scalar","type":"String"},{"name":"invited_by_id","kind":"scalar","type":"String"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectInvitation"},{"name":"invited_by","kind":"object","type":"User","relationName":"ProjectInvitationToUser"},{"name":"expires_at","kind":"scalar","type":"DateTime"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"project_invitations","schema":null},"Project":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ProjectStatus"},{"name":"start_date","kind":"scalar","type":"DateTime"},{"name":"end_date","kind":"scalar","type":"DateTime"},{"name":"owner_id","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"ProjectToUser"},{"name":"members","kind":"object","type":"ProjectMember","relationName":"ProjectToProjectMember"},{"name":"invitations","kind":"object","type":"ProjectInvitation","relationName":"ProjectToProjectInvitation"},{"name":"tasks","kind":"object","type":"Task","relationName":"ProjectToTask"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"projects","schema":null},"PlatformSetting":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"Json"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"platform_settings","schema":null},"Subscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"plan","kind":"enum","type":"Plan"},{"name":"status","kind":"enum","type":"SubscriptionStatus"},{"name":"current_period_end","kind":"scalar","type":"DateTime"},{"name":"cancel_at_period_end","kind":"scalar","type":"Boolean"},{"name":"owner_id","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"SubscriptionToUser"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"subscriptions","schema":null},"Task":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TaskStatus"},{"name":"priority","kind":"enum","type":"TaskPriority"},{"name":"due_date","kind":"scalar","type":"DateTime"},{"name":"labels","kind":"scalar","type":"String"},{"name":"position","kind":"scalar","type":"Int"},{"name":"project_id","kind":"scalar","type":"String"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToTask"},{"name":"assignee_id","kind":"scalar","type":"String"},{"name":"assignee","kind":"object","type":"User","relationName":"TaskAssignee"},{"name":"created_by_id","kind":"scalar","type":"String"},{"name":"created_by","kind":"object","type":"User","relationName":"TaskCreator"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToTask"},{"name":"attachments","kind":"object","type":"Attachment","relationName":"AttachmentToTask"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"tasks","schema":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"google_id","kind":"scalar","type":"String"},{"name":"avatar_url","kind":"scalar","type":"String"},{"name":"avatar_public_id","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"provider","kind":"enum","type":"Providers"},{"name":"user_status","kind":"enum","type":"UserStatus"},{"name":"is_active","kind":"scalar","type":"Boolean"},{"name":"is_deleted","kind":"scalar","type":"Boolean"},{"name":"is_verified","kind":"scalar","type":"Boolean"},{"name":"need_password_change","kind":"scalar","type":"Boolean"},{"name":"deleted_at","kind":"scalar","type":"DateTime"},{"name":"last_login_at","kind":"scalar","type":"DateTime"},{"name":"owned_projects","kind":"object","type":"Project","relationName":"ProjectToUser"},{"name":"project_memberships","kind":"object","type":"ProjectMember","relationName":"ProjectMemberToUser"},{"name":"invitations_sent","kind":"object","type":"ProjectInvitation","relationName":"ProjectInvitationToUser"},{"name":"assigned_tasks","kind":"object","type":"Task","relationName":"TaskAssignee"},{"name":"created_tasks","kind":"object","type":"Task","relationName":"TaskCreator"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToUser"},{"name":"attachments","kind":"object","type":"Attachment","relationName":"AttachmentToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"subscriptions","kind":"object","type":"Subscription","relationName":"SubscriptionToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"created_at","kind":"scalar","type":"DateTime"},{"name":"updated_at","kind":"scalar","type":"DateTime"}],"dbName":"users","schema":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","owned_projects","project","user","project_memberships","invited_by","invitations_sent","assigned_tasks","created_tasks","task","author","parent","replies","_count","comments","attachments","notifications","owner","subscriptions","payments","members","invitations","tasks","assignee","created_by","uploaded_by","Attachment.findUnique","Attachment.findUniqueOrThrow","Attachment.findFirst","Attachment.findFirstOrThrow","Attachment.findMany","data","Attachment.createOne","Attachment.createMany","Attachment.createManyAndReturn","Attachment.updateOne","Attachment.updateMany","Attachment.updateManyAndReturn","create","update","Attachment.upsertOne","Attachment.deleteOne","Attachment.deleteMany","having","_avg","_sum","_min","_max","Attachment.groupBy","Attachment.aggregate","AuditLog.findUnique","AuditLog.findUniqueOrThrow","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","AuditLog.groupBy","AuditLog.aggregate","Comment.findUnique","Comment.findUniqueOrThrow","Comment.findFirst","Comment.findFirstOrThrow","Comment.findMany","Comment.createOne","Comment.createMany","Comment.createManyAndReturn","Comment.updateOne","Comment.updateMany","Comment.updateManyAndReturn","Comment.upsertOne","Comment.deleteOne","Comment.deleteMany","Comment.groupBy","Comment.aggregate","ContactMessage.findUnique","ContactMessage.findUniqueOrThrow","ContactMessage.findFirst","ContactMessage.findFirstOrThrow","ContactMessage.findMany","ContactMessage.createOne","ContactMessage.createMany","ContactMessage.createManyAndReturn","ContactMessage.updateOne","ContactMessage.updateMany","ContactMessage.updateManyAndReturn","ContactMessage.upsertOne","ContactMessage.deleteOne","ContactMessage.deleteMany","ContactMessage.groupBy","ContactMessage.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","ProjectMember.findUnique","ProjectMember.findUniqueOrThrow","ProjectMember.findFirst","ProjectMember.findFirstOrThrow","ProjectMember.findMany","ProjectMember.createOne","ProjectMember.createMany","ProjectMember.createManyAndReturn","ProjectMember.updateOne","ProjectMember.updateMany","ProjectMember.updateManyAndReturn","ProjectMember.upsertOne","ProjectMember.deleteOne","ProjectMember.deleteMany","ProjectMember.groupBy","ProjectMember.aggregate","ProjectInvitation.findUnique","ProjectInvitation.findUniqueOrThrow","ProjectInvitation.findFirst","ProjectInvitation.findFirstOrThrow","ProjectInvitation.findMany","ProjectInvitation.createOne","ProjectInvitation.createMany","ProjectInvitation.createManyAndReturn","ProjectInvitation.updateOne","ProjectInvitation.updateMany","ProjectInvitation.updateManyAndReturn","ProjectInvitation.upsertOne","ProjectInvitation.deleteOne","ProjectInvitation.deleteMany","ProjectInvitation.groupBy","ProjectInvitation.aggregate","Project.findUnique","Project.findUniqueOrThrow","Project.findFirst","Project.findFirstOrThrow","Project.findMany","Project.createOne","Project.createMany","Project.createManyAndReturn","Project.updateOne","Project.updateMany","Project.updateManyAndReturn","Project.upsertOne","Project.deleteOne","Project.deleteMany","Project.groupBy","Project.aggregate","PlatformSetting.findUnique","PlatformSetting.findUniqueOrThrow","PlatformSetting.findFirst","PlatformSetting.findFirstOrThrow","PlatformSetting.findMany","PlatformSetting.createOne","PlatformSetting.createMany","PlatformSetting.createManyAndReturn","PlatformSetting.updateOne","PlatformSetting.updateMany","PlatformSetting.updateManyAndReturn","PlatformSetting.upsertOne","PlatformSetting.deleteOne","PlatformSetting.deleteMany","PlatformSetting.groupBy","PlatformSetting.aggregate","Subscription.findUnique","Subscription.findUniqueOrThrow","Subscription.findFirst","Subscription.findFirstOrThrow","Subscription.findMany","Subscription.createOne","Subscription.createMany","Subscription.createManyAndReturn","Subscription.updateOne","Subscription.updateMany","Subscription.updateManyAndReturn","Subscription.upsertOne","Subscription.deleteOne","Subscription.deleteMany","Subscription.groupBy","Subscription.aggregate","Task.findUnique","Task.findUniqueOrThrow","Task.findFirst","Task.findFirstOrThrow","Task.findMany","Task.createOne","Task.createMany","Task.createManyAndReturn","Task.updateOne","Task.updateMany","Task.updateManyAndReturn","Task.upsertOne","Task.deleteOne","Task.deleteMany","Task.groupBy","Task.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","AND","OR","NOT","id","name","email","password","google_id","avatar_url","avatar_public_id","Role","role","Providers","provider","UserStatus","user_status","is_active","is_deleted","is_verified","need_password_change","deleted_at","last_login_at","created_at","updated_at","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","every","some","none","title","description","TaskStatus","status","TaskPriority","priority","due_date","labels","position","project_id","assignee_id","created_by_id","has","hasEvery","hasSome","Plan","plan","SubscriptionStatus","current_period_end","cancel_at_period_end","owner_id","key","value","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","ProjectStatus","start_date","end_date","token","InvitationStatus","invited_by_id","expires_at","user_id","joined_at","amount","currency","PaymentStatus","PaymentGateway","payment_gateway","transaction_id","gateway_response","NotificationType","type","message","is_read","link","actor_id","actor_name","subject","ContactStatus","body","task_id","author_id","parent_id","actor_role","action","entity","entity_id","meta","file_name","url","public_id","mime_type","size","uploaded_by_id","project_id_user_id","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide","push"]'),
  graph: "kgdz0AEOCwAA5gMAIBsAAN8DACD0AQAA5AMAMPUBAAAbABD2AQAA5AMAMPcBAQAAAAGKAkAAjwMAIdECAQCIAwAh2QIBAIgDACHaAgEAiAMAIdsCAQCIAwAh3AIBAIkDACHdAgIA5QMAId4CAQCIAwAhAQAAAAEAIBATAADfAwAgFgAAkQMAIBcAAJIDACAYAACTAwAg9AEAAPMDADD1AQAAAwAQ9gEAAPMDADD3AQEAiAMAIfgBAQCIAwAhigJAAI8DACGLAkAAjwMAIZsCAQCJAwAhnQIAAPQDuAIirgIBAIgDACG4AkAAjwMAIbkCQACOAwAhBhMAAK8GACAWAADzBQAgFwAA9AUAIBgAAPUFACCbAgAA9QMAILkCAAD1AwAgEBMAAN8DACAWAACRAwAgFwAAkgMAIBgAAJMDACD0AQAA8wMAMPUBAAADABD2AQAA8wMAMPcBAQAAAAH4AQEAiAMAIYoCQACPAwAhiwJAAI8DACGbAgEAiQMAIZ0CAAD0A7gCIq4CAQCIAwAhuAJAAI8DACG5AkAAjgMAIQMAAAADACABAAAEADACAAAFACAKBAAA7QMAIAUAAN8DACD0AQAA8gMAMPUBAAAHABD2AQAA8gMAMPcBAQCIAwAhigJAAI8DACGjAgEAiAMAIb4CAQCIAwAhvwJAAI8DACECBAAAsgYAIAUAAK8GACALBAAA7QMAIAUAAN8DACD0AQAA8gMAMPUBAAAHABD2AQAA8gMAMPcBAQAAAAGKAkAAjwMAIaMCAQCIAwAhvgIBAIgDACG_AkAAjwMAId8CAADxAwAgAwAAAAcAIAEAAAgAMAIAAAkAIA4EAADtAwAgBwAA3wMAIPQBAADvAwAw9QEAAAsAEPYBAADvAwAw9wEBAIgDACH5AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA8AO8AiKjAgEAiAMAIboCAQCIAwAhvAIBAIgDACG9AkAAjwMAIQIEAACyBgAgBwAArwYAIA4EAADtAwAgBwAA3wMAIPQBAADvAwAw9QEAAAsAEPYBAADvAwAw9wEBAAAAAfkBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADwA7wCIqMCAQCIAwAhugIBAAAAAbwCAQCIAwAhvQJAAI8DACEDAAAACwAgAQAADAAwAgAADQAgFQQAAO0DACAQAACUAwAgEQAAlQMAIBkAAO4DACAaAADfAwAg9AEAAOkDADD1AQAADwAQ9gEAAOkDADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGaAgEAiAMAIZsCAQCJAwAhnQIAAOoDnQIinwIAAOsDnwIioAJAAI4DACGhAgAAnAMAIKICAgDsAwAhowIBAIgDACGkAgEAiQMAIaUCAQCIAwAhCAQAALIGACAQAAD2BQAgEQAA9wUAIBkAAK8GACAaAACvBgAgmwIAAPUDACCgAgAA9QMAIKQCAAD1AwAgFQQAAO0DACAQAACUAwAgEQAAlQMAIBkAAO4DACAaAADfAwAg9AEAAOkDADD1AQAADwAQ9gEAAOkDADD3AQEAAAABigJAAI8DACGLAkAAjwMAIZoCAQCIAwAhmwIBAIkDACGdAgAA6gOdAiKfAgAA6wOfAiKgAkAAjgMAIaECAACcAwAgogICAOwDACGjAgEAiAMAIaQCAQCJAwAhpQIBAIgDACEDAAAADwAgAQAAEAAwAgAAEQAgAwAAAA8AIAEAABAAMAIAABEAIA4LAADmAwAgDAAA3wMAIA0AAOgDACAOAACUAwAg9AEAAOcDADD1AQAAFAAQ9gEAAOcDADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACHQAgEAiAMAIdECAQCIAwAh0gIBAIgDACHTAgEAiQMAIQULAACwBgAgDAAArwYAIA0AALEGACAOAAD2BQAg0wIAAPUDACAOCwAA5gMAIAwAAN8DACANAADoAwAgDgAAlAMAIPQBAADnAwAw9QEAABQAEPYBAADnAwAw9wEBAAAAAYoCQACPAwAhiwJAAI8DACHQAgEAiAMAIdECAQCIAwAh0gIBAIgDACHTAgEAiQMAIQMAAAAUACABAAAVADACAAAWACABAAAAFAAgAwAAABQAIAEAABUAMAIAABYAIAEAAAAUACAOCwAA5gMAIBsAAN8DACD0AQAA5AMAMPUBAAAbABD2AQAA5AMAMPcBAQCIAwAhigJAAI8DACHRAgEAiAMAIdkCAQCIAwAh2gIBAIgDACHbAgEAiAMAIdwCAQCJAwAh3QICAOUDACHeAgEAiAMAIQQLAACwBgAgGwAArwYAINwCAAD1AwAg3QIAAPUDACADAAAAGwAgAQAAHAAwAgAAAQAgDgUAAN8DACD0AQAA4gMAMPUBAAAeABD2AQAA4gMAMPcBAQCIAwAhigJAAI8DACGaAgEAiAMAIb4CAQCIAwAhyAIAAOMDyAIiyQIBAIgDACHKAiAAjQMAIcsCAQCJAwAhzAIBAIkDACHNAgEAiQMAIQQFAACvBgAgywIAAPUDACDMAgAA9QMAIM0CAAD1AwAgDgUAAN8DACD0AQAA4gMAMPUBAAAeABD2AQAA4gMAMPcBAQAAAAGKAkAAjwMAIZoCAQCIAwAhvgIBAIgDACHIAgAA4wPIAiLJAgEAiAMAIcoCIACNAwAhywIBAIkDACHMAgEAiQMAIc0CAQCJAwAhAwAAAB4AIAEAAB8AMAIAACAAIAwTAADfAwAg9AEAAOADADD1AQAAIgAQ9gEAAOADADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA4QOsAiKqAgAA2wOqAiKsAkAAjgMAIa0CIACNAwAhrgIBAIgDACECEwAArwYAIKwCAAD1AwAgDBMAAN8DACD0AQAA4AMAMPUBAAAiABD2AQAA4AMAMPcBAQAAAAGKAkAAjwMAIYsCQACPAwAhnQIAAOEDrAIiqgIAANsDqgIirAJAAI4DACGtAiAAjQMAIa4CAQCIAwAhAwAAACIAIAEAACMAMAIAACQAIA8TAADfAwAg9AEAANoDADD1AQAAJgAQ9gEAANoDADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA3QPDAiKqAgAA2wOqAiKuAgEAiAMAIcACCADcAwAhwQIBAIgDACHEAgAA3gPEAiLFAgEAiQMAIcYCAADVAwAgAxMAAK8GACDFAgAA9QMAIMYCAAD1AwAgDxMAAN8DACD0AQAA2gMAMPUBAAAmABD2AQAA2gMAMPcBAQAAAAGKAkAAjwMAIYsCQACPAwAhnQIAAN0DwwIiqgIAANsDqgIirgIBAIgDACHAAggA3AMAIcECAQCIAwAhxAIAAN4DxAIixQIBAAAAAcYCAADVAwAgAwAAACYAIAEAACcAMAIAACgAIAEAAAADACABAAAABwAgAQAAAAsAIAEAAAAPACABAAAADwAgAQAAABQAIAEAAAAbACABAAAAHgAgAQAAACIAIAEAAAAmACADAAAABwAgAQAACAAwAgAACQAgAwAAAAsAIAEAAAwAMAIAAA0AIAMAAAAPACABAAAQADACAAARACABAAAABwAgAQAAAAsAIAEAAAAPACAfAwAAkAMAIAYAAJEDACAIAACSAwAgCQAAkwMAIAoAAJMDACAQAACUAwAgEQAAlQMAIBIAAJYDACAUAACXAwAgFQAAmAMAIPQBAACHAwAw9QEAADoAEPYBAACHAwAw9wEBAIgDACH4AQEAiAMAIfkBAQCIAwAh-gEBAIkDACH7AQEAiQMAIfwBAQCJAwAh_QEBAIkDACH_AQAAigP_ASKBAgAAiwOBAiKDAgAAjAODAiKEAiAAjQMAIYUCIACNAwAhhgIgAI0DACGHAiAAjQMAIYgCQACOAwAhiQJAAI4DACGKAkAAjwMAIYsCQACPAwAhAQAAADoAIAMAAAAUACABAAAVADACAAAWACADAAAAGwAgAQAAHAAwAgAAAQAgAQAAABQAIAEAAAAbACABAAAAAQAgAwAAABsAIAEAABwAMAIAAAEAIAMAAAAbACABAAAcADACAAABACADAAAAGwAgAQAAHAAwAgAAAQAgCwsAAMMEACAbAAD-BAAg9wEBAAAAAYoCQAAAAAHRAgEAAAAB2QIBAAAAAdoCAQAAAAHbAgEAAAAB3AIBAAAAAd0CAgAAAAHeAgEAAAABASEAAEQAIAn3AQEAAAABigJAAAAAAdECAQAAAAHZAgEAAAAB2gIBAAAAAdsCAQAAAAHcAgEAAAAB3QICAAAAAd4CAQAAAAEBIQAARgAwASEAAEYAMAsLAADBBAAgGwAA_AQAIPcBAQD5AwAhigJAAIAEACHRAgEA-QMAIdkCAQD5AwAh2gIBAPkDACHbAgEA-QMAIdwCAQD6AwAh3QICAL8EACHeAgEA-QMAIQIAAAABACAhAABJACAJ9wEBAPkDACGKAkAAgAQAIdECAQD5AwAh2QIBAPkDACHaAgEA-QMAIdsCAQD5AwAh3AIBAPoDACHdAgIAvwQAId4CAQD5AwAhAgAAABsAICEAAEsAIAIAAAAbACAhAABLACADAAAAAQAgKAAARAAgKQAASQAgAQAAAAEAIAEAAAAbACAHDwAAqgYAIC4AAKsGACAvAACuBgAgMAAArQYAIDEAAKwGACDcAgAA9QMAIN0CAAD1AwAgDPQBAADWAwAw9QEAAFIAEPYBAADWAwAw9wEBAO0CACGKAkAA9AIAIdECAQDtAgAh2QIBAO0CACHaAgEA7QIAIdsCAQDtAgAh3AIBAO4CACHdAgIA1wMAId4CAQDtAgAhAwAAABsAIAEAAFEAMC0AAFIAIAMAAAAbACABAAAcADACAAABACAM9AEAANMDADD1AQAAWAAQ9gEAANMDADD3AQEAAAABigJAAI8DACHMAgEAiQMAIc0CAQCJAwAh1AIAANQD_wEj1QIBAIgDACHWAgEAiAMAIdcCAQCJAwAh2AIAANUDACABAAAAVQAgAQAAAFUAIAz0AQAA0wMAMPUBAABYABD2AQAA0wMAMPcBAQCIAwAhigJAAI8DACHMAgEAiQMAIc0CAQCJAwAh1AIAANQD_wEj1QIBAIgDACHWAgEAiAMAIdcCAQCJAwAh2AIAANUDACAFzAIAAPUDACDNAgAA9QMAINQCAAD1AwAg1wIAAPUDACDYAgAA9QMAIAMAAABYACABAABZADACAABVACADAAAAWAAgAQAAWQAwAgAAVQAgAwAAAFgAIAEAAFkAMAIAAFUAIAn3AQEAAAABigJAAAAAAcwCAQAAAAHNAgEAAAAB1AIAAAD_AQPVAgEAAAAB1gIBAAAAAdcCAQAAAAHYAoAAAAABASEAAF0AIAn3AQEAAAABigJAAAAAAcwCAQAAAAHNAgEAAAAB1AIAAAD_AQPVAgEAAAAB1gIBAAAAAdcCAQAAAAHYAoAAAAABASEAAF8AMAEhAABfADAJ9wEBAPkDACGKAkAAgAQAIcwCAQD6AwAhzQIBAPoDACHUAgAAqQb_ASPVAgEA-QMAIdYCAQD5AwAh1wIBAPoDACHYAoAAAAABAgAAAFUAICEAAGIAIAn3AQEA-QMAIYoCQACABAAhzAIBAPoDACHNAgEA-gMAIdQCAACpBv8BI9UCAQD5AwAh1gIBAPkDACHXAgEA-gMAIdgCgAAAAAECAAAAWAAgIQAAZAAgAgAAAFgAICEAAGQAIAMAAABVACAoAABdACApAABiACABAAAAVQAgAQAAAFgAIAgPAACmBgAgMAAAqAYAIDEAAKcGACDMAgAA9QMAIM0CAAD1AwAg1AIAAPUDACDXAgAA9QMAINgCAAD1AwAgDPQBAADPAwAw9QEAAGsAEPYBAADPAwAw9wEBAO0CACGKAkAA9AIAIcwCAQDuAgAhzQIBAO4CACHUAgAA0AP_ASPVAgEA7QIAIdYCAQDtAgAh1wIBAO4CACHYAgAAvQMAIAMAAABYACABAABqADAtAABrACADAAAAWAAgAQAAWQAwAgAAVQAgAQAAABYAIAEAAAAWACADAAAAFAAgAQAAFQAwAgAAFgAgAwAAABQAIAEAABUAMAIAABYAIAMAAAAUACABAAAVADACAAAWACALCwAA3AQAIAwAAN0EACANAADgBAAgDgAA3gQAIPcBAQAAAAGKAkAAAAABiwJAAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAdMCAQAAAAEBIQAAcwAgB_cBAQAAAAGKAkAAAAABiwJAAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAdMCAQAAAAEBIQAAdQAwASEAAHUAMAEAAAAUACALCwAAzwQAIAwAANoEACANAADQBAAgDgAA0QQAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIdACAQD5AwAh0QIBAPkDACHSAgEA-QMAIdMCAQD6AwAhAgAAABYAICEAAHkAIAf3AQEA-QMAIYoCQACABAAhiwJAAIAEACHQAgEA-QMAIdECAQD5AwAh0gIBAPkDACHTAgEA-gMAIQIAAAAUACAhAAB7ACACAAAAFAAgIQAAewAgAQAAABQAIAMAAAAWACAoAABzACApAAB5ACABAAAAFgAgAQAAABQAIAQPAACjBgAgMAAApQYAIDEAAKQGACDTAgAA9QMAIAr0AQAAzgMAMPUBAACDAQAQ9gEAAM4DADD3AQEA7QIAIYoCQAD0AgAhiwJAAPQCACHQAgEA7QIAIdECAQDtAgAh0gIBAO0CACHTAgEA7gIAIQMAAAAUACABAACCAQAwLQAAgwEAIAMAAAAUACABAAAVADACAAAWACAL9AEAAMwDADD1AQAAiQEAEPYBAADMAwAw9wEBAAAAAfgBAQCIAwAh-QEBAIgDACGKAkAAjwMAIYsCQACPAwAhnQIAAM0D0AIiyQIBAIgDACHOAgEAiAMAIQEAAACGAQAgAQAAAIYBACAL9AEAAMwDADD1AQAAiQEAEPYBAADMAwAw9wEBAIgDACH4AQEAiAMAIfkBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADNA9ACIskCAQCIAwAhzgIBAIgDACEAAwAAAIkBACABAACKAQAwAgAAhgEAIAMAAACJAQAgAQAAigEAMAIAAIYBACADAAAAiQEAIAEAAIoBADACAACGAQAgCPcBAQAAAAH4AQEAAAAB-QEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAADQAgLJAgEAAAABzgIBAAAAAQEhAACOAQAgCPcBAQAAAAH4AQEAAAAB-QEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAADQAgLJAgEAAAABzgIBAAAAAQEhAACQAQAwASEAAJABADAI9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAhigJAAIAEACGLAkAAgAQAIZ0CAACiBtACIskCAQD5AwAhzgIBAPkDACECAAAAhgEAICEAAJMBACAI9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAhigJAAIAEACGLAkAAgAQAIZ0CAACiBtACIskCAQD5AwAhzgIBAPkDACECAAAAiQEAICEAAJUBACACAAAAiQEAICEAAJUBACADAAAAhgEAICgAAI4BACApAACTAQAgAQAAAIYBACABAAAAiQEAIAMPAACfBgAgMAAAoQYAIDEAAKAGACAL9AEAAMgDADD1AQAAnAEAEPYBAADIAwAw9wEBAO0CACH4AQEA7QIAIfkBAQDtAgAhigJAAPQCACGLAkAA9AIAIZ0CAADJA9ACIskCAQDtAgAhzgIBAO0CACEDAAAAiQEAIAEAAJsBADAtAACcAQAgAwAAAIkBACABAACKAQAwAgAAhgEAIAEAAAAgACABAAAAIAAgAwAAAB4AIAEAAB8AMAIAACAAIAMAAAAeACABAAAfADACAAAgACADAAAAHgAgAQAAHwAwAgAAIAAgCwUAAJ4GACD3AQEAAAABigJAAAAAAZoCAQAAAAG-AgEAAAAByAIAAADIAgLJAgEAAAABygIgAAAAAcsCAQAAAAHMAgEAAAABzQIBAAAAAQEhAACkAQAgCvcBAQAAAAGKAkAAAAABmgIBAAAAAb4CAQAAAAHIAgAAAMgCAskCAQAAAAHKAiAAAAABywIBAAAAAcwCAQAAAAHNAgEAAAABASEAAKYBADABIQAApgEAMAsFAACdBgAg9wEBAPkDACGKAkAAgAQAIZoCAQD5AwAhvgIBAPkDACHIAgAAsgTIAiLJAgEA-QMAIcoCIAD-AwAhywIBAPoDACHMAgEA-gMAIc0CAQD6AwAhAgAAACAAICEAAKkBACAK9wEBAPkDACGKAkAAgAQAIZoCAQD5AwAhvgIBAPkDACHIAgAAsgTIAiLJAgEA-QMAIcoCIAD-AwAhywIBAPoDACHMAgEA-gMAIc0CAQD6AwAhAgAAAB4AICEAAKsBACACAAAAHgAgIQAAqwEAIAMAAAAgACAoAACkAQAgKQAAqQEAIAEAAAAgACABAAAAHgAgBg8AAJoGACAwAACcBgAgMQAAmwYAIMsCAAD1AwAgzAIAAPUDACDNAgAA9QMAIA30AQAAxAMAMPUBAACyAQAQ9gEAAMQDADD3AQEA7QIAIYoCQAD0AgAhmgIBAO0CACG-AgEA7QIAIcgCAADFA8gCIskCAQDtAgAhygIgAPICACHLAgEA7gIAIcwCAQDuAgAhzQIBAO4CACEDAAAAHgAgAQAAsQEAMC0AALIBACADAAAAHgAgAQAAHwAwAgAAIAAgAQAAACgAIAEAAAAoACADAAAAJgAgAQAAJwAwAgAAKAAgAwAAACYAIAEAACcAMAIAACgAIAMAAAAmACABAAAnADACAAAoACAMEwAAmQYAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAwwICqgIAAACqAgKuAgEAAAABwAIIAAAAAcECAQAAAAHEAgAAAMQCAsUCAQAAAAHGAoAAAAABASEAALoBACAL9wEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAADDAgKqAgAAAKoCAq4CAQAAAAHAAggAAAABwQIBAAAAAcQCAAAAxAICxQIBAAAAAcYCgAAAAAEBIQAAvAEAMAEhAAC8AQAwDBMAAJgGACD3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAAlwTDAiKqAgAAlQSqAiKuAgEA-QMAIcACCACWBAAhwQIBAPkDACHEAgAAmATEAiLFAgEA-gMAIcYCgAAAAAECAAAAKAAgIQAAvwEAIAv3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAAlwTDAiKqAgAAlQSqAiKuAgEA-QMAIcACCACWBAAhwQIBAPkDACHEAgAAmATEAiLFAgEA-gMAIcYCgAAAAAECAAAAJgAgIQAAwQEAIAIAAAAmACAhAADBAQAgAwAAACgAICgAALoBACApAAC_AQAgAQAAACgAIAEAAAAmACAHDwAAkwYAIC4AAJQGACAvAACXBgAgMAAAlgYAIDEAAJUGACDFAgAA9QMAIMYCAAD1AwAgDvQBAAC5AwAw9QEAAMgBABD2AQAAuQMAMPcBAQDtAgAhigJAAPQCACGLAkAA9AIAIZ0CAAC7A8MCIqoCAAClA6oCIq4CAQDtAgAhwAIIALoDACHBAgEA7QIAIcQCAAC8A8QCIsUCAQDuAgAhxgIAAL0DACADAAAAJgAgAQAAxwEAMC0AAMgBACADAAAAJgAgAQAAJwAwAgAAKAAgAQAAAAkAIAEAAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACAHBAAAtQUAIAUAAOMFACD3AQEAAAABigJAAAAAAaMCAQAAAAG-AgEAAAABvwJAAAAAAQEhAADQAQAgBfcBAQAAAAGKAkAAAAABowIBAAAAAb4CAQAAAAG_AkAAAAABASEAANIBADABIQAA0gEAMAcEAACzBQAgBQAA4QUAIPcBAQD5AwAhigJAAIAEACGjAgEA-QMAIb4CAQD5AwAhvwJAAIAEACECAAAACQAgIQAA1QEAIAX3AQEA-QMAIYoCQACABAAhowIBAPkDACG-AgEA-QMAIb8CQACABAAhAgAAAAcAICEAANcBACACAAAABwAgIQAA1wEAIAMAAAAJACAoAADQAQAgKQAA1QEAIAEAAAAJACABAAAABwAgAw8AAJAGACAwAACSBgAgMQAAkQYAIAj0AQAAuAMAMPUBAADeAQAQ9gEAALgDADD3AQEA7QIAIYoCQAD0AgAhowIBAO0CACG-AgEA7QIAIb8CQAD0AgAhAwAAAAcAIAEAAN0BADAtAADeAQAgAwAAAAcAIAEAAAgAMAIAAAkAIAEAAAANACABAAAADQAgAwAAAAsAIAEAAAwAMAIAAA0AIAMAAAALACABAAAMADACAAANACADAAAACwAgAQAADAAwAgAADQAgCwQAAKcFACAHAADYBQAg9wEBAAAAAfkBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAvAICowIBAAAAAboCAQAAAAG8AgEAAAABvQJAAAAAAQEhAADmAQAgCfcBAQAAAAH5AQEAAAABigJAAAAAAYsCQAAAAAGdAgAAALwCAqMCAQAAAAG6AgEAAAABvAIBAAAAAb0CQAAAAAEBIQAA6AEAMAEhAADoAQAwCwQAAKUFACAHAADWBQAg9wEBAPkDACH5AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAAowW8AiKjAgEA-QMAIboCAQD5AwAhvAIBAPkDACG9AkAAgAQAIQIAAAANACAhAADrAQAgCfcBAQD5AwAh-QEBAPkDACGKAkAAgAQAIYsCQACABAAhnQIAAKMFvAIiowIBAPkDACG6AgEA-QMAIbwCAQD5AwAhvQJAAIAEACECAAAACwAgIQAA7QEAIAIAAAALACAhAADtAQAgAwAAAA0AICgAAOYBACApAADrAQAgAQAAAA0AIAEAAAALACADDwAAjQYAIDAAAI8GACAxAACOBgAgDPQBAAC0AwAw9QEAAPQBABD2AQAAtAMAMPcBAQDtAgAh-QEBAO0CACGKAkAA9AIAIYsCQAD0AgAhnQIAALUDvAIiowIBAO0CACG6AgEA7QIAIbwCAQDtAgAhvQJAAPQCACEDAAAACwAgAQAA8wEAMC0AAPQBACADAAAACwAgAQAADAAwAgAADQAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACANEwAAjAYAIBYAAOUFACAXAADmBQAgGAAA5wUAIPcBAQAAAAH4AQEAAAABigJAAAAAAYsCQAAAAAGbAgEAAAABnQIAAAC4AgKuAgEAAAABuAJAAAAAAbkCQAAAAAEBIQAA_AEAIAn3AQEAAAAB-AEBAAAAAYoCQAAAAAGLAkAAAAABmwIBAAAAAZ0CAAAAuAICrgIBAAAAAbgCQAAAAAG5AkAAAAABASEAAP4BADABIQAA_gEAMA0TAACLBgAgFgAAwgUAIBcAAMMFACAYAADEBQAg9wEBAPkDACH4AQEA-QMAIYoCQACABAAhiwJAAIAEACGbAgEA-gMAIZ0CAADABbgCIq4CAQD5AwAhuAJAAIAEACG5AkAA_wMAIQIAAAAFACAhAACBAgAgCfcBAQD5AwAh-AEBAPkDACGKAkAAgAQAIYsCQACABAAhmwIBAPoDACGdAgAAwAW4AiKuAgEA-QMAIbgCQACABAAhuQJAAP8DACECAAAAAwAgIQAAgwIAIAIAAAADACAhAACDAgAgAwAAAAUAICgAAPwBACApAACBAgAgAQAAAAUAIAEAAAADACAFDwAAiAYAIDAAAIoGACAxAACJBgAgmwIAAPUDACC5AgAA9QMAIAz0AQAAsAMAMPUBAACKAgAQ9gEAALADADD3AQEA7QIAIfgBAQDtAgAhigJAAPQCACGLAkAA9AIAIZsCAQDuAgAhnQIAALEDuAIirgIBAO0CACG4AkAA9AIAIbkCQADzAgAhAwAAAAMAIAEAAIkCADAtAACKAgAgAwAAAAMAIAEAAAQAMAIAAAUAIAf0AQAArgMAMPUBAACQAgAQ9gEAAK4DADD3AQEAAAABiwJAAI8DACGvAgEAAAABsAIAAK8DACABAAAAjQIAIAEAAACNAgAgB_QBAACuAwAw9QEAAJACABD2AQAArgMAMPcBAQCIAwAhiwJAAI8DACGvAgEAiAMAIbACAACvAwAgAAMAAACQAgAgAQAAkQIAMAIAAI0CACADAAAAkAIAIAEAAJECADACAACNAgAgAwAAAJACACABAACRAgAwAgAAjQIAIAT3AQEAAAABiwJAAAAAAa8CAQAAAAGwAoAAAAABASEAAJUCACAE9wEBAAAAAYsCQAAAAAGvAgEAAAABsAKAAAAAAQEhAACXAgAwASEAAJcCADAE9wEBAPkDACGLAkAAgAQAIa8CAQD5AwAhsAKAAAAAAQIAAACNAgAgIQAAmgIAIAT3AQEA-QMAIYsCQACABAAhrwIBAPkDACGwAoAAAAABAgAAAJACACAhAACcAgAgAgAAAJACACAhAACcAgAgAwAAAI0CACAoAACVAgAgKQAAmgIAIAEAAACNAgAgAQAAAJACACADDwAAhQYAIDAAAIcGACAxAACGBgAgB_QBAACrAwAw9QEAAKMCABD2AQAAqwMAMPcBAQDtAgAhiwJAAPQCACGvAgEA7QIAIbACAACsAwAgAwAAAJACACABAACiAgAwLQAAowIAIAMAAACQAgAgAQAAkQIAMAIAAI0CACABAAAAJAAgAQAAACQAIAMAAAAiACABAAAjADACAAAkACADAAAAIgAgAQAAIwAwAgAAJAAgAwAAACIAIAEAACMAMAIAACQAIAkTAACEBgAg9wEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAACsAgKqAgAAAKoCAqwCQAAAAAGtAiAAAAABrgIBAAAAAQEhAACrAgAgCPcBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAArAICqgIAAACqAgKsAkAAAAABrQIgAAAAAa4CAQAAAAEBIQAArQIAMAEhAACtAgAwCRMAAIMGACD3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAApQSsAiKqAgAAlQSqAiKsAkAA_wMAIa0CIAD-AwAhrgIBAPkDACECAAAAJAAgIQAAsAIAIAj3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAApQSsAiKqAgAAlQSqAiKsAkAA_wMAIa0CIAD-AwAhrgIBAPkDACECAAAAIgAgIQAAsgIAIAIAAAAiACAhAACyAgAgAwAAACQAICgAAKsCACApAACwAgAgAQAAACQAIAEAAAAiACAEDwAAgAYAIDAAAIIGACAxAACBBgAgrAIAAPUDACAL9AEAAKQDADD1AQAAuQIAEPYBAACkAwAw9wEBAO0CACGKAkAA9AIAIYsCQAD0AgAhnQIAAKYDrAIiqgIAAKUDqgIirAJAAPMCACGtAiAA8gIAIa4CAQDtAgAhAwAAACIAIAEAALgCADAtAAC5AgAgAwAAACIAIAEAACMAMAIAACQAIAEAAAARACABAAAAEQAgAwAAAA8AIAEAABAAMAIAABEAIAMAAAAPACABAAAQADACAAARACADAAAADwAgAQAAEAAwAgAAEQAgEgQAAIoFACAQAACMBQAgEQAAjQUAIBkAAIsFACAaAACYBQAg9wEBAAAAAYoCQAAAAAGLAkAAAAABmgIBAAAAAZsCAQAAAAGdAgAAAJ0CAp8CAAAAnwICoAJAAAAAAaECAACJBQAgogICAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAQEhAADBAgAgDfcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAEBIQAAwwIAMAEhAADDAgAwAQAAADoAIBIEAADwBAAgEAAA8gQAIBEAAPMEACAZAADxBAAgGgAAlgUAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIZoCAQD5AwAhmwIBAPoDACGdAgAA6wSdAiKfAgAA7ASfAiKgAkAA_wMAIaECAADtBAAgogICAO4EACGjAgEA-QMAIaQCAQD6AwAhpQIBAPkDACECAAAAEQAgIQAAxwIAIA33AQEA-QMAIYoCQACABAAhiwJAAIAEACGaAgEA-QMAIZsCAQD6AwAhnQIAAOsEnQIinwIAAOwEnwIioAJAAP8DACGhAgAA7QQAIKICAgDuBAAhowIBAPkDACGkAgEA-gMAIaUCAQD5AwAhAgAAAA8AICEAAMkCACACAAAADwAgIQAAyQIAIAEAAAA6ACADAAAAEQAgKAAAwQIAICkAAMcCACABAAAAEQAgAQAAAA8AIAgPAAD7BQAgLgAA_AUAIC8AAP8FACAwAAD-BQAgMQAA_QUAIJsCAAD1AwAgoAIAAPUDACCkAgAA9QMAIBD0AQAAmQMAMPUBAADRAgAQ9gEAAJkDADD3AQEA7QIAIYoCQAD0AgAhiwJAAPQCACGaAgEA7QIAIZsCAQDuAgAhnQIAAJoDnQIinwIAAJsDnwIioAJAAPMCACGhAgAAnAMAIKICAgCdAwAhowIBAO0CACGkAgEA7gIAIaUCAQDtAgAhAwAAAA8AIAEAANACADAtAADRAgAgAwAAAA8AIAEAABAAMAIAABEAIB8DAACQAwAgBgAAkQMAIAgAAJIDACAJAACTAwAgCgAAkwMAIBAAAJQDACARAACVAwAgEgAAlgMAIBQAAJcDACAVAACYAwAg9AEAAIcDADD1AQAAOgAQ9gEAAIcDADD3AQEAAAAB-AEBAIgDACH5AQEAAAAB-gEBAIkDACH7AQEAAAAB_AEBAIkDACH9AQEAiQMAIf8BAACKA_8BIoECAACLA4ECIoMCAACMA4MCIoQCIACNAwAhhQIgAI0DACGGAiAAjQMAIYcCIACNAwAhiAJAAI4DACGJAkAAjgMAIYoCQACPAwAhiwJAAI8DACEBAAAA1AIAIAEAAADUAgAgEAMAAPIFACAGAADzBQAgCAAA9AUAIAkAAPUFACAKAAD1BQAgEAAA9gUAIBEAAPcFACASAAD4BQAgFAAA-QUAIBUAAPoFACD6AQAA9QMAIPsBAAD1AwAg_AEAAPUDACD9AQAA9QMAIIgCAAD1AwAgiQIAAPUDACADAAAAOgAgAQAA1wIAMAIAANQCACADAAAAOgAgAQAA1wIAMAIAANQCACADAAAAOgAgAQAA1wIAMAIAANQCACAcAwAA6AUAIAYAAOkFACAIAADqBQAgCQAA6wUAIAoAAOwFACAQAADtBQAgEQAA7gUAIBIAAO8FACAUAADwBQAgFQAA8QUAIPcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH_AQAAAP8BAoECAAAAgQICgwIAAACDAgKEAiAAAAABhQIgAAAAAYYCIAAAAAGHAiAAAAABiAJAAAAAAYkCQAAAAAGKAkAAAAABiwJAAAAAAQEhAADbAgAgEvcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH_AQAAAP8BAoECAAAAgQICgwIAAACDAgKEAiAAAAABhQIgAAAAAYYCIAAAAAGHAiAAAAABiAJAAAAAAYkCQAAAAAGKAkAAAAABiwJAAAAAAQEhAADdAgAwASEAAN0CADAcAwAAgQQAIAYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIQIAAADUAgAgIQAA4AIAIBL3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACECAAAAOgAgIQAA4gIAIAIAAAA6ACAhAADiAgAgAwAAANQCACAoAADbAgAgKQAA4AIAIAEAAADUAgAgAQAAADoAIAkPAAD2AwAgMAAA-AMAIDEAAPcDACD6AQAA9QMAIPsBAAD1AwAg_AEAAPUDACD9AQAA9QMAIIgCAAD1AwAgiQIAAPUDACAV9AEAAOwCADD1AQAA6QIAEPYBAADsAgAw9wEBAO0CACH4AQEA7QIAIfkBAQDtAgAh-gEBAO4CACH7AQEA7gIAIfwBAQDuAgAh_QEBAO4CACH_AQAA7wL_ASKBAgAA8AKBAiKDAgAA8QKDAiKEAiAA8gIAIYUCIADyAgAhhgIgAPICACGHAiAA8gIAIYgCQADzAgAhiQJAAPMCACGKAkAA9AIAIYsCQAD0AgAhAwAAADoAIAEAAOgCADAtAADpAgAgAwAAADoAIAEAANcCADACAADUAgAgFfQBAADsAgAw9QEAAOkCABD2AQAA7AIAMPcBAQDtAgAh-AEBAO0CACH5AQEA7QIAIfoBAQDuAgAh-wEBAO4CACH8AQEA7gIAIf0BAQDuAgAh_wEAAO8C_wEigQIAAPACgQIigwIAAPECgwIihAIgAPICACGFAiAA8gIAIYYCIADyAgAhhwIgAPICACGIAkAA8wIAIYkCQADzAgAhigJAAPQCACGLAkAA9AIAIQ4PAAD2AgAgMAAAhgMAIDEAAIYDACCMAgEAAAABjQIBAAAABI4CAQAAAASPAgEAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwIBAIUDACGUAgEAAAABlQIBAAAAAZYCAQAAAAEODwAA-QIAIDAAAIQDACAxAACEAwAgjAIBAAAAAY0CAQAAAAWOAgEAAAAFjwIBAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCAQCDAwAhlAIBAAAAAZUCAQAAAAGWAgEAAAABBw8AAPYCACAwAACCAwAgMQAAggMAIIwCAAAA_wECjQIAAAD_AQiOAgAAAP8BCJMCAACBA_8BIgcPAAD2AgAgMAAAgAMAIDEAAIADACCMAgAAAIECAo0CAAAAgQIIjgIAAACBAgiTAgAA_wKBAiIHDwAA9gIAIDAAAP4CACAxAAD-AgAgjAIAAACDAgKNAgAAAIMCCI4CAAAAgwIIkwIAAP0CgwIiBQ8AAPYCACAwAAD8AgAgMQAA_AIAIIwCIAAAAAGTAiAA-wIAIQsPAAD5AgAgMAAA-gIAIDEAAPoCACCMAkAAAAABjQJAAAAABY4CQAAAAAWPAkAAAAABkAJAAAAAAZECQAAAAAGSAkAAAAABkwJAAPgCACELDwAA9gIAIDAAAPcCACAxAAD3AgAgjAJAAAAAAY0CQAAAAASOAkAAAAAEjwJAAAAAAZACQAAAAAGRAkAAAAABkgJAAAAAAZMCQAD1AgAhCw8AAPYCACAwAAD3AgAgMQAA9wIAIIwCQAAAAAGNAkAAAAAEjgJAAAAABI8CQAAAAAGQAkAAAAABkQJAAAAAAZICQAAAAAGTAkAA9QIAIQiMAgIAAAABjQICAAAABI4CAgAAAASPAgIAAAABkAICAAAAAZECAgAAAAGSAgIAAAABkwICAPYCACEIjAJAAAAAAY0CQAAAAASOAkAAAAAEjwJAAAAAAZACQAAAAAGRAkAAAAABkgJAAAAAAZMCQAD3AgAhCw8AAPkCACAwAAD6AgAgMQAA-gIAIIwCQAAAAAGNAkAAAAAFjgJAAAAABY8CQAAAAAGQAkAAAAABkQJAAAAAAZICQAAAAAGTAkAA-AIAIQiMAgIAAAABjQICAAAABY4CAgAAAAWPAgIAAAABkAICAAAAAZECAgAAAAGSAgIAAAABkwICAPkCACEIjAJAAAAAAY0CQAAAAAWOAkAAAAAFjwJAAAAAAZACQAAAAAGRAkAAAAABkgJAAAAAAZMCQAD6AgAhBQ8AAPYCACAwAAD8AgAgMQAA_AIAIIwCIAAAAAGTAiAA-wIAIQKMAiAAAAABkwIgAPwCACEHDwAA9gIAIDAAAP4CACAxAAD-AgAgjAIAAACDAgKNAgAAAIMCCI4CAAAAgwIIkwIAAP0CgwIiBIwCAAAAgwICjQIAAACDAgiOAgAAAIMCCJMCAAD-AoMCIgcPAAD2AgAgMAAAgAMAIDEAAIADACCMAgAAAIECAo0CAAAAgQIIjgIAAACBAgiTAgAA_wKBAiIEjAIAAACBAgKNAgAAAIECCI4CAAAAgQIIkwIAAIADgQIiBw8AAPYCACAwAACCAwAgMQAAggMAIIwCAAAA_wECjQIAAAD_AQiOAgAAAP8BCJMCAACBA_8BIgSMAgAAAP8BAo0CAAAA_wEIjgIAAAD_AQiTAgAAggP_ASIODwAA-QIAIDAAAIQDACAxAACEAwAgjAIBAAAAAY0CAQAAAAWOAgEAAAAFjwIBAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCAQCDAwAhlAIBAAAAAZUCAQAAAAGWAgEAAAABC4wCAQAAAAGNAgEAAAAFjgIBAAAABY8CAQAAAAGQAgEAAAABkQIBAAAAAZICAQAAAAGTAgEAhAMAIZQCAQAAAAGVAgEAAAABlgIBAAAAAQ4PAAD2AgAgMAAAhgMAIDEAAIYDACCMAgEAAAABjQIBAAAABI4CAQAAAASPAgEAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwIBAIUDACGUAgEAAAABlQIBAAAAAZYCAQAAAAELjAIBAAAAAY0CAQAAAASOAgEAAAAEjwIBAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCAQCGAwAhlAIBAAAAAZUCAQAAAAGWAgEAAAABHwMAAJADACAGAACRAwAgCAAAkgMAIAkAAJMDACAKAACTAwAgEAAAlAMAIBEAAJUDACASAACWAwAgFAAAlwMAIBUAAJgDACD0AQAAhwMAMPUBAAA6ABD2AQAAhwMAMPcBAQCIAwAh-AEBAIgDACH5AQEAiAMAIfoBAQCJAwAh-wEBAIkDACH8AQEAiQMAIf0BAQCJAwAh_wEAAIoD_wEigQIAAIsDgQIigwIAAIwDgwIihAIgAI0DACGFAiAAjQMAIYYCIACNAwAhhwIgAI0DACGIAkAAjgMAIYkCQACOAwAhigJAAI8DACGLAkAAjwMAIQuMAgEAAAABjQIBAAAABI4CAQAAAASPAgEAAAABkAIBAAAAAZECAQAAAAGSAgEAAAABkwIBAIYDACGUAgEAAAABlQIBAAAAAZYCAQAAAAELjAIBAAAAAY0CAQAAAAWOAgEAAAAFjwIBAAAAAZACAQAAAAGRAgEAAAABkgIBAAAAAZMCAQCEAwAhlAIBAAAAAZUCAQAAAAGWAgEAAAABBIwCAAAA_wECjQIAAAD_AQiOAgAAAP8BCJMCAACCA_8BIgSMAgAAAIECAo0CAAAAgQIIjgIAAACBAgiTAgAAgAOBAiIEjAIAAACDAgKNAgAAAIMCCI4CAAAAgwIIkwIAAP4CgwIiAowCIAAAAAGTAiAA_AIAIQiMAkAAAAABjQJAAAAABY4CQAAAAAWPAkAAAAABkAJAAAAAAZECQAAAAAGSAkAAAAABkwJAAPoCACEIjAJAAAAAAY0CQAAAAASOAkAAAAAEjwJAAAAAAZACQAAAAAGRAkAAAAABkgJAAAAAAZMCQAD3AgAhA5cCAAADACCYAgAAAwAgmQIAAAMAIAOXAgAABwAgmAIAAAcAIJkCAAAHACADlwIAAAsAIJgCAAALACCZAgAACwAgA5cCAAAPACCYAgAADwAgmQIAAA8AIAOXAgAAFAAgmAIAABQAIJkCAAAUACADlwIAABsAIJgCAAAbACCZAgAAGwAgA5cCAAAeACCYAgAAHgAgmQIAAB4AIAOXAgAAIgAgmAIAACIAIJkCAAAiACADlwIAACYAIJgCAAAmACCZAgAAJgAgEPQBAACZAwAw9QEAANECABD2AQAAmQMAMPcBAQDtAgAhigJAAPQCACGLAkAA9AIAIZoCAQDtAgAhmwIBAO4CACGdAgAAmgOdAiKfAgAAmwOfAiKgAkAA8wIAIaECAACcAwAgogICAJ0DACGjAgEA7QIAIaQCAQDuAgAhpQIBAO0CACEHDwAA9gIAIDAAAKMDACAxAACjAwAgjAIAAACdAgKNAgAAAJ0CCI4CAAAAnQIIkwIAAKIDnQIiBw8AAPYCACAwAAChAwAgMQAAoQMAIIwCAAAAnwICjQIAAACfAgiOAgAAAJ8CCJMCAACgA58CIgSMAgEAAAAFpgIBAAAAAacCAQAAAASoAgEAAAAEDQ8AAPYCACAuAACfAwAgLwAA9gIAIDAAAPYCACAxAAD2AgAgjAICAAAAAY0CAgAAAASOAgIAAAAEjwICAAAAAZACAgAAAAGRAgIAAAABkgICAAAAAZMCAgCeAwAhDQ8AAPYCACAuAACfAwAgLwAA9gIAIDAAAPYCACAxAAD2AgAgjAICAAAAAY0CAgAAAASOAgIAAAAEjwICAAAAAZACAgAAAAGRAgIAAAABkgICAAAAAZMCAgCeAwAhCIwCCAAAAAGNAggAAAAEjgIIAAAABI8CCAAAAAGQAggAAAABkQIIAAAAAZICCAAAAAGTAggAnwMAIQcPAAD2AgAgMAAAoQMAIDEAAKEDACCMAgAAAJ8CAo0CAAAAnwIIjgIAAACfAgiTAgAAoAOfAiIEjAIAAACfAgKNAgAAAJ8CCI4CAAAAnwIIkwIAAKEDnwIiBw8AAPYCACAwAACjAwAgMQAAowMAIIwCAAAAnQICjQIAAACdAgiOAgAAAJ0CCJMCAACiA50CIgSMAgAAAJ0CAo0CAAAAnQIIjgIAAACdAgiTAgAAowOdAiIL9AEAAKQDADD1AQAAuQIAEPYBAACkAwAw9wEBAO0CACGKAkAA9AIAIYsCQAD0AgAhnQIAAKYDrAIiqgIAAKUDqgIirAJAAPMCACGtAiAA8gIAIa4CAQDtAgAhBw8AAPYCACAwAACqAwAgMQAAqgMAIIwCAAAAqgICjQIAAACqAgiOAgAAAKoCCJMCAACpA6oCIgcPAAD2AgAgMAAAqAMAIDEAAKgDACCMAgAAAKwCAo0CAAAArAIIjgIAAACsAgiTAgAApwOsAiIHDwAA9gIAIDAAAKgDACAxAACoAwAgjAIAAACsAgKNAgAAAKwCCI4CAAAArAIIkwIAAKcDrAIiBIwCAAAArAICjQIAAACsAgiOAgAAAKwCCJMCAACoA6wCIgcPAAD2AgAgMAAAqgMAIDEAAKoDACCMAgAAAKoCAo0CAAAAqgIIjgIAAACqAgiTAgAAqQOqAiIEjAIAAACqAgKNAgAAAKoCCI4CAAAAqgIIkwIAAKoDqgIiB_QBAACrAwAw9QEAAKMCABD2AQAAqwMAMPcBAQDtAgAhiwJAAPQCACGvAgEA7QIAIbACAACsAwAgDw8AAPYCACAwAACtAwAgMQAArQMAIIwCgAAAAAGPAoAAAAABkAKAAAAAAZECgAAAAAGSAoAAAAABkwKAAAAAAbECAQAAAAGyAgEAAAABswIBAAAAAbQCgAAAAAG1AoAAAAABtgKAAAAAAQyMAoAAAAABjwKAAAAAAZACgAAAAAGRAoAAAAABkgKAAAAAAZMCgAAAAAGxAgEAAAABsgIBAAAAAbMCAQAAAAG0AoAAAAABtQKAAAAAAbYCgAAAAAEH9AEAAK4DADD1AQAAkAIAEPYBAACuAwAw9wEBAIgDACGLAkAAjwMAIa8CAQCIAwAhsAIAAK8DACAMjAKAAAAAAY8CgAAAAAGQAoAAAAABkQKAAAAAAZICgAAAAAGTAoAAAAABsQIBAAAAAbICAQAAAAGzAgEAAAABtAKAAAAAAbUCgAAAAAG2AoAAAAABDPQBAACwAwAw9QEAAIoCABD2AQAAsAMAMPcBAQDtAgAh-AEBAO0CACGKAkAA9AIAIYsCQAD0AgAhmwIBAO4CACGdAgAAsQO4AiKuAgEA7QIAIbgCQAD0AgAhuQJAAPMCACEHDwAA9gIAIDAAALMDACAxAACzAwAgjAIAAAC4AgKNAgAAALgCCI4CAAAAuAIIkwIAALIDuAIiBw8AAPYCACAwAACzAwAgMQAAswMAIIwCAAAAuAICjQIAAAC4AgiOAgAAALgCCJMCAACyA7gCIgSMAgAAALgCAo0CAAAAuAIIjgIAAAC4AgiTAgAAswO4AiIM9AEAALQDADD1AQAA9AEAEPYBAAC0AwAw9wEBAO0CACH5AQEA7QIAIYoCQAD0AgAhiwJAAPQCACGdAgAAtQO8AiKjAgEA7QIAIboCAQDtAgAhvAIBAO0CACG9AkAA9AIAIQcPAAD2AgAgMAAAtwMAIDEAALcDACCMAgAAALwCAo0CAAAAvAIIjgIAAAC8AgiTAgAAtgO8AiIHDwAA9gIAIDAAALcDACAxAAC3AwAgjAIAAAC8AgKNAgAAALwCCI4CAAAAvAIIkwIAALYDvAIiBIwCAAAAvAICjQIAAAC8AgiOAgAAALwCCJMCAAC3A7wCIgj0AQAAuAMAMPUBAADeAQAQ9gEAALgDADD3AQEA7QIAIYoCQAD0AgAhowIBAO0CACG-AgEA7QIAIb8CQAD0AgAhDvQBAAC5AwAw9QEAAMgBABD2AQAAuQMAMPcBAQDtAgAhigJAAPQCACGLAkAA9AIAIZ0CAAC7A8MCIqoCAAClA6oCIq4CAQDtAgAhwAIIALoDACHBAgEA7QIAIcQCAAC8A8QCIsUCAQDuAgAhxgIAAL0DACANDwAA9gIAIC4AAJ8DACAvAACfAwAgMAAAnwMAIDEAAJ8DACCMAggAAAABjQIIAAAABI4CCAAAAASPAggAAAABkAIIAAAAAZECCAAAAAGSAggAAAABkwIIAMMDACEHDwAA9gIAIDAAAMIDACAxAADCAwAgjAIAAADDAgKNAgAAAMMCCI4CAAAAwwIIkwIAAMEDwwIiBw8AAPYCACAwAADAAwAgMQAAwAMAIIwCAAAAxAICjQIAAADEAgiOAgAAAMQCCJMCAAC_A8QCIg8PAAD5AgAgMAAAvgMAIDEAAL4DACCMAoAAAAABjwKAAAAAAZACgAAAAAGRAoAAAAABkgKAAAAAAZMCgAAAAAGxAgEAAAABsgIBAAAAAbMCAQAAAAG0AoAAAAABtQKAAAAAAbYCgAAAAAEMjAKAAAAAAY8CgAAAAAGQAoAAAAABkQKAAAAAAZICgAAAAAGTAoAAAAABsQIBAAAAAbICAQAAAAGzAgEAAAABtAKAAAAAAbUCgAAAAAG2AoAAAAABBw8AAPYCACAwAADAAwAgMQAAwAMAIIwCAAAAxAICjQIAAADEAgiOAgAAAMQCCJMCAAC_A8QCIgSMAgAAAMQCAo0CAAAAxAIIjgIAAADEAgiTAgAAwAPEAiIHDwAA9gIAIDAAAMIDACAxAADCAwAgjAIAAADDAgKNAgAAAMMCCI4CAAAAwwIIkwIAAMEDwwIiBIwCAAAAwwICjQIAAADDAgiOAgAAAMMCCJMCAADCA8MCIg0PAAD2AgAgLgAAnwMAIC8AAJ8DACAwAACfAwAgMQAAnwMAIIwCCAAAAAGNAggAAAAEjgIIAAAABI8CCAAAAAGQAggAAAABkQIIAAAAAZICCAAAAAGTAggAwwMAIQ30AQAAxAMAMPUBAACyAQAQ9gEAAMQDADD3AQEA7QIAIYoCQAD0AgAhmgIBAO0CACG-AgEA7QIAIcgCAADFA8gCIskCAQDtAgAhygIgAPICACHLAgEA7gIAIcwCAQDuAgAhzQIBAO4CACEHDwAA9gIAIDAAAMcDACAxAADHAwAgjAIAAADIAgKNAgAAAMgCCI4CAAAAyAIIkwIAAMYDyAIiBw8AAPYCACAwAADHAwAgMQAAxwMAIIwCAAAAyAICjQIAAADIAgiOAgAAAMgCCJMCAADGA8gCIgSMAgAAAMgCAo0CAAAAyAIIjgIAAADIAgiTAgAAxwPIAiIL9AEAAMgDADD1AQAAnAEAEPYBAADIAwAw9wEBAO0CACH4AQEA7QIAIfkBAQDtAgAhigJAAPQCACGLAkAA9AIAIZ0CAADJA9ACIskCAQDtAgAhzgIBAO0CACEHDwAA9gIAIDAAAMsDACAxAADLAwAgjAIAAADQAgKNAgAAANACCI4CAAAA0AIIkwIAAMoD0AIiBw8AAPYCACAwAADLAwAgMQAAywMAIIwCAAAA0AICjQIAAADQAgiOAgAAANACCJMCAADKA9ACIgSMAgAAANACAo0CAAAA0AIIjgIAAADQAgiTAgAAywPQAiIL9AEAAMwDADD1AQAAiQEAEPYBAADMAwAw9wEBAIgDACH4AQEAiAMAIfkBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADNA9ACIskCAQCIAwAhzgIBAIgDACEEjAIAAADQAgKNAgAAANACCI4CAAAA0AIIkwIAAMsD0AIiCvQBAADOAwAw9QEAAIMBABD2AQAAzgMAMPcBAQDtAgAhigJAAPQCACGLAkAA9AIAIdACAQDtAgAh0QIBAO0CACHSAgEA7QIAIdMCAQDuAgAhDPQBAADPAwAw9QEAAGsAEPYBAADPAwAw9wEBAO0CACGKAkAA9AIAIcwCAQDuAgAhzQIBAO4CACHUAgAA0AP_ASPVAgEA7QIAIdYCAQDtAgAh1wIBAO4CACHYAgAAvQMAIAcPAAD5AgAgMAAA0gMAIDEAANIDACCMAgAAAP8BA40CAAAA_wEJjgIAAAD_AQmTAgAA0QP_ASMHDwAA-QIAIDAAANIDACAxAADSAwAgjAIAAAD_AQONAgAAAP8BCY4CAAAA_wEJkwIAANED_wEjBIwCAAAA_wEDjQIAAAD_AQmOAgAAAP8BCZMCAADSA_8BIwz0AQAA0wMAMPUBAABYABD2AQAA0wMAMPcBAQCIAwAhigJAAI8DACHMAgEAiQMAIc0CAQCJAwAh1AIAANQD_wEj1QIBAIgDACHWAgEAiAMAIdcCAQCJAwAh2AIAANUDACAEjAIAAAD_AQONAgAAAP8BCY4CAAAA_wEJkwIAANID_wEjDIwCgAAAAAGPAoAAAAABkAKAAAAAAZECgAAAAAGSAoAAAAABkwKAAAAAAbECAQAAAAGyAgEAAAABswIBAAAAAbQCgAAAAAG1AoAAAAABtgKAAAAAAQz0AQAA1gMAMPUBAABSABD2AQAA1gMAMPcBAQDtAgAhigJAAPQCACHRAgEA7QIAIdkCAQDtAgAh2gIBAO0CACHbAgEA7QIAIdwCAQDuAgAh3QICANcDACHeAgEA7QIAIQ0PAAD5AgAgLgAA2QMAIC8AAPkCACAwAAD5AgAgMQAA-QIAIIwCAgAAAAGNAgIAAAAFjgICAAAABY8CAgAAAAGQAgIAAAABkQICAAAAAZICAgAAAAGTAgIA2AMAIQ0PAAD5AgAgLgAA2QMAIC8AAPkCACAwAAD5AgAgMQAA-QIAIIwCAgAAAAGNAgIAAAAFjgICAAAABY8CAgAAAAGQAgIAAAABkQICAAAAAZICAgAAAAGTAgIA2AMAIQiMAggAAAABjQIIAAAABY4CCAAAAAWPAggAAAABkAIIAAAAAZECCAAAAAGSAggAAAABkwIIANkDACEPEwAA3wMAIPQBAADaAwAw9QEAACYAEPYBAADaAwAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAhnQIAAN0DwwIiqgIAANsDqgIirgIBAIgDACHAAggA3AMAIcECAQCIAwAhxAIAAN4DxAIixQIBAIkDACHGAgAA1QMAIASMAgAAAKoCAo0CAAAAqgIIjgIAAACqAgiTAgAAqgOqAiIIjAIIAAAAAY0CCAAAAASOAggAAAAEjwIIAAAAAZACCAAAAAGRAggAAAABkgIIAAAAAZMCCACfAwAhBIwCAAAAwwICjQIAAADDAgiOAgAAAMMCCJMCAADCA8MCIgSMAgAAAMQCAo0CAAAAxAIIjgIAAADEAgiTAgAAwAPEAiIhAwAAkAMAIAYAAJEDACAIAACSAwAgCQAAkwMAIAoAAJMDACAQAACUAwAgEQAAlQMAIBIAAJYDACAUAACXAwAgFQAAmAMAIPQBAACHAwAw9QEAADoAEPYBAACHAwAw9wEBAIgDACH4AQEAiAMAIfkBAQCIAwAh-gEBAIkDACH7AQEAiQMAIfwBAQCJAwAh_QEBAIkDACH_AQAAigP_ASKBAgAAiwOBAiKDAgAAjAODAiKEAiAAjQMAIYUCIACNAwAhhgIgAI0DACGHAiAAjQMAIYgCQACOAwAhiQJAAI4DACGKAkAAjwMAIYsCQACPAwAh4AIAADoAIOECAAA6ACAMEwAA3wMAIPQBAADgAwAw9QEAACIAEPYBAADgAwAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAhnQIAAOEDrAIiqgIAANsDqgIirAJAAI4DACGtAiAAjQMAIa4CAQCIAwAhBIwCAAAArAICjQIAAACsAgiOAgAAAKwCCJMCAACoA6wCIg4FAADfAwAg9AEAAOIDADD1AQAAHgAQ9gEAAOIDADD3AQEAiAMAIYoCQACPAwAhmgIBAIgDACG-AgEAiAMAIcgCAADjA8gCIskCAQCIAwAhygIgAI0DACHLAgEAiQMAIcwCAQCJAwAhzQIBAIkDACEEjAIAAADIAgKNAgAAAMgCCI4CAAAAyAIIkwIAAMcDyAIiDgsAAOYDACAbAADfAwAg9AEAAOQDADD1AQAAGwAQ9gEAAOQDADD3AQEAiAMAIYoCQACPAwAh0QIBAIgDACHZAgEAiAMAIdoCAQCIAwAh2wIBAIgDACHcAgEAiQMAId0CAgDlAwAh3gIBAIgDACEIjAICAAAAAY0CAgAAAAWOAgIAAAAFjwICAAAAAZACAgAAAAGRAgIAAAABkgICAAAAAZMCAgD5AgAhFwQAAO0DACAQAACUAwAgEQAAlQMAIBkAAO4DACAaAADfAwAg9AEAAOkDADD1AQAADwAQ9gEAAOkDADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGaAgEAiAMAIZsCAQCJAwAhnQIAAOoDnQIinwIAAOsDnwIioAJAAI4DACGhAgAAnAMAIKICAgDsAwAhowIBAIgDACGkAgEAiQMAIaUCAQCIAwAh4AIAAA8AIOECAAAPACAOCwAA5gMAIAwAAN8DACANAADoAwAgDgAAlAMAIPQBAADnAwAw9QEAABQAEPYBAADnAwAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAh0AIBAIgDACHRAgEAiAMAIdICAQCIAwAh0wIBAIkDACEQCwAA5gMAIAwAAN8DACANAADoAwAgDgAAlAMAIPQBAADnAwAw9QEAABQAEPYBAADnAwAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAh0AIBAIgDACHRAgEAiAMAIdICAQCIAwAh0wIBAIkDACHgAgAAFAAg4QIAABQAIBUEAADtAwAgEAAAlAMAIBEAAJUDACAZAADuAwAgGgAA3wMAIPQBAADpAwAw9QEAAA8AEPYBAADpAwAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAhmgIBAIgDACGbAgEAiQMAIZ0CAADqA50CIp8CAADrA58CIqACQACOAwAhoQIAAJwDACCiAgIA7AMAIaMCAQCIAwAhpAIBAIkDACGlAgEAiAMAIQSMAgAAAJ0CAo0CAAAAnQIIjgIAAACdAgiTAgAAowOdAiIEjAIAAACfAgKNAgAAAJ8CCI4CAAAAnwIIkwIAAKEDnwIiCIwCAgAAAAGNAgIAAAAEjgICAAAABI8CAgAAAAGQAgIAAAABkQICAAAAAZICAgAAAAGTAgIA9gIAIRITAADfAwAgFgAAkQMAIBcAAJIDACAYAACTAwAg9AEAAPMDADD1AQAAAwAQ9gEAAPMDADD3AQEAiAMAIfgBAQCIAwAhigJAAI8DACGLAkAAjwMAIZsCAQCJAwAhnQIAAPQDuAIirgIBAIgDACG4AkAAjwMAIbkCQACOAwAh4AIAAAMAIOECAAADACAhAwAAkAMAIAYAAJEDACAIAACSAwAgCQAAkwMAIAoAAJMDACAQAACUAwAgEQAAlQMAIBIAAJYDACAUAACXAwAgFQAAmAMAIPQBAACHAwAw9QEAADoAEPYBAACHAwAw9wEBAIgDACH4AQEAiAMAIfkBAQCIAwAh-gEBAIkDACH7AQEAiQMAIfwBAQCJAwAh_QEBAIkDACH_AQAAigP_ASKBAgAAiwOBAiKDAgAAjAODAiKEAiAAjQMAIYUCIACNAwAhhgIgAI0DACGHAiAAjQMAIYgCQACOAwAhiQJAAI4DACGKAkAAjwMAIYsCQACPAwAh4AIAADoAIOECAAA6ACAOBAAA7QMAIAcAAN8DACD0AQAA7wMAMPUBAAALABD2AQAA7wMAMPcBAQCIAwAh-QEBAIgDACGKAkAAjwMAIYsCQACPAwAhnQIAAPADvAIiowIBAIgDACG6AgEAiAMAIbwCAQCIAwAhvQJAAI8DACEEjAIAAAC8AgKNAgAAALwCCI4CAAAAvAIIkwIAALcDvAIiAqMCAQAAAAG-AgEAAAABCgQAAO0DACAFAADfAwAg9AEAAPIDADD1AQAABwAQ9gEAAPIDADD3AQEAiAMAIYoCQACPAwAhowIBAIgDACG-AgEAiAMAIb8CQACPAwAhEBMAAN8DACAWAACRAwAgFwAAkgMAIBgAAJMDACD0AQAA8wMAMPUBAAADABD2AQAA8wMAMPcBAQCIAwAh-AEBAIgDACGKAkAAjwMAIYsCQACPAwAhmwIBAIkDACGdAgAA9AO4AiKuAgEAiAMAIbgCQACPAwAhuQJAAI4DACEEjAIAAAC4AgKNAgAAALgCCI4CAAAAuAIIkwIAALMDuAIiAAAAAAHlAgEAAAABAeUCAQAAAAEB5QIAAAD_AQIB5QIAAACBAgIB5QIAAACDAgIB5QIgAAAAAQHlAkAAAAABAeUCQAAAAAELKAAAtgUAMCkAALsFADDiAgAAtwUAMOMCAAC4BQAw5AIAALkFACDlAgAAugUAMOYCAAC6BQAw5wIAALoFADDoAgAAugUAMOkCAAC8BQAw6gIAAL0FADALKAAAqAUAMCkAAK0FADDiAgAAqQUAMOMCAACqBQAw5AIAAKsFACDlAgAArAUAMOYCAACsBQAw5wIAAKwFADDoAgAArAUAMOkCAACuBQAw6gIAAK8FADALKAAAmQUAMCkAAJ4FADDiAgAAmgUAMOMCAACbBQAw5AIAAJwFACDlAgAAnQUAMOYCAACdBQAw5wIAAJ0FADDoAgAAnQUAMOkCAACfBQAw6gIAAKAFADALKAAAjgUAMCkAAJIFADDiAgAAjwUAMOMCAACQBQAw5AIAAJEFACDlAgAA5QQAMOYCAADlBAAw5wIAAOUEADDoAgAA5QQAMOkCAACTBQAw6gIAAOgEADALKAAA4QQAMCkAAOYEADDiAgAA4gQAMOMCAADjBAAw5AIAAOQEACDlAgAA5QQAMOYCAADlBAAw5wIAAOUEADDoAgAA5QQAMOkCAADnBAAw6gIAAOgEADALKAAAxAQAMCkAAMkEADDiAgAAxQQAMOMCAADGBAAw5AIAAMcEACDlAgAAyAQAMOYCAADIBAAw5wIAAMgEADDoAgAAyAQAMOkCAADKBAAw6gIAAMsEADALKAAAtQQAMCkAALoEADDiAgAAtgQAMOMCAAC3BAAw5AIAALgEACDlAgAAuQQAMOYCAAC5BAAw5wIAALkEADDoAgAAuQQAMOkCAAC7BAAw6gIAALwEADALKAAAqAQAMCkAAK0EADDiAgAAqQQAMOMCAACqBAAw5AIAAKsEACDlAgAArAQAMOYCAACsBAAw5wIAAKwEADDoAgAArAQAMOkCAACuBAAw6gIAAK8EADALKAAAmwQAMCkAAKAEADDiAgAAnAQAMOMCAACdBAAw5AIAAJ4EACDlAgAAnwQAMOYCAACfBAAw5wIAAJ8EADDoAgAAnwQAMOkCAAChBAAw6gIAAKIEADALKAAAiwQAMCkAAJAEADDiAgAAjAQAMOMCAACNBAAw5AIAAI4EACDlAgAAjwQAMOYCAACPBAAw5wIAAI8EADDoAgAAjwQAMOkCAACRBAAw6gIAAJIEADAK9wEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAADDAgKqAgAAAKoCAsACCAAAAAHBAgEAAAABxAIAAADEAgLFAgEAAAABxgKAAAAAAQIAAAAoACAoAACaBAAgAwAAACgAICgAAJoEACApAACZBAAgASEAAJIHADAPEwAA3wMAIPQBAADaAwAw9QEAACYAEPYBAADaAwAw9wEBAAAAAYoCQACPAwAhiwJAAI8DACGdAgAA3QPDAiKqAgAA2wOqAiKuAgEAiAMAIcACCADcAwAhwQIBAIgDACHEAgAA3gPEAiLFAgEAAAABxgIAANUDACACAAAAKAAgIQAAmQQAIAIAAACTBAAgIQAAlAQAIA70AQAAkgQAMPUBAACTBAAQ9gEAAJIEADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA3QPDAiKqAgAA2wOqAiKuAgEAiAMAIcACCADcAwAhwQIBAIgDACHEAgAA3gPEAiLFAgEAiQMAIcYCAADVAwAgDvQBAACSBAAw9QEAAJMEABD2AQAAkgQAMPcBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADdA8MCIqoCAADbA6oCIq4CAQCIAwAhwAIIANwDACHBAgEAiAMAIcQCAADeA8QCIsUCAQCJAwAhxgIAANUDACAK9wEBAPkDACGKAkAAgAQAIYsCQACABAAhnQIAAJcEwwIiqgIAAJUEqgIiwAIIAJYEACHBAgEA-QMAIcQCAACYBMQCIsUCAQD6AwAhxgKAAAAAAQHlAgAAAKoCAgXlAggAAAAB6wIIAAAAAewCCAAAAAHtAggAAAAB7gIIAAAAAQHlAgAAAMMCAgHlAgAAAMQCAgr3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAAlwTDAiKqAgAAlQSqAiLAAggAlgQAIcECAQD5AwAhxAIAAJgExAIixQIBAPoDACHGAoAAAAABCvcBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAwwICqgIAAACqAgLAAggAAAABwQIBAAAAAcQCAAAAxAICxQIBAAAAAcYCgAAAAAEH9wEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAACsAgKqAgAAAKoCAqwCQAAAAAGtAiAAAAABAgAAACQAICgAAKcEACADAAAAJAAgKAAApwQAICkAAKYEACABIQAAkQcAMAwTAADfAwAg9AEAAOADADD1AQAAIgAQ9gEAAOADADD3AQEAAAABigJAAI8DACGLAkAAjwMAIZ0CAADhA6wCIqoCAADbA6oCIqwCQACOAwAhrQIgAI0DACGuAgEAiAMAIQIAAAAkACAhAACmBAAgAgAAAKMEACAhAACkBAAgC_QBAACiBAAw9QEAAKMEABD2AQAAogQAMPcBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADhA6wCIqoCAADbA6oCIqwCQACOAwAhrQIgAI0DACGuAgEAiAMAIQv0AQAAogQAMPUBAACjBAAQ9gEAAKIEADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA4QOsAiKqAgAA2wOqAiKsAkAAjgMAIa0CIACNAwAhrgIBAIgDACEH9wEBAPkDACGKAkAAgAQAIYsCQACABAAhnQIAAKUErAIiqgIAAJUEqgIirAJAAP8DACGtAiAA_gMAIQHlAgAAAKwCAgf3AQEA-QMAIYoCQACABAAhiwJAAIAEACGdAgAApQSsAiKqAgAAlQSqAiKsAkAA_wMAIa0CIAD-AwAhB_cBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAArAICqgIAAACqAgKsAkAAAAABrQIgAAAAAQn3AQEAAAABigJAAAAAAZoCAQAAAAHIAgAAAMgCAskCAQAAAAHKAiAAAAABywIBAAAAAcwCAQAAAAHNAgEAAAABAgAAACAAICgAALQEACADAAAAIAAgKAAAtAQAICkAALMEACABIQAAkAcAMA4FAADfAwAg9AEAAOIDADD1AQAAHgAQ9gEAAOIDADD3AQEAAAABigJAAI8DACGaAgEAiAMAIb4CAQCIAwAhyAIAAOMDyAIiyQIBAIgDACHKAiAAjQMAIcsCAQCJAwAhzAIBAIkDACHNAgEAiQMAIQIAAAAgACAhAACzBAAgAgAAALAEACAhAACxBAAgDfQBAACvBAAw9QEAALAEABD2AQAArwQAMPcBAQCIAwAhigJAAI8DACGaAgEAiAMAIb4CAQCIAwAhyAIAAOMDyAIiyQIBAIgDACHKAiAAjQMAIcsCAQCJAwAhzAIBAIkDACHNAgEAiQMAIQ30AQAArwQAMPUBAACwBAAQ9gEAAK8EADD3AQEAiAMAIYoCQACPAwAhmgIBAIgDACG-AgEAiAMAIcgCAADjA8gCIskCAQCIAwAhygIgAI0DACHLAgEAiQMAIcwCAQCJAwAhzQIBAIkDACEJ9wEBAPkDACGKAkAAgAQAIZoCAQD5AwAhyAIAALIEyAIiyQIBAPkDACHKAiAA_gMAIcsCAQD6AwAhzAIBAPoDACHNAgEA-gMAIQHlAgAAAMgCAgn3AQEA-QMAIYoCQACABAAhmgIBAPkDACHIAgAAsgTIAiLJAgEA-QMAIcoCIAD-AwAhywIBAPoDACHMAgEA-gMAIc0CAQD6AwAhCfcBAQAAAAGKAkAAAAABmgIBAAAAAcgCAAAAyAICyQIBAAAAAcoCIAAAAAHLAgEAAAABzAIBAAAAAc0CAQAAAAEJCwAAwwQAIPcBAQAAAAGKAkAAAAAB0QIBAAAAAdkCAQAAAAHaAgEAAAAB2wIBAAAAAdwCAQAAAAHdAgIAAAABAgAAAAEAICgAAMIEACADAAAAAQAgKAAAwgQAICkAAMAEACABIQAAjwcAMA4LAADmAwAgGwAA3wMAIPQBAADkAwAw9QEAABsAEPYBAADkAwAw9wEBAAAAAYoCQACPAwAh0QIBAIgDACHZAgEAiAMAIdoCAQCIAwAh2wIBAIgDACHcAgEAiQMAId0CAgDlAwAh3gIBAIgDACECAAAAAQAgIQAAwAQAIAIAAAC9BAAgIQAAvgQAIAz0AQAAvAQAMPUBAAC9BAAQ9gEAALwEADD3AQEAiAMAIYoCQACPAwAh0QIBAIgDACHZAgEAiAMAIdoCAQCIAwAh2wIBAIgDACHcAgEAiQMAId0CAgDlAwAh3gIBAIgDACEM9AEAALwEADD1AQAAvQQAEPYBAAC8BAAw9wEBAIgDACGKAkAAjwMAIdECAQCIAwAh2QIBAIgDACHaAgEAiAMAIdsCAQCIAwAh3AIBAIkDACHdAgIA5QMAId4CAQCIAwAhCPcBAQD5AwAhigJAAIAEACHRAgEA-QMAIdkCAQD5AwAh2gIBAPkDACHbAgEA-QMAIdwCAQD6AwAh3QICAL8EACEF5QICAAAAAesCAgAAAAHsAgIAAAAB7QICAAAAAe4CAgAAAAEJCwAAwQQAIPcBAQD5AwAhigJAAIAEACHRAgEA-QMAIdkCAQD5AwAh2gIBAPkDACHbAgEA-QMAIdwCAQD6AwAh3QICAL8EACEFKAAAigcAICkAAI0HACDiAgAAiwcAIOMCAACMBwAg6AIAABEAIAkLAADDBAAg9wEBAAAAAYoCQAAAAAHRAgEAAAAB2QIBAAAAAdoCAQAAAAHbAgEAAAAB3AIBAAAAAd0CAgAAAAEDKAAAigcAIOICAACLBwAg6AIAABEAIAkLAADcBAAgDQAA4AQAIA4AAN4EACD3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0QIBAAAAAdMCAQAAAAECAAAAFgAgKAAA3wQAIAMAAAAWACAoAADfBAAgKQAAzgQAIAEhAACJBwAwDgsAAOYDACAMAADfAwAgDQAA6AMAIA4AAJQDACD0AQAA5wMAMPUBAAAUABD2AQAA5wMAMPcBAQAAAAGKAkAAjwMAIYsCQACPAwAh0AIBAIgDACHRAgEAiAMAIdICAQCIAwAh0wIBAIkDACECAAAAFgAgIQAAzgQAIAIAAADMBAAgIQAAzQQAIAr0AQAAywQAMPUBAADMBAAQ9gEAAMsEADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACHQAgEAiAMAIdECAQCIAwAh0gIBAIgDACHTAgEAiQMAIQr0AQAAywQAMPUBAADMBAAQ9gEAAMsEADD3AQEAiAMAIYoCQACPAwAhiwJAAI8DACHQAgEAiAMAIdECAQCIAwAh0gIBAIgDACHTAgEAiQMAIQb3AQEA-QMAIYoCQACABAAhiwJAAIAEACHQAgEA-QMAIdECAQD5AwAh0wIBAPoDACEJCwAAzwQAIA0AANAEACAOAADRBAAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAh0AIBAPkDACHRAgEA-QMAIdMCAQD6AwAhBSgAAP0GACApAACHBwAg4gIAAP4GACDjAgAAhgcAIOgCAAARACAHKAAA-QYAICkAAIQHACDiAgAA-gYAIOMCAACDBwAg5gIAABQAIOcCAAAUACDoAgAAFgAgCygAANIEADApAADWBAAw4gIAANMEADDjAgAA1AQAMOQCAADVBAAg5QIAAMgEADDmAgAAyAQAMOcCAADIBAAw6AIAAMgEADDpAgAA1wQAMOoCAADLBAAwCQsAANwEACAMAADdBAAgDgAA3gQAIPcBAQAAAAGKAkAAAAABiwJAAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAQIAAAAWACAoAADbBAAgAwAAABYAICgAANsEACApAADZBAAgASEAAIIHADACAAAAFgAgIQAA2QQAIAIAAADMBAAgIQAA2AQAIAb3AQEA-QMAIYoCQACABAAhiwJAAIAEACHQAgEA-QMAIdECAQD5AwAh0gIBAPkDACEJCwAAzwQAIAwAANoEACAOAADRBAAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAh0AIBAPkDACHRAgEA-QMAIdICAQD5AwAhBSgAAPsGACApAACABwAg4gIAAPwGACDjAgAA_wYAIOgCAADUAgAgCQsAANwEACAMAADdBAAgDgAA3gQAIPcBAQAAAAGKAkAAAAABiwJAAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAQMoAAD9BgAg4gIAAP4GACDoAgAAEQAgAygAAPsGACDiAgAA_AYAIOgCAADUAgAgBCgAANIEADDiAgAA0wQAMOQCAADVBAAg6AIAAMgEADAJCwAA3AQAIA0AAOAEACAOAADeBAAg9wEBAAAAAYoCQAAAAAGLAkAAAAAB0AIBAAAAAdECAQAAAAHTAgEAAAABAygAAPkGACDiAgAA-gYAIOgCAAAWACAQBAAAigUAIBAAAIwFACARAACNBQAgGQAAiwUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGjAgEAAAABpAIBAAAAAQIAAAARACAoAACIBQAgAwAAABEAICgAAIgFACApAADvBAAgASEAAPgGADAVBAAA7QMAIBAAAJQDACARAACVAwAgGQAA7gMAIBoAAN8DACD0AQAA6QMAMPUBAAAPABD2AQAA6QMAMPcBAQAAAAGKAkAAjwMAIYsCQACPAwAhmgIBAIgDACGbAgEAiQMAIZ0CAADqA50CIp8CAADrA58CIqACQACOAwAhoQIAAJwDACCiAgIA7AMAIaMCAQCIAwAhpAIBAIkDACGlAgEAiAMAIQIAAAARACAhAADvBAAgAgAAAOkEACAhAADqBAAgEPQBAADoBAAw9QEAAOkEABD2AQAA6AQAMPcBAQCIAwAhigJAAI8DACGLAkAAjwMAIZoCAQCIAwAhmwIBAIkDACGdAgAA6gOdAiKfAgAA6wOfAiKgAkAAjgMAIaECAACcAwAgogICAOwDACGjAgEAiAMAIaQCAQCJAwAhpQIBAIgDACEQ9AEAAOgEADD1AQAA6QQAEPYBAADoBAAw9wEBAIgDACGKAkAAjwMAIYsCQACPAwAhmgIBAIgDACGbAgEAiQMAIZ0CAADqA50CIp8CAADrA58CIqACQACOAwAhoQIAAJwDACCiAgIA7AMAIaMCAQCIAwAhpAIBAIkDACGlAgEAiAMAIQz3AQEA-QMAIYoCQACABAAhiwJAAIAEACGaAgEA-QMAIZsCAQD6AwAhnQIAAOsEnQIinwIAAOwEnwIioAJAAP8DACGhAgAA7QQAIKICAgDuBAAhowIBAPkDACGkAgEA-gMAIQHlAgAAAJ0CAgHlAgAAAJ8CAgLlAgEAAAAE7wIBAAAABQXlAgIAAAAB6wICAAAAAewCAgAAAAHtAgIAAAAB7gICAAAAARAEAADwBAAgEAAA8gQAIBEAAPMEACAZAADxBAAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAhmgIBAPkDACGbAgEA-gMAIZ0CAADrBJ0CIp8CAADsBJ8CIqACQAD_AwAhoQIAAO0EACCiAgIA7gQAIaMCAQD5AwAhpAIBAPoDACEFKAAA6QYAICkAAPYGACDiAgAA6gYAIOMCAAD1BgAg6AIAAAUAIAcoAADnBgAgKQAA8wYAIOICAADoBgAg4wIAAPIGACDmAgAAOgAg5wIAADoAIOgCAADUAgAgCygAAP8EADApAACDBQAw4gIAAIAFADDjAgAAgQUAMOQCAACCBQAg5QIAAMgEADDmAgAAyAQAMOcCAADIBAAw6AIAAMgEADDpAgAAhAUAMOoCAADLBAAwCygAAPQEADApAAD4BAAw4gIAAPUEADDjAgAA9gQAMOQCAAD3BAAg5QIAALkEADDmAgAAuQQAMOcCAAC5BAAw6AIAALkEADDpAgAA-QQAMOoCAAC8BAAwCRsAAP4EACD3AQEAAAABigJAAAAAAdkCAQAAAAHaAgEAAAAB2wIBAAAAAdwCAQAAAAHdAgIAAAAB3gIBAAAAAQIAAAABACAoAAD9BAAgAwAAAAEAICgAAP0EACApAAD7BAAgASEAAPEGADACAAAAAQAgIQAA-wQAIAIAAAC9BAAgIQAA-gQAIAj3AQEA-QMAIYoCQACABAAh2QIBAPkDACHaAgEA-QMAIdsCAQD5AwAh3AIBAPoDACHdAgIAvwQAId4CAQD5AwAhCRsAAPwEACD3AQEA-QMAIYoCQACABAAh2QIBAPkDACHaAgEA-QMAIdsCAQD5AwAh3AIBAPoDACHdAgIAvwQAId4CAQD5AwAhBSgAAOwGACApAADvBgAg4gIAAO0GACDjAgAA7gYAIOgCAADUAgAgCRsAAP4EACD3AQEAAAABigJAAAAAAdkCAQAAAAHaAgEAAAAB2wIBAAAAAdwCAQAAAAHdAgIAAAAB3gIBAAAAAQMoAADsBgAg4gIAAO0GACDoAgAA1AIAIAkMAADdBAAgDQAA4AQAIA4AAN4EACD3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0gIBAAAAAdMCAQAAAAECAAAAFgAgKAAAhwUAIAMAAAAWACAoAACHBQAgKQAAhgUAIAEhAADrBgAwAgAAABYAICEAAIYFACACAAAAzAQAICEAAIUFACAG9wEBAPkDACGKAkAAgAQAIYsCQACABAAh0AIBAPkDACHSAgEA-QMAIdMCAQD6AwAhCQwAANoEACANAADQBAAgDgAA0QQAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIdACAQD5AwAh0gIBAPkDACHTAgEA-gMAIQkMAADdBAAgDQAA4AQAIA4AAN4EACD3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0gIBAAAAAdMCAQAAAAEQBAAAigUAIBAAAIwFACARAACNBQAgGQAAiwUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGjAgEAAAABpAIBAAAAAQHlAgEAAAAEAygAAOkGACDiAgAA6gYAIOgCAAAFACADKAAA5wYAIOICAADoBgAg6AIAANQCACAEKAAA_wQAMOICAACABQAw5AIAAIIFACDoAgAAyAQAMAQoAAD0BAAw4gIAAPUEADDkAgAA9wQAIOgCAAC5BAAwEAQAAIoFACAQAACMBQAgEQAAjQUAIBoAAJgFACD3AQEAAAABigJAAAAAAYsCQAAAAAGaAgEAAAABmwIBAAAAAZ0CAAAAnQICnwIAAACfAgKgAkAAAAABoQIAAIkFACCiAgIAAAABowIBAAAAAaUCAQAAAAECAAAAEQAgKAAAlwUAIAMAAAARACAoAACXBQAgKQAAlQUAIAEhAADmBgAwAgAAABEAICEAAJUFACACAAAA6QQAICEAAJQFACAM9wEBAPkDACGKAkAAgAQAIYsCQACABAAhmgIBAPkDACGbAgEA-gMAIZ0CAADrBJ0CIp8CAADsBJ8CIqACQAD_AwAhoQIAAO0EACCiAgIA7gQAIaMCAQD5AwAhpQIBAPkDACEQBAAA8AQAIBAAAPIEACARAADzBAAgGgAAlgUAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIZoCAQD5AwAhmwIBAPoDACGdAgAA6wSdAiKfAgAA7ASfAiKgAkAA_wMAIaECAADtBAAgogICAO4EACGjAgEA-QMAIaUCAQD5AwAhBSgAAOEGACApAADkBgAg4gIAAOIGACDjAgAA4wYAIOgCAADUAgAgEAQAAIoFACAQAACMBQAgEQAAjQUAIBoAAJgFACD3AQEAAAABigJAAAAAAYsCQAAAAAGaAgEAAAABmwIBAAAAAZ0CAAAAnQICnwIAAACfAgKgAkAAAAABoQIAAIkFACCiAgIAAAABowIBAAAAAaUCAQAAAAEDKAAA4QYAIOICAADiBgAg6AIAANQCACAJBAAApwUAIPcBAQAAAAH5AQEAAAABigJAAAAAAYsCQAAAAAGdAgAAALwCAqMCAQAAAAG6AgEAAAABvQJAAAAAAQIAAAANACAoAACmBQAgAwAAAA0AICgAAKYFACApAACkBQAgASEAAOAGADAOBAAA7QMAIAcAAN8DACD0AQAA7wMAMPUBAAALABD2AQAA7wMAMPcBAQAAAAH5AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA8AO8AiKjAgEAiAMAIboCAQAAAAG8AgEAiAMAIb0CQACPAwAhAgAAAA0AICEAAKQFACACAAAAoQUAICEAAKIFACAM9AEAAKAFADD1AQAAoQUAEPYBAACgBQAw9wEBAIgDACH5AQEAiAMAIYoCQACPAwAhiwJAAI8DACGdAgAA8AO8AiKjAgEAiAMAIboCAQCIAwAhvAIBAIgDACG9AkAAjwMAIQz0AQAAoAUAMPUBAAChBQAQ9gEAAKAFADD3AQEAiAMAIfkBAQCIAwAhigJAAI8DACGLAkAAjwMAIZ0CAADwA7wCIqMCAQCIAwAhugIBAIgDACG8AgEAiAMAIb0CQACPAwAhCPcBAQD5AwAh-QEBAPkDACGKAkAAgAQAIYsCQACABAAhnQIAAKMFvAIiowIBAPkDACG6AgEA-QMAIb0CQACABAAhAeUCAAAAvAICCQQAAKUFACD3AQEA-QMAIfkBAQD5AwAhigJAAIAEACGLAkAAgAQAIZ0CAACjBbwCIqMCAQD5AwAhugIBAPkDACG9AkAAgAQAIQUoAADbBgAgKQAA3gYAIOICAADcBgAg4wIAAN0GACDoAgAABQAgCQQAAKcFACD3AQEAAAAB-QEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAAC8AgKjAgEAAAABugIBAAAAAb0CQAAAAAEDKAAA2wYAIOICAADcBgAg6AIAAAUAIAUEAAC1BQAg9wEBAAAAAYoCQAAAAAGjAgEAAAABvwJAAAAAAQIAAAAJACAoAAC0BQAgAwAAAAkAICgAALQFACApAACyBQAgASEAANoGADALBAAA7QMAIAUAAN8DACD0AQAA8gMAMPUBAAAHABD2AQAA8gMAMPcBAQAAAAGKAkAAjwMAIaMCAQCIAwAhvgIBAIgDACG_AkAAjwMAId8CAADxAwAgAgAAAAkAICEAALIFACACAAAAsAUAICEAALEFACAI9AEAAK8FADD1AQAAsAUAEPYBAACvBQAw9wEBAIgDACGKAkAAjwMAIaMCAQCIAwAhvgIBAIgDACG_AkAAjwMAIQj0AQAArwUAMPUBAACwBQAQ9gEAAK8FADD3AQEAiAMAIYoCQACPAwAhowIBAIgDACG-AgEAiAMAIb8CQACPAwAhBPcBAQD5AwAhigJAAIAEACGjAgEA-QMAIb8CQACABAAhBQQAALMFACD3AQEA-QMAIYoCQACABAAhowIBAPkDACG_AkAAgAQAIQUoAADVBgAgKQAA2AYAIOICAADWBgAg4wIAANcGACDoAgAABQAgBQQAALUFACD3AQEAAAABigJAAAAAAaMCAQAAAAG_AkAAAAABAygAANUGACDiAgAA1gYAIOgCAAAFACALFgAA5QUAIBcAAOYFACAYAADnBQAg9wEBAAAAAfgBAQAAAAGKAkAAAAABiwJAAAAAAZsCAQAAAAGdAgAAALgCArgCQAAAAAG5AkAAAAABAgAAAAUAICgAAOQFACADAAAABQAgKAAA5AUAICkAAMEFACABIQAA1AYAMBATAADfAwAgFgAAkQMAIBcAAJIDACAYAACTAwAg9AEAAPMDADD1AQAAAwAQ9gEAAPMDADD3AQEAAAAB-AEBAIgDACGKAkAAjwMAIYsCQACPAwAhmwIBAIkDACGdAgAA9AO4AiKuAgEAiAMAIbgCQACPAwAhuQJAAI4DACECAAAABQAgIQAAwQUAIAIAAAC-BQAgIQAAvwUAIAz0AQAAvQUAMPUBAAC-BQAQ9gEAAL0FADD3AQEAiAMAIfgBAQCIAwAhigJAAI8DACGLAkAAjwMAIZsCAQCJAwAhnQIAAPQDuAIirgIBAIgDACG4AkAAjwMAIbkCQACOAwAhDPQBAAC9BQAw9QEAAL4FABD2AQAAvQUAMPcBAQCIAwAh-AEBAIgDACGKAkAAjwMAIYsCQACPAwAhmwIBAIkDACGdAgAA9AO4AiKuAgEAiAMAIbgCQACPAwAhuQJAAI4DACEI9wEBAPkDACH4AQEA-QMAIYoCQACABAAhiwJAAIAEACGbAgEA-gMAIZ0CAADABbgCIrgCQACABAAhuQJAAP8DACEB5QIAAAC4AgILFgAAwgUAIBcAAMMFACAYAADEBQAg9wEBAPkDACH4AQEA-QMAIYoCQACABAAhiwJAAIAEACGbAgEA-gMAIZ0CAADABbgCIrgCQACABAAhuQJAAP8DACELKAAA2QUAMCkAAN0FADDiAgAA2gUAMOMCAADbBQAw5AIAANwFACDlAgAArAUAMOYCAACsBQAw5wIAAKwFADDoAgAArAUAMOkCAADeBQAw6gIAAK8FADALKAAAzgUAMCkAANIFADDiAgAAzwUAMOMCAADQBQAw5AIAANEFACDlAgAAnQUAMOYCAACdBQAw5wIAAJ0FADDoAgAAnQUAMOkCAADTBQAw6gIAAKAFADALKAAAxQUAMCkAAMkFADDiAgAAxgUAMOMCAADHBQAw5AIAAMgFACDlAgAA5QQAMOYCAADlBAAw5wIAAOUEADDoAgAA5QQAMOkCAADKBQAw6gIAAOgEADAQEAAAjAUAIBEAAI0FACAZAACLBQAgGgAAmAUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGkAgEAAAABpQIBAAAAAQIAAAARACAoAADNBQAgAwAAABEAICgAAM0FACApAADMBQAgASEAANMGADACAAAAEQAgIQAAzAUAIAIAAADpBAAgIQAAywUAIAz3AQEA-QMAIYoCQACABAAhiwJAAIAEACGaAgEA-QMAIZsCAQD6AwAhnQIAAOsEnQIinwIAAOwEnwIioAJAAP8DACGhAgAA7QQAIKICAgDuBAAhpAIBAPoDACGlAgEA-QMAIRAQAADyBAAgEQAA8wQAIBkAAPEEACAaAACWBQAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAhmgIBAPkDACGbAgEA-gMAIZ0CAADrBJ0CIp8CAADsBJ8CIqACQAD_AwAhoQIAAO0EACCiAgIA7gQAIaQCAQD6AwAhpQIBAPkDACEQEAAAjAUAIBEAAI0FACAZAACLBQAgGgAAmAUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGkAgEAAAABpQIBAAAAAQkHAADYBQAg9wEBAAAAAfkBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAvAICugIBAAAAAbwCAQAAAAG9AkAAAAABAgAAAA0AICgAANcFACADAAAADQAgKAAA1wUAICkAANUFACABIQAA0gYAMAIAAAANACAhAADVBQAgAgAAAKEFACAhAADUBQAgCPcBAQD5AwAh-QEBAPkDACGKAkAAgAQAIYsCQACABAAhnQIAAKMFvAIiugIBAPkDACG8AgEA-QMAIb0CQACABAAhCQcAANYFACD3AQEA-QMAIfkBAQD5AwAhigJAAIAEACGLAkAAgAQAIZ0CAACjBbwCIroCAQD5AwAhvAIBAPkDACG9AkAAgAQAIQUoAADNBgAgKQAA0AYAIOICAADOBgAg4wIAAM8GACDoAgAA1AIAIAkHAADYBQAg9wEBAAAAAfkBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAvAICugIBAAAAAbwCAQAAAAG9AkAAAAABAygAAM0GACDiAgAAzgYAIOgCAADUAgAgBQUAAOMFACD3AQEAAAABigJAAAAAAb4CAQAAAAG_AkAAAAABAgAAAAkAICgAAOIFACADAAAACQAgKAAA4gUAICkAAOAFACABIQAAzAYAMAIAAAAJACAhAADgBQAgAgAAALAFACAhAADfBQAgBPcBAQD5AwAhigJAAIAEACG-AgEA-QMAIb8CQACABAAhBQUAAOEFACD3AQEA-QMAIYoCQACABAAhvgIBAPkDACG_AkAAgAQAIQUoAADHBgAgKQAAygYAIOICAADIBgAg4wIAAMkGACDoAgAA1AIAIAUFAADjBQAg9wEBAAAAAYoCQAAAAAG-AgEAAAABvwJAAAAAAQMoAADHBgAg4gIAAMgGACDoAgAA1AIAIAsWAADlBQAgFwAA5gUAIBgAAOcFACD3AQEAAAAB-AEBAAAAAYoCQAAAAAGLAkAAAAABmwIBAAAAAZ0CAAAAuAICuAJAAAAAAbkCQAAAAAEEKAAA2QUAMOICAADaBQAw5AIAANwFACDoAgAArAUAMAQoAADOBQAw4gIAAM8FADDkAgAA0QUAIOgCAACdBQAwBCgAAMUFADDiAgAAxgUAMOQCAADIBQAg6AIAAOUEADAEKAAAtgUAMOICAAC3BQAw5AIAALkFACDoAgAAugUAMAQoAACoBQAw4gIAAKkFADDkAgAAqwUAIOgCAACsBQAwBCgAAJkFADDiAgAAmgUAMOQCAACcBQAg6AIAAJ0FADAEKAAAjgUAMOICAACPBQAw5AIAAJEFACDoAgAA5QQAMAQoAADhBAAw4gIAAOIEADDkAgAA5AQAIOgCAADlBAAwBCgAAMQEADDiAgAAxQQAMOQCAADHBAAg6AIAAMgEADAEKAAAtQQAMOICAAC2BAAw5AIAALgEACDoAgAAuQQAMAQoAACoBAAw4gIAAKkEADDkAgAAqwQAIOgCAACsBAAwBCgAAJsEADDiAgAAnAQAMOQCAACeBAAg6AIAAJ8EADAEKAAAiwQAMOICAACMBAAw5AIAAI4EACDoAgAAjwQAMAAAAAAAAAAAAAAAAAAAAAAABSgAAMIGACApAADFBgAg4gIAAMMGACDjAgAAxAYAIOgCAADUAgAgAygAAMIGACDiAgAAwwYAIOgCAADUAgAgAAAAAAAABSgAAL0GACApAADABgAg4gIAAL4GACDjAgAAvwYAIOgCAADUAgAgAygAAL0GACDiAgAAvgYAIOgCAADUAgAgAAAAAAAAAAAAAAAFKAAAuAYAICkAALsGACDiAgAAuQYAIOMCAAC6BgAg6AIAANQCACADKAAAuAYAIOICAAC5BgAg6AIAANQCACAAAAAFKAAAswYAICkAALYGACDiAgAAtAYAIOMCAAC1BgAg6AIAANQCACADKAAAswYAIOICAAC0BgAg6AIAANQCACAAAAAB5QIAAADQAgIAAAAAAAAB5QIAAAD_AQMAAAAAABADAADyBQAgBgAA8wUAIAgAAPQFACAJAAD1BQAgCgAA9QUAIBAAAPYFACARAAD3BQAgEgAA-AUAIBQAAPkFACAVAAD6BQAg-gEAAPUDACD7AQAA9QMAIPwBAAD1AwAg_QEAAPUDACCIAgAA9QMAIIkCAAD1AwAgCAQAALIGACAQAAD2BQAgEQAA9wUAIBkAAK8GACAaAACvBgAgmwIAAPUDACCgAgAA9QMAIKQCAAD1AwAgBQsAALAGACAMAACvBgAgDQAAsQYAIA4AAPYFACDTAgAA9QMAIAYTAACvBgAgFgAA8wUAIBcAAPQFACAYAAD1BQAgmwIAAPUDACC5AgAA9QMAIBsDAADoBQAgBgAA6QUAIAgAAOoFACAJAADrBQAgCgAA7AUAIBAAAO0FACARAADuBQAgFAAA8AUAIBUAAPEFACD3AQEAAAAB-AEBAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_wEAAAD_AQKBAgAAAIECAoMCAAAAgwIChAIgAAAAAYUCIAAAAAGGAiAAAAABhwIgAAAAAYgCQAAAAAGJAkAAAAABigJAAAAAAYsCQAAAAAECAAAA1AIAICgAALMGACADAAAAOgAgKAAAswYAICkAALcGACAdAAAAOgAgAwAAgQQAIAYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBQAAIkEACAVAACKBAAgIQAAtwYAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIRsDAACBBAAgBgAAggQAIAgAAIMEACAJAACEBAAgCgAAhQQAIBAAAIYEACARAACHBAAgFAAAiQQAIBUAAIoEACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAA6AUAIAYAAOkFACAIAADqBQAgCQAA6wUAIAoAAOwFACAQAADtBQAgEQAA7gUAIBIAAO8FACAUAADwBQAg9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf8BAAAA_wECgQIAAACBAgKDAgAAAIMCAoQCIAAAAAGFAiAAAAABhgIgAAAAAYcCIAAAAAGIAkAAAAABiQJAAAAAAYoCQAAAAAGLAkAAAAABAgAAANQCACAoAAC4BgAgAwAAADoAICgAALgGACApAAC8BgAgHQAAADoAIAMAAIEEACAGAACCBAAgCAAAgwQAIAkAAIQEACAKAACFBAAgEAAAhgQAIBEAAIcEACASAACIBAAgFAAAiQQAICEAALwGACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAAgQQAIAYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhGwYAAOkFACAIAADqBQAgCQAA6wUAIAoAAOwFACAQAADtBQAgEQAA7gUAIBIAAO8FACAUAADwBQAgFQAA8QUAIPcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH_AQAAAP8BAoECAAAAgQICgwIAAACDAgKEAiAAAAABhQIgAAAAAYYCIAAAAAGHAiAAAAABiAJAAAAAAYkCQAAAAAGKAkAAAAABiwJAAAAAAQIAAADUAgAgKAAAvQYAIAMAAAA6ACAoAAC9BgAgKQAAwQYAIB0AAAA6ACAGAACCBAAgCAAAgwQAIAkAAIQEACAKAACFBAAgEAAAhgQAIBEAAIcEACASAACIBAAgFAAAiQQAIBUAAIoEACAhAADBBgAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhGwYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIRsDAADoBQAgBgAA6QUAIAgAAOoFACAJAADrBQAgCgAA7AUAIBAAAO0FACARAADuBQAgEgAA7wUAIBUAAPEFACD3AQEAAAAB-AEBAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_wEAAAD_AQKBAgAAAIECAoMCAAAAgwIChAIgAAAAAYUCIAAAAAGGAiAAAAABhwIgAAAAAYgCQAAAAAGJAkAAAAABigJAAAAAAYsCQAAAAAECAAAA1AIAICgAAMIGACADAAAAOgAgKAAAwgYAICkAAMYGACAdAAAAOgAgAwAAgQQAIAYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAVAACKBAAgIQAAxgYAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIRsDAACBBAAgBgAAggQAIAgAAIMEACAJAACEBAAgCgAAhQQAIBAAAIYEACARAACHBAAgEgAAiAQAIBUAAIoEACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAA6AUAIAgAAOoFACAJAADrBQAgCgAA7AUAIBAAAO0FACARAADuBQAgEgAA7wUAIBQAAPAFACAVAADxBQAg9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf8BAAAA_wECgQIAAACBAgKDAgAAAIMCAoQCIAAAAAGFAiAAAAABhgIgAAAAAYcCIAAAAAGIAkAAAAABiQJAAAAAAYoCQAAAAAGLAkAAAAABAgAAANQCACAoAADHBgAgAwAAADoAICgAAMcGACApAADLBgAgHQAAADoAIAMAAIEEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAICEAAMsGACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAAgQQAIAgAAIMEACAJAACEBAAgCgAAhQQAIBAAAIYEACARAACHBAAgEgAAiAQAIBQAAIkEACAVAACKBAAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhBPcBAQAAAAGKAkAAAAABvgIBAAAAAb8CQAAAAAEbAwAA6AUAIAYAAOkFACAJAADrBQAgCgAA7AUAIBAAAO0FACARAADuBQAgEgAA7wUAIBQAAPAFACAVAADxBQAg9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf8BAAAA_wECgQIAAACBAgKDAgAAAIMCAoQCIAAAAAGFAiAAAAABhgIgAAAAAYcCIAAAAAGIAkAAAAABiQJAAAAAAYoCQAAAAAGLAkAAAAABAgAAANQCACAoAADNBgAgAwAAADoAICgAAM0GACApAADRBgAgHQAAADoAIAMAAIEEACAGAACCBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAICEAANEGACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAAgQQAIAYAAIIEACAJAACEBAAgCgAAhQQAIBAAAIYEACARAACHBAAgEgAAiAQAIBQAAIkEACAVAACKBAAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhCPcBAQAAAAH5AQEAAAABigJAAAAAAYsCQAAAAAGdAgAAALwCAroCAQAAAAG8AgEAAAABvQJAAAAAAQz3AQEAAAABigJAAAAAAYsCQAAAAAGaAgEAAAABmwIBAAAAAZ0CAAAAnQICnwIAAACfAgKgAkAAAAABoQIAAIkFACCiAgIAAAABpAIBAAAAAaUCAQAAAAEI9wEBAAAAAfgBAQAAAAGKAkAAAAABiwJAAAAAAZsCAQAAAAGdAgAAALgCArgCQAAAAAG5AkAAAAABDBMAAIwGACAXAADmBQAgGAAA5wUAIPcBAQAAAAH4AQEAAAABigJAAAAAAYsCQAAAAAGbAgEAAAABnQIAAAC4AgKuAgEAAAABuAJAAAAAAbkCQAAAAAECAAAABQAgKAAA1QYAIAMAAAADACAoAADVBgAgKQAA2QYAIA4AAAADACATAACLBgAgFwAAwwUAIBgAAMQFACAhAADZBgAg9wEBAPkDACH4AQEA-QMAIYoCQACABAAhiwJAAIAEACGbAgEA-gMAIZ0CAADABbgCIq4CAQD5AwAhuAJAAIAEACG5AkAA_wMAIQwTAACLBgAgFwAAwwUAIBgAAMQFACD3AQEA-QMAIfgBAQD5AwAhigJAAIAEACGLAkAAgAQAIZsCAQD6AwAhnQIAAMAFuAIirgIBAPkDACG4AkAAgAQAIbkCQAD_AwAhBPcBAQAAAAGKAkAAAAABowIBAAAAAb8CQAAAAAEMEwAAjAYAIBYAAOUFACAYAADnBQAg9wEBAAAAAfgBAQAAAAGKAkAAAAABiwJAAAAAAZsCAQAAAAGdAgAAALgCAq4CAQAAAAG4AkAAAAABuQJAAAAAAQIAAAAFACAoAADbBgAgAwAAAAMAICgAANsGACApAADfBgAgDgAAAAMAIBMAAIsGACAWAADCBQAgGAAAxAUAICEAAN8GACD3AQEA-QMAIfgBAQD5AwAhigJAAIAEACGLAkAAgAQAIZsCAQD6AwAhnQIAAMAFuAIirgIBAPkDACG4AkAAgAQAIbkCQAD_AwAhDBMAAIsGACAWAADCBQAgGAAAxAUAIPcBAQD5AwAh-AEBAPkDACGKAkAAgAQAIYsCQACABAAhmwIBAPoDACGdAgAAwAW4AiKuAgEA-QMAIbgCQACABAAhuQJAAP8DACEI9wEBAAAAAfkBAQAAAAGKAkAAAAABiwJAAAAAAZ0CAAAAvAICowIBAAAAAboCAQAAAAG9AkAAAAABGwMAAOgFACAGAADpBQAgCAAA6gUAIAkAAOsFACAQAADtBQAgEQAA7gUAIBIAAO8FACAUAADwBQAgFQAA8QUAIPcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH_AQAAAP8BAoECAAAAgQICgwIAAACDAgKEAiAAAAABhQIgAAAAAYYCIAAAAAGHAiAAAAABiAJAAAAAAYkCQAAAAAGKAkAAAAABiwJAAAAAAQIAAADUAgAgKAAA4QYAIAMAAAA6ACAoAADhBgAgKQAA5QYAIB0AAAA6ACADAACBBAAgBgAAggQAIAgAAIMEACAJAACEBAAgEAAAhgQAIBEAAIcEACASAACIBAAgFAAAiQQAIBUAAIoEACAhAADlBgAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhGwMAAIEEACAGAACCBAAgCAAAgwQAIAkAAIQEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIQz3AQEAAAABigJAAAAAAYsCQAAAAAGaAgEAAAABmwIBAAAAAZ0CAAAAnQICnwIAAACfAgKgAkAAAAABoQIAAIkFACCiAgIAAAABowIBAAAAAaUCAQAAAAEbAwAA6AUAIAYAAOkFACAIAADqBQAgCgAA7AUAIBAAAO0FACARAADuBQAgEgAA7wUAIBQAAPAFACAVAADxBQAg9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf8BAAAA_wECgQIAAACBAgKDAgAAAIMCAoQCIAAAAAGFAiAAAAABhgIgAAAAAYcCIAAAAAGIAkAAAAABiQJAAAAAAYoCQAAAAAGLAkAAAAABAgAAANQCACAoAADnBgAgDBMAAIwGACAWAADlBQAgFwAA5gUAIPcBAQAAAAH4AQEAAAABigJAAAAAAYsCQAAAAAGbAgEAAAABnQIAAAC4AgKuAgEAAAABuAJAAAAAAbkCQAAAAAECAAAABQAgKAAA6QYAIAb3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0gIBAAAAAdMCAQAAAAEbAwAA6AUAIAYAAOkFACAIAADqBQAgCQAA6wUAIAoAAOwFACAQAADtBQAgEgAA7wUAIBQAAPAFACAVAADxBQAg9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf8BAAAA_wECgQIAAACBAgKDAgAAAIMCAoQCIAAAAAGFAiAAAAABhgIgAAAAAYcCIAAAAAGIAkAAAAABiQJAAAAAAYoCQAAAAAGLAkAAAAABAgAAANQCACAoAADsBgAgAwAAADoAICgAAOwGACApAADwBgAgHQAAADoAIAMAAIEEACAGAACCBAAgCAAAgwQAIAkAAIQEACAKAACFBAAgEAAAhgQAIBIAAIgEACAUAACJBAAgFQAAigQAICEAAPAGACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAAgQQAIAYAAIIEACAIAACDBAAgCQAAhAQAIAoAAIUEACAQAACGBAAgEgAAiAQAIBQAAIkEACAVAACKBAAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhCPcBAQAAAAGKAkAAAAAB2QIBAAAAAdoCAQAAAAHbAgEAAAAB3AIBAAAAAd0CAgAAAAHeAgEAAAABAwAAADoAICgAAOcGACApAAD0BgAgHQAAADoAIAMAAIEEACAGAACCBAAgCAAAgwQAIAoAAIUEACAQAACGBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAICEAAPQGACD3AQEA-QMAIfgBAQD5AwAh-QEBAPkDACH6AQEA-gMAIfsBAQD6AwAh_AEBAPoDACH9AQEA-gMAIf8BAAD7A_8BIoECAAD8A4ECIoMCAAD9A4MCIoQCIAD-AwAhhQIgAP4DACGGAiAA_gMAIYcCIAD-AwAhiAJAAP8DACGJAkAA_wMAIYoCQACABAAhiwJAAIAEACEbAwAAgQQAIAYAAIIEACAIAACDBAAgCgAAhQQAIBAAAIYEACARAACHBAAgEgAAiAQAIBQAAIkEACAVAACKBAAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhAwAAAAMAICgAAOkGACApAAD3BgAgDgAAAAMAIBMAAIsGACAWAADCBQAgFwAAwwUAICEAAPcGACD3AQEA-QMAIfgBAQD5AwAhigJAAIAEACGLAkAAgAQAIZsCAQD6AwAhnQIAAMAFuAIirgIBAPkDACG4AkAAgAQAIbkCQAD_AwAhDBMAAIsGACAWAADCBQAgFwAAwwUAIPcBAQD5AwAh-AEBAPkDACGKAkAAgAQAIYsCQACABAAhmwIBAPoDACGdAgAAwAW4AiKuAgEA-QMAIbgCQACABAAhuQJAAP8DACEM9wEBAAAAAYoCQAAAAAGLAkAAAAABmgIBAAAAAZsCAQAAAAGdAgAAAJ0CAp8CAAAAnwICoAJAAAAAAaECAACJBQAgogICAAAAAaMCAQAAAAGkAgEAAAABCgsAANwEACAMAADdBAAgDQAA4AQAIPcBAQAAAAGKAkAAAAABiwJAAAAAAdACAQAAAAHRAgEAAAAB0gIBAAAAAdMCAQAAAAECAAAAFgAgKAAA-QYAIBsDAADoBQAgBgAA6QUAIAgAAOoFACAJAADrBQAgCgAA7AUAIBEAAO4FACASAADvBQAgFAAA8AUAIBUAAPEFACD3AQEAAAAB-AEBAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_wEAAAD_AQKBAgAAAIECAoMCAAAAgwIChAIgAAAAAYUCIAAAAAGGAiAAAAABhwIgAAAAAYgCQAAAAAGJAkAAAAABigJAAAAAAYsCQAAAAAECAAAA1AIAICgAAPsGACARBAAAigUAIBEAAI0FACAZAACLBQAgGgAAmAUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAECAAAAEQAgKAAA_QYAIAMAAAA6ACAoAAD7BgAgKQAAgQcAIB0AAAA6ACADAACBBAAgBgAAggQAIAgAAIMEACAJAACEBAAgCgAAhQQAIBEAAIcEACASAACIBAAgFAAAiQQAIBUAAIoEACAhAACBBwAg9wEBAPkDACH4AQEA-QMAIfkBAQD5AwAh-gEBAPoDACH7AQEA-gMAIfwBAQD6AwAh_QEBAPoDACH_AQAA-wP_ASKBAgAA_AOBAiKDAgAA_QODAiKEAiAA_gMAIYUCIAD-AwAhhgIgAP4DACGHAiAA_gMAIYgCQAD_AwAhiQJAAP8DACGKAkAAgAQAIYsCQACABAAhGwMAAIEEACAGAACCBAAgCAAAgwQAIAkAAIQEACAKAACFBAAgEQAAhwQAIBIAAIgEACAUAACJBAAgFQAAigQAIPcBAQD5AwAh-AEBAPkDACH5AQEA-QMAIfoBAQD6AwAh-wEBAPoDACH8AQEA-gMAIf0BAQD6AwAh_wEAAPsD_wEigQIAAPwDgQIigwIAAP0DgwIihAIgAP4DACGFAiAA_gMAIYYCIAD-AwAhhwIgAP4DACGIAkAA_wMAIYkCQAD_AwAhigJAAIAEACGLAkAAgAQAIQb3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0QIBAAAAAdICAQAAAAEDAAAAFAAgKAAA-QYAICkAAIUHACAMAAAAFAAgCwAAzwQAIAwAANoEACANAADQBAAgIQAAhQcAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIdACAQD5AwAh0QIBAPkDACHSAgEA-QMAIdMCAQD6AwAhCgsAAM8EACAMAADaBAAgDQAA0AQAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIdACAQD5AwAh0QIBAPkDACHSAgEA-QMAIdMCAQD6AwAhAwAAAA8AICgAAP0GACApAACIBwAgEwAAAA8AIAQAAPAEACARAADzBAAgGQAA8QQAIBoAAJYFACAhAACIBwAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAhmgIBAPkDACGbAgEA-gMAIZ0CAADrBJ0CIp8CAADsBJ8CIqACQAD_AwAhoQIAAO0EACCiAgIA7gQAIaMCAQD5AwAhpAIBAPoDACGlAgEA-QMAIREEAADwBAAgEQAA8wQAIBkAAPEEACAaAACWBQAg9wEBAPkDACGKAkAAgAQAIYsCQACABAAhmgIBAPkDACGbAgEA-gMAIZ0CAADrBJ0CIp8CAADsBJ8CIqACQAD_AwAhoQIAAO0EACCiAgIA7gQAIaMCAQD5AwAhpAIBAPoDACGlAgEA-QMAIQb3AQEAAAABigJAAAAAAYsCQAAAAAHQAgEAAAAB0QIBAAAAAdMCAQAAAAERBAAAigUAIBAAAIwFACAZAACLBQAgGgAAmAUAIPcBAQAAAAGKAkAAAAABiwJAAAAAAZoCAQAAAAGbAgEAAAABnQIAAACdAgKfAgAAAJ8CAqACQAAAAAGhAgAAiQUAIKICAgAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAECAAAAEQAgKAAAigcAIAMAAAAPACAoAACKBwAgKQAAjgcAIBMAAAAPACAEAADwBAAgEAAA8gQAIBkAAPEEACAaAACWBQAgIQAAjgcAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIZoCAQD5AwAhmwIBAPoDACGdAgAA6wSdAiKfAgAA7ASfAiKgAkAA_wMAIaECAADtBAAgogICAO4EACGjAgEA-QMAIaQCAQD6AwAhpQIBAPkDACERBAAA8AQAIBAAAPIEACAZAADxBAAgGgAAlgUAIPcBAQD5AwAhigJAAIAEACGLAkAAgAQAIZoCAQD5AwAhmwIBAPoDACGdAgAA6wSdAiKfAgAA7ASfAiKgAkAA_wMAIaECAADtBAAgogICAO4EACGjAgEA-QMAIaQCAQD6AwAhpQIBAPkDACEI9wEBAAAAAYoCQAAAAAHRAgEAAAAB2QIBAAAAAdoCAQAAAAHbAgEAAAAB3AIBAAAAAd0CAgAAAAEJ9wEBAAAAAYoCQAAAAAGaAgEAAAAByAIAAADIAgLJAgEAAAABygIgAAAAAcsCAQAAAAHMAgEAAAABzQIBAAAAAQf3AQEAAAABigJAAAAAAYsCQAAAAAGdAgAAAKwCAqoCAAAAqgICrAJAAAAAAa0CIAAAAAEK9wEBAAAAAYoCQAAAAAGLAkAAAAABnQIAAADDAgKqAgAAAKoCAsACCAAAAAHBAgEAAAABxAIAAADEAgLFAgEAAAABxgKAAAAAAQILAAIbAAQGBAADDwAOEDwHET0BGTsEGgAEBQ8ADRMABBY0BRc1Bhg2AgsDBgMGCgUIDgYJEgIKEwIPAAwQFwcRHQESIQkUJQoVKQsCBAADBQAEAgQAAwcABAULAAIMAAQNGAcOGQcPAAgBDhoAAQUABAETAAQBEwAECgMqAAYrAAgsAAktAAouABAvABEwABIxABQyABUzAAMWNwAXOAAYOQACED4AET8AAAILAAIbAAQCCwACGwAEBQ8AEy4AFC8AFTAAFjEAFwAAAAAABQ8AEy4AFC8AFTAAFjEAFwAAAAMPAB0wAB4xAB8AAAADDwAdMAAeMQAfAwsAAgwABA14BwMLAAIMAAQNfgcDDwAkMAAlMQAmAAAAAw8AJDAAJTEAJgAAAAMPACwwAC0xAC4AAAADDwAsMAAtMQAuAQUABAEFAAQDDwAzMAA0MQA1AAAAAw8AMzAANDEANQETAAQBEwAEBQ8AOi4AOy8APDAAPTEAPgAAAAAABQ8AOi4AOy8APDAAPTEAPgIEAAMFAAQCBAADBQAEAw8AQzAARDEARQAAAAMPAEMwAEQxAEUCBAADBwAEAgQAAwcABAMPAEowAEsxAEwAAAADDwBKMABLMQBMARMABAETAAQDDwBRMABSMQBTAAAAAw8AUTAAUjEAUwAAAAMPAFkwAFoxAFsAAAADDwBZMABaMQBbARMABAETAAQDDwBgMABhMQBiAAAAAw8AYDAAYTEAYgMEAAMZxgIEGgAEAwQAAxnMAgQaAAQFDwBnLgBoLwBpMABqMQBrAAAAAAAFDwBnLgBoLwBpMABqMQBrAAADDwBwMABxMQByAAAAAw8AcDAAcTEAchwCAR1AAR5BAR9CASBDASJFASNHDyRIECVKASZMDydNESpOAStPASxQDzJTEjNUGDRWGTVXGTZaGTdbGThcGTleGTpgDzthGjxjGT1lDz5mGz9nGUBoGUFpD0JsHENtIERuB0VvB0ZwB0dxB0hyB0l0B0p2D0t3IUx6B018D059Ik9_B1CAAQdRgQEPUoQBI1OFASdUhwEoVYgBKFaLAShXjAEoWI0BKFmPAShakQEPW5IBKVyUAShdlgEPXpcBKl-YAShgmQEoYZoBD2KdAStjngEvZJ8BCWWgAQlmoQEJZ6IBCWijAQlppQEJaqcBD2uoATBsqgEJbawBD26tATFvrgEJcK8BCXGwAQ9yswEyc7QBNnS1AQt1tgELdrcBC3e4AQt4uQELebsBC3q9AQ97vgE3fMABC33CAQ9-wwE4f8QBC4ABxQELgQHGAQ-CAckBOYMBygE_hAHLAQWFAcwBBYYBzQEFhwHOAQWIAc8BBYkB0QEFigHTAQ-LAdQBQIwB1gEFjQHYAQ-OAdkBQY8B2gEFkAHbAQWRAdwBD5IB3wFCkwHgAUaUAeEBBpUB4gEGlgHjAQaXAeQBBpgB5QEGmQHnAQaaAekBD5sB6gFHnAHsAQadAe4BD54B7wFInwHwAQagAfEBBqEB8gEPogH1AUmjAfYBTaQB9wEDpQH4AQOmAfkBA6cB-gEDqAH7AQOpAf0BA6oB_wEPqwGAAk6sAYICA60BhAIPrgGFAk-vAYYCA7ABhwIDsQGIAg-yAYsCULMBjAJUtAGOAlW1AY8CVbYBkgJVtwGTAlW4AZQCVbkBlgJVugGYAg-7AZkCVrwBmwJVvQGdAg--AZ4CV78BnwJVwAGgAlXBAaECD8IBpAJYwwGlAlzEAaYCCsUBpwIKxgGoAgrHAakCCsgBqgIKyQGsAgrKAa4CD8sBrwJdzAGxAgrNAbMCD84BtAJezwG1AgrQAbYCCtEBtwIP0gG6Al_TAbsCY9QBvAIC1QG9AgLWAb4CAtcBvwIC2AHAAgLZAcICAtoBxAIP2wHFAmTcAcgCAt0BygIP3gHLAmXfAc0CAuABzgIC4QHPAg_iAdICZuMB0wJs5AHVAgTlAdYCBOYB2AIE5wHZAgToAdoCBOkB3AIE6gHeAg_rAd8CbewB4QIE7QHjAg_uAeQCbu8B5QIE8AHmAgTxAecCD_IB6gJv8wHrAnM"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AnyNull: () => AnyNull2,
  AttachmentScalarFieldEnum: () => AttachmentScalarFieldEnum,
  AuditLogScalarFieldEnum: () => AuditLogScalarFieldEnum,
  CommentScalarFieldEnum: () => CommentScalarFieldEnum,
  ContactMessageScalarFieldEnum: () => ContactMessageScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  JsonNullValueInput: () => JsonNullValueInput,
  ModelName: () => ModelName,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PlatformSettingScalarFieldEnum: () => PlatformSettingScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  ProjectInvitationScalarFieldEnum: () => ProjectInvitationScalarFieldEnum,
  ProjectMemberScalarFieldEnum: () => ProjectMemberScalarFieldEnum,
  ProjectScalarFieldEnum: () => ProjectScalarFieldEnum,
  QueryMode: () => QueryMode,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  SubscriptionScalarFieldEnum: () => SubscriptionScalarFieldEnum,
  TaskScalarFieldEnum: () => TaskScalarFieldEnum,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.10.0",
  engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  Attachment: "Attachment",
  AuditLog: "AuditLog",
  Comment: "Comment",
  ContactMessage: "ContactMessage",
  Notification: "Notification",
  Payment: "Payment",
  ProjectMember: "ProjectMember",
  ProjectInvitation: "ProjectInvitation",
  Project: "Project",
  PlatformSetting: "PlatformSetting",
  Subscription: "Subscription",
  Task: "Task",
  User: "User"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var AttachmentScalarFieldEnum = {
  id: "id",
  file_name: "file_name",
  url: "url",
  public_id: "public_id",
  mime_type: "mime_type",
  size: "size",
  task_id: "task_id",
  uploaded_by_id: "uploaded_by_id",
  created_at: "created_at"
};
var AuditLogScalarFieldEnum = {
  id: "id",
  actor_id: "actor_id",
  actor_name: "actor_name",
  actor_role: "actor_role",
  action: "action",
  entity: "entity",
  entity_id: "entity_id",
  meta: "meta",
  created_at: "created_at"
};
var CommentScalarFieldEnum = {
  id: "id",
  body: "body",
  task_id: "task_id",
  author_id: "author_id",
  parent_id: "parent_id",
  created_at: "created_at",
  updated_at: "updated_at"
};
var ContactMessageScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  subject: "subject",
  message: "message",
  status: "status",
  created_at: "created_at",
  updated_at: "updated_at"
};
var NotificationScalarFieldEnum = {
  id: "id",
  type: "type",
  title: "title",
  message: "message",
  is_read: "is_read",
  link: "link",
  user_id: "user_id",
  actor_id: "actor_id",
  actor_name: "actor_name",
  created_at: "created_at"
};
var PaymentScalarFieldEnum = {
  id: "id",
  plan: "plan",
  amount: "amount",
  currency: "currency",
  status: "status",
  payment_gateway: "payment_gateway",
  transaction_id: "transaction_id",
  gateway_response: "gateway_response",
  owner_id: "owner_id",
  created_at: "created_at",
  updated_at: "updated_at"
};
var ProjectMemberScalarFieldEnum = {
  id: "id",
  project_id: "project_id",
  user_id: "user_id",
  joined_at: "joined_at",
  created_at: "created_at"
};
var ProjectInvitationScalarFieldEnum = {
  id: "id",
  email: "email",
  token: "token",
  status: "status",
  project_id: "project_id",
  invited_by_id: "invited_by_id",
  expires_at: "expires_at",
  created_at: "created_at",
  updated_at: "updated_at"
};
var ProjectScalarFieldEnum = {
  id: "id",
  name: "name",
  description: "description",
  status: "status",
  start_date: "start_date",
  end_date: "end_date",
  owner_id: "owner_id",
  created_at: "created_at",
  updated_at: "updated_at"
};
var PlatformSettingScalarFieldEnum = {
  id: "id",
  key: "key",
  value: "value",
  updated_at: "updated_at"
};
var SubscriptionScalarFieldEnum = {
  id: "id",
  plan: "plan",
  status: "status",
  current_period_end: "current_period_end",
  cancel_at_period_end: "cancel_at_period_end",
  owner_id: "owner_id",
  created_at: "created_at",
  updated_at: "updated_at"
};
var TaskScalarFieldEnum = {
  id: "id",
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  due_date: "due_date",
  labels: "labels",
  position: "position",
  project_id: "project_id",
  assignee_id: "assignee_id",
  created_by_id: "created_by_id",
  created_at: "created_at",
  updated_at: "updated_at"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  password: "password",
  google_id: "google_id",
  avatar_url: "avatar_url",
  avatar_public_id: "avatar_public_id",
  role: "role",
  provider: "provider",
  user_status: "user_status",
  is_active: "is_active",
  is_deleted: "is_deleted",
  is_verified: "is_verified",
  need_password_change: "need_password_change",
  deleted_at: "deleted_at",
  last_login_at: "last_login_at",
  created_at: "created_at",
  updated_at: "updated_at"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var JsonNullValueInput = {
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path2.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/app/utils/appError.ts
var AppError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var appError_default = AppError;

// src/app/middlewares/globalErrorHandler.ts
var { JsonWebTokenError } = jwt;
var errorHandler = async (err, _, res, __) => {
  let statusCode = status.INTERNAL_SERVER_ERROR;
  let message = "";
  let errorName = "Internal Server Error";
  let errorStack;
  if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    errorName = err.name;
    statusCode = status.BAD_REQUEST;
    message = "You have provided incorrect field type or missing fields";
    errorStack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    errorName = err.name;
    statusCode = status.BAD_REQUEST;
    errorStack = err.stack;
    if (err.code === "P2002") {
      message = "Duplicate Key Error";
    } else if (err.code === "P2003") {
      message = "Foreign key constraint failed";
    } else if (err.code === "P2025") {
      message = "An operation failed because it depends on one or more records that were required but not found.";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    errorName = err.name;
    errorStack = err.stack;
    if (err.errorCode === "P1000") {
      statusCode = status.UNAUTHORIZED;
      message = "Authentication failed against database server. Please Check Your Credentials";
    } else if (err.errorCode === "P1001") {
      statusCode = status.BAD_REQUEST;
      message = "Can't reach database server";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    errorName = err.name;
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = "Error occurred during query execution";
    errorStack = err.stack;
  } else if (err instanceof ZodError) {
    statusCode = status.BAD_REQUEST;
    errorName = "ValidationError";
    errorStack = err.stack;
    const formattedIssues = err.issues.map((issue) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "field";
      return `${fieldPath}: ${issue.message}`;
    });
    message = formattedIssues.join("; ");
  } else if (err instanceof JsonWebTokenError) {
    errorName = err.name;
    message = "Invalid Token";
    errorStack = err.stack;
    statusCode = status.BAD_REQUEST;
  } else if (err instanceof appError_default) {
    errorName = err.name;
    message = err.message;
    errorStack = err.stack;
    statusCode = err.code;
  } else if (err instanceof Error) {
    errorName = err.name;
    errorStack = err.stack;
    message = err.message;
  }
  res.status(statusCode).json({
    success: false,
    errorName,
    message,
    stack: config_default.environment === "development" ? errorStack : void 0
  });
};
var globalErrorHandler_default = errorHandler;

// src/app/middlewares/maintenance.ts
import status2 from "http-status";

// src/app/utils/catchAsync.ts
var catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// src/app/utils/jwt.ts
import jwt2 from "jsonwebtoken";
var { JsonWebTokenError: JsonWebTokenError2 } = jwt2;
var signToken = (payload, secret, expiresIn) => {
  return expiresIn ? jwt2.sign(payload, secret, { expiresIn }) : jwt2.sign(payload, secret);
};
var verifyToken = (token, secret) => {
  try {
    const decode = jwt2.verify(token, secret);
    return {
      success: true,
      message: "token verified",
      data: decode,
      error: void 0
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof JsonWebTokenError2 ? err.message : "error while verifying token",
      data: void 0,
      error: err
    };
  }
};

// src/app/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
var connectionString = `${config_default.database_url}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/app/utils/platformSettings.ts
var PLATFORM_SETTING_KEYS = [
  "maintenance_mode",
  "registration_open",
  "support_email"
];
var getPlatformSettings = async () => {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [...PLATFORM_SETTING_KEYS] } },
    select: { key: true, value: true }
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const supportEmail = values.get("support_email");
  return {
    maintenance_mode: values.get("maintenance_mode") === true,
    registration_open: values.get("registration_open") !== false,
    support_email: typeof supportEmail === "string" && supportEmail.length > 0 ? supportEmail : config_default.admin_email
  };
};

// src/app/middlewares/maintenance.ts
var peekRole = (token) => {
  if (!token) {
    return null;
  }
  let decoded = verifyToken(token, config_default.jwt_access_secret);
  if (!decoded.success) {
    decoded = verifyToken(token, config_default.jwt_refresh_secret);
  }
  return decoded.success && decoded.data ? decoded.data.role : null;
};
var maintenanceMode = catchAsync(async (req, _, next) => {
  const settings = await getPlatformSettings();
  if (!settings.maintenance_mode) {
    return next();
  }
  if (req.path.startsWith("/auth") || req.path === "/payments/webhook") {
    return next();
  }
  const bearerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization?.split(" ")[1] : req.headers.authorization;
  const token = req.cookies?.access_token ?? req.cookies?.refresh_token ?? bearerToken;
  if (peekRole(token) === "ADMIN") {
    return next();
  }
  throw new appError_default(
    status2.SERVICE_UNAVAILABLE,
    "Under maintenance. Please try again later."
  );
});
var maintenance_default = maintenanceMode;

// src/app/middlewares/notFound.ts
import httpStatus from "http-status";
var notFound = (req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: "Route not found",
    path: req.originalUrl,
    date: /* @__PURE__ */ new Date()
  });
};

// src/app/modules/admin/admin.route.ts
import { Router } from "express";

// src/app/middlewares/auth.ts
import status3 from "http-status";
var auth = (...roles) => {
  return catchAsync(async (req, _, next) => {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization?.split(" ")[1] : req.headers.authorization;
    const token = req.cookies?.access_token ?? req.cookies?.refresh_token ?? bearerToken;
    if (!token) {
      throw new appError_default(
        status3.BAD_REQUEST,
        "You are not logged in. Please log in to access this resource."
      );
    }
    let decodedData = verifyToken(token, config_default.jwt_access_secret);
    if (!decodedData.success) {
      decodedData = verifyToken(token, config_default.jwt_refresh_secret);
    }
    if (!decodedData.success || !decodedData.data) {
      throw new appError_default(status3.BAD_REQUEST, `${decodedData.message}`);
    }
    const user = await prisma.user.findUnique({
      where: {
        id: decodedData.data.id
      }
    });
    if (!user) {
      throw new appError_default(status3.NOT_FOUND, "User not found");
    }
    if (user.is_deleted) {
      throw new appError_default(status3.NOT_FOUND, "No account found.");
    }
    if (user.user_status === "SUSPENDED") {
      throw new appError_default(
        status3.UNAUTHORIZED,
        "Your account is suspended. please contact support"
      );
    }
    if (!user.is_active) {
      throw new appError_default(status3.BAD_REQUEST, "Your account is inactive.");
    }
    if (!user.is_verified) {
      throw new appError_default(
        status3.BAD_REQUEST,
        "Your account is not verified. Please verify your account to access this resource."
      );
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new appError_default(status3.UNAUTHORIZED, "You are unauthorized");
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  });
};
var auth_default = auth;

// src/app/middlewares/validateRequest.ts
var validateRequest = (schema) => {
  return catchAsync((req, _, next) => {
    const payload = req.body;
    const result = schema.parse(payload);
    req.body = result;
    next();
  });
};
var validateRequest_default = validateRequest;

// src/app/utils/sendResponse.ts
import status4 from "http-status";
var sendResponse = (res, payload) => {
  const responseStatus = payload.status ? payload.status : status4.OK;
  const responseSuccess = payload.success ? payload.success : true;
  const responseData = payload.data ? payload.data : void 0;
  const responseMeta = payload.meta ? payload.meta : void 0;
  res.status(responseStatus).json({
    success: responseSuccess,
    message: payload.message,
    data: responseData,
    meta: responseMeta
  });
};
var sendResponse_default = sendResponse;

// src/app/modules/admin/admin.service.ts
import status8 from "http-status";

// src/app/utils/audit.ts
var recordAudit = async (input) => {
  try {
    let actorName = input.actor?.name ?? null;
    if (input.actor && !actorName) {
      const actor = await prisma.user.findUnique({
        where: { id: input.actor.id },
        select: { name: true }
      });
      actorName = actor?.name ?? null;
    }
    await prisma.auditLog.create({
      data: {
        actor_id: input.actor?.id ?? null,
        actor_name: actorName,
        actor_role: input.actor?.role ?? null,
        action: input.action,
        entity: input.entity,
        entity_id: input.entityId ?? null,
        ...input.meta === void 0 ? {} : { meta: input.meta }
      }
    });
  } catch (error) {
    console.log("Audit log could not be written", error);
  }
};
var audit_default = recordAudit;

// src/app/modules/payment/payment.service.ts
import path4 from "path";
import ejs from "ejs";
import status7 from "http-status";

// src/app/lib/nodeMailer.ts
import path3 from "path";
import nodeMailer from "nodemailer";
var transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: config_default.email_sender,
    pass: config_default.google_app_password
  }
});
var brandLogoAttachment = {
  filename: "brand-logo.png",
  path: path3.resolve(process.cwd(), "public", "brand-logo.png"),
  cid: "brand-logo"
};
var nodeMailer_default = transporter;

// src/app/utils/payment.ts
import status5 from "http-status";

// src/app/lib/stripe.ts
import { Stripe } from "stripe";
var stripeSecretKey = config_default.stripe_secret_key;
if (!stripeSecretKey) {
  throw new appError_default(404, "Stripe secret key missing");
}
var stripe = new Stripe(stripeSecretKey);
var stripe_default = stripe;

// src/app/utils/payment.ts
var createStripeCheckoutSession = async (params) => {
  return await stripe_default.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId, plan: params.plan },
    subscription_data: {
      metadata: { userId: params.userId, plan: params.plan }
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.unitAmount,
          recurring: { interval: "month" },
          product_data: { name: `${params.planLabel} plan (monthly)` }
        }
      }
    ]
  });
};
var retrieveStripeSession = async (sessionId) => {
  return await stripe_default.checkout.sessions.retrieve(sessionId);
};
var retrieveStripeSubscription = async (subscriptionId) => {
  return await stripe_default.subscriptions.retrieve(subscriptionId);
};
var verifyStripeSignature = (rawBody, signature) => {
  if (!signature) {
    throw new appError_default(status5.BAD_REQUEST, "Missing Stripe signature header");
  }
  try {
    return stripe_default.webhooks.constructEvent(
      rawBody,
      signature,
      config_default.stripe_webhook_secret
    );
  } catch {
    throw new appError_default(status5.BAD_REQUEST, "Invalid Stripe webhook signature");
  }
};

// src/app/modules/notification/notification.service.ts
import status6 from "http-status";

// src/app/lib/redis.ts
import { createClient } from "redis";
var redisClient = createClient({
  username: config_default.redis_username,
  password: config_default.redis_password,
  // Keep-alive PING so long-lived idle connections stay alive.
  pingInterval: 3e4,
  socket: {
    host: config_default.redis_host,
    port: Number(config_default.redis_port),
    connectTimeout: 1e4,
    keepAlive: true,
    keepAliveInitialDelay: 5e3,
    // Never give up: back off to at most 5s between attempts.
    reconnectStrategy: (retries) => Math.min(retries * 200, 5e3)
  }
});
redisClient.on("error", (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[redis] client error: ${message}`);
});
redisClient.on("connect", () => {
  console.log("[redis] connecting...");
});
redisClient.on("ready", () => {
  console.log("[redis] connection ready");
});
redisClient.on("reconnecting", () => {
  console.warn("[redis] reconnecting...");
});
redisClient.on("end", () => {
  console.warn("[redis] connection closed");
});
var redis_default = redisClient;

// src/app/modules/notification/notification.service.ts
var DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1e3;
var SWEEP_LOCK_TTL_SECONDS = 60 * 60;
var DEFAULT_PAGE_LIMIT = 20;
var notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  is_read: true,
  link: true,
  actor_id: true,
  actor_name: true,
  created_at: true
};
var createNotification = async (payload) => {
  return await prisma.notification.create({
    data: payload,
    select: notificationSelect
  });
};
var runDeadlineSweep = async (userId) => {
  const now = /* @__PURE__ */ new Date();
  const hourKey = `${now.toISOString().slice(0, 10)}-${String(now.getUTCHours()).padStart(2, "0")}`;
  const sweepKey = `deadline-sweep:${userId}:${hourKey}`;
  let shouldSweep = true;
  try {
    const lock = await redis_default.set(sweepKey, "1", {
      NX: true,
      EX: SWEEP_LOCK_TTL_SECONDS
    });
    shouldSweep = lock === "OK";
  } catch {
    shouldSweep = true;
  }
  if (!shouldSweep) {
    return;
  }
  try {
    const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MS);
    const tasks = await prisma.task.findMany({
      where: {
        assignee_id: userId,
        status: { not: TaskStatus.DONE },
        due_date: { gte: now, lte: windowEnd }
      },
      select: { id: true, title: true }
    });
    if (tasks.length === 0) {
      return;
    }
    const links = tasks.map((task) => `/dashboard/tasks/${task.id}`);
    const existing = await prisma.notification.findMany({
      where: {
        user_id: userId,
        type: NotificationType.DEADLINE_APPROACHING,
        link: { in: links }
      },
      select: { link: true }
    });
    const existingLinks = new Set(existing.map((row) => row.link));
    const rows = tasks.filter((task) => !existingLinks.has(`/dashboard/tasks/${task.id}`)).map((task) => ({
      user_id: userId,
      type: NotificationType.DEADLINE_APPROACHING,
      title: "Deadline approaching",
      message: `Task "${task.title}" is due within the next 24 hours`,
      link: `/dashboard/tasks/${task.id}`,
      actor_id: null,
      actor_name: null
    }));
    if (rows.length > 0) {
      await prisma.notification.createMany({ data: rows });
    }
  } catch {
  }
};
var getNotifications = async (user, query) => {
  await runDeadlineSweep(user.id);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1);
  const skip = (page - 1) * limit;
  const unreadOnly = query.unreadOnly === "true";
  const where = {
    user_id: user.id,
    ...unreadOnly ? { is_read: false } : {}
  };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: [{ created_at: "desc" }],
      skip,
      take: limit
    }),
    prisma.notification.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: notifications, meta };
};
var markAsRead = async (user, notificationId) => {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, user_id: user.id },
    data: { is_read: true }
  });
  if (result.count === 0) {
    throw new appError_default(status6.NOT_FOUND, "Notification not found");
  }
  return { id: notificationId, is_read: true };
};
var markAllRead = async (user) => {
  const result = await prisma.notification.updateMany({
    where: { user_id: user.id, is_read: false },
    data: { is_read: true }
  });
  return { updated: result.count };
};
var getUnreadCount = async (user) => {
  const count = await prisma.notification.count({
    where: { user_id: user.id, is_read: false }
  });
  return { unreadCount: count };
};
var NotificationService = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount
};

// src/app/modules/payment/payment.service.ts
var PLANS = {
  [Plan.FREE]: { label: "Free", price: 0, projects: 2, members: 3 },
  [Plan.PRO]: { label: "Pro", price: 12, projects: 15, members: 15 },
  [Plan.BUSINESS]: {
    label: "Business",
    price: 29,
    projects: null,
    members: null
  }
};
var MONTHLY_PERIOD_MS = 30 * 24 * 60 * 60 * 1e3;
var ALLOWED_SORT_FIELDS = ["created_at", "amount", "plan", "status"];
var paymentSelect = {
  id: true,
  plan: true,
  amount: true,
  currency: true,
  status: true,
  payment_gateway: true,
  transaction_id: true,
  created_at: true,
  updated_at: true,
  owner: { select: { id: true, name: true, email: true } }
};
var subscriptionSelect = {
  id: true,
  plan: true,
  status: true,
  current_period_end: true,
  cancel_at_period_end: true,
  created_at: true,
  updated_at: true
};
var parsePlan = (value) => {
  if (!value) {
    return null;
  }
  return Object.values(Plan).includes(value) ? value : null;
};
var findLatestSubscription = async (ownerId) => {
  return await prisma.subscription.findFirst({
    where: { owner_id: ownerId },
    orderBy: { created_at: "desc" },
    select: subscriptionSelect
  });
};
var isLiveSubscription = (subscription) => {
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    return false;
  }
  return subscription.current_period_end === null || subscription.current_period_end.getTime() > Date.now();
};
var getPlans = async () => {
  return Object.values(Plan).map((plan) => ({
    plan,
    ...PLANS[plan]
  }));
};
var getMySubscription = async (user) => {
  const subscription = await findLatestSubscription(user.id);
  const plan = isLiveSubscription(subscription) ? subscription?.plan ?? Plan.FREE : Plan.FREE;
  const definition = PLANS[plan];
  const [activeProjects, memberCount] = await Promise.all([
    prisma.project.count({
      where: { owner_id: user.id, status: { not: ProjectStatus.ARCHIVED } }
    }),
    prisma.projectMember.count({
      where: { project: { owner_id: user.id } }
    })
  ]);
  return {
    plan,
    label: definition.label,
    price: definition.price,
    status: subscription?.status ?? null,
    current_period_end: subscription?.current_period_end ?? null,
    cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
    limits: { projects: definition.projects, members: definition.members },
    usage: { projects: activeProjects, members: memberCount }
  };
};
var createCheckoutSession = async (user, payload) => {
  const plan = parsePlan(payload.plan) ?? Plan.FREE;
  if (plan === Plan.FREE) {
    throw new appError_default(
      status7.BAD_REQUEST,
      "Only the PRO and BUSINESS plans can be purchased"
    );
  }
  const definition = PLANS[plan];
  const sessionParams = {
    customerEmail: user.email,
    userId: user.id,
    plan,
    unitAmount: Math.round(definition.price * 100),
    planLabel: definition.label,
    successUrl: `${config_default.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${config_default.frontend_url}/payment/cancel`
  };
  const session = await createStripeCheckoutSession(sessionParams);
  await prisma.payment.create({
    data: {
      plan,
      amount: definition.price,
      currency: "USD",
      status: PaymentStatus.PENDING,
      payment_gateway: PaymentGateway.STRIPE,
      transaction_id: session.id,
      owner_id: user.id
    }
  });
  if (!session.url) {
    throw new appError_default(
      status7.BAD_GATEWAY,
      "Stripe did not return a checkout url"
    );
  }
  return { url: session.url, plan, amount: definition.price };
};
var stripeSubscriptionIdOf = (session) => {
  const subscription = session.subscription;
  if (!subscription) {
    return null;
  }
  return typeof subscription === "string" ? subscription : subscription.id;
};
var resolvePeriodEnd = async (session) => {
  const subscriptionId = stripeSubscriptionIdOf(session);
  if (subscriptionId) {
    try {
      const subscription = await retrieveStripeSubscription(subscriptionId);
      const periodEnd = subscription.items.data[0]?.current_period_end;
      if (periodEnd) {
        return new Date(periodEnd * 1e3);
      }
    } catch {
    }
  }
  return new Date(Date.now() + MONTHLY_PERIOD_MS);
};
var sendReceiptEmail = async (recipient, plan, amount, currency, transactionId, renewalDate) => {
  const filePath = path4.join(
    process.cwd(),
    "/src/app/templates/payment-success.ejs"
  );
  const html = await ejs.renderFile(filePath, {
    name: recipient.name,
    planLabel: PLANS[plan].label,
    amount: amount.toFixed(2),
    currency: currency.toUpperCase(),
    transactionId,
    renewalDate: renewalDate ? renewalDate.toDateString() : "\u2014"
  });
  try {
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: recipient.email,
      subject: `Your TaskFlow ${PLANS[plan].label} plan is active`,
      html,
      attachments: [brandLogoAttachment]
    });
  } catch (error) {
    console.log("Payment receipt email could not be sent", error);
    if (config_default.environment !== "development") {
      throw new appError_default(
        status7.BAD_GATEWAY,
        "Receipt email could not be sent. please try again later"
      );
    }
  }
};
var announceActivation = async (ownerId, plan, amount, currency, transactionId, renewalDate) => {
  const definition = PLANS[plan];
  try {
    await NotificationService.createNotification({
      user_id: ownerId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: "Payment successful",
      message: `Your ${definition.label} plan is active \u2014 $${amount.toFixed(2)} ${currency.toUpperCase()} paid.`,
      link: "/billing",
      actor_id: null,
      actor_name: null
    });
  } catch (error) {
    console.log("Payment notification could not be created", error);
  }
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { name: true, email: true, role: true }
  });
  if (!owner) {
    return;
  }
  await audit_default({
    actor: { id: ownerId, name: owner.name, role: owner.role },
    action: "payment.success",
    entity: "payment",
    entityId: transactionId,
    meta: { plan, amount, currency }
  });
  await sendReceiptEmail(
    owner,
    plan,
    amount,
    currency,
    transactionId,
    renewalDate
  );
};
var activateSubscription = async (session) => {
  const transactionId = session.id;
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { transaction_id: transactionId }
    });
    if (!payment) {
      throw new appError_default(
        status7.NOT_FOUND,
        "No pending payment matches this checkout session"
      );
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      return { payment, activated: false, renewalDate: null };
    }
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.SUCCESS,
        gateway_response: {
          session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          subscription_id: stripeSubscriptionIdOf(session)
        }
      }
    });
    if (claimed.count === 0) {
      const settled2 = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id }
      });
      return { payment: settled2, activated: false, renewalDate: null };
    }
    const purchasedPlan = parsePlan(session.metadata?.plan) ?? payment.plan;
    const renewalDate = await resolvePeriodEnd(session);
    const existing = await tx.subscription.findFirst({
      where: { owner_id: payment.owner_id },
      orderBy: { created_at: "asc" }
    });
    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          plan: purchasedPlan,
          status: SubscriptionStatus.ACTIVE,
          current_period_end: renewalDate,
          cancel_at_period_end: false
        }
      });
    } else {
      await tx.subscription.create({
        data: {
          owner_id: payment.owner_id,
          plan: purchasedPlan,
          status: SubscriptionStatus.ACTIVE,
          current_period_end: renewalDate
        }
      });
    }
    const settled = await tx.payment.findUniqueOrThrow({
      where: { id: payment.id }
    });
    return { payment: settled, activated: true, renewalDate };
  });
  if (result.activated) {
    await announceActivation(
      result.payment.owner_id,
      result.payment.plan,
      result.payment.amount,
      result.payment.currency,
      result.payment.transaction_id ?? session.id,
      result.renewalDate
    );
  }
  return result;
};
var verifyPayment = async (user, sessionId) => {
  const payment = await prisma.payment.findFirst({
    where: { transaction_id: sessionId }
  });
  if (payment && payment.owner_id !== user.id) {
    throw new appError_default(
      status7.FORBIDDEN,
      "This checkout session belongs to another account"
    );
  }
  if (payment && payment.status === PaymentStatus.SUCCESS) {
    return {
      plan: payment.plan,
      amount: payment.amount,
      transactionId: payment.transaction_id,
      status: payment.status
    };
  }
  const session = await retrieveStripeSession(sessionId).catch(() => {
    throw new appError_default(status7.BAD_REQUEST, "Invalid checkout session id");
  });
  if (!payment) {
    throw new appError_default(status7.NOT_FOUND, "Payment not found");
  }
  if (session.payment_status !== "paid") {
    throw new appError_default(status7.BAD_REQUEST, "Payment is not complete yet");
  }
  const { payment: settled } = await activateSubscription(session);
  return {
    plan: settled.plan,
    amount: settled.amount,
    transactionId: settled.transaction_id,
    status: settled.status
  };
};
var extendRenewal = async (invoice) => {
  if (invoice.billing_reason === "subscription_create") {
    return;
  }
  const userId = invoice.parent?.subscription_details?.metadata?.userId;
  if (!userId) {
    console.log("invoice.paid without a userId in subscription metadata");
    return;
  }
  const subscription = await prisma.subscription.findFirst({
    where: { owner_id: userId },
    orderBy: { created_at: "desc" },
    select: subscriptionSelect
  });
  if (!subscription) {
    return;
  }
  const currentEnd = subscription.current_period_end && subscription.current_period_end.getTime() > Date.now() ? subscription.current_period_end.getTime() : Date.now();
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: subscription.plan,
      status: SubscriptionStatus.ACTIVE,
      current_period_end: new Date(currentEnd + MONTHLY_PERIOD_MS),
      cancel_at_period_end: false
    }
  });
};
var handleSubscriptionDeleted = async (stripeSubscription) => {
  const userId = stripeSubscription.metadata?.userId;
  if (!userId) {
    console.log("customer.subscription.deleted without a userId in metadata");
    return;
  }
  const subscription = await prisma.subscription.findFirst({
    where: { owner_id: userId },
    orderBy: { created_at: "desc" },
    select: subscriptionSelect
  });
  if (!subscription) {
    return;
  }
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: Plan.FREE,
      status: SubscriptionStatus.EXPIRED,
      cancel_at_period_end: false
    }
  });
};
var handleWebhook = async (rawBody, signature) => {
  const event = verifyStripeSignature(rawBody, signature);
  switch (event.type) {
    case "checkout.session.completed": {
      try {
        await activateSubscription(event.data.object);
      } catch (error) {
        console.log("checkout.session.completed could not activate", error);
      }
      break;
    }
    case "invoice.paid": {
      try {
        await extendRenewal(event.data.object);
      } catch (error) {
        console.log("invoice.paid could not extend the renewal", error);
      }
      break;
    }
    case "customer.subscription.deleted": {
      try {
        await handleSubscriptionDeleted(event.data.object);
      } catch (error) {
        console.log("customer.subscription.deleted could not downgrade", error);
      }
      break;
    }
    default:
      console.log(`Ignoring unhandled Stripe event type "${event.type}"`);
  }
  return { received: true };
};
var assertEnumFilter = (value, allowed, field) => {
  if (!value) {
    return void 0;
  }
  if (!allowed.includes(value)) {
    throw new appError_default(status7.BAD_REQUEST, `Invalid ${field} filter`);
  }
  return value;
};
var listPayments = async (baseWhere, query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy;
  const sortField = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const paymentStatus = assertEnumFilter(
    query.status,
    Object.values(PaymentStatus),
    "status"
  );
  const plan = assertEnumFilter(query.plan, Object.values(Plan), "plan");
  const where = {
    AND: [
      baseWhere,
      ...paymentStatus ? [{ status: paymentStatus }] : [],
      ...plan ? [{ plan }] : []
    ]
  };
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: paymentSelect,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit
    }),
    prisma.payment.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: payments, meta };
};
var getPaymentHistory = async (user, query) => {
  return await listPayments({ owner_id: user.id }, query);
};
var getAllPayments = async (query) => {
  return await listPayments({}, query);
};
var PaymentService = {
  getPlans,
  getMySubscription,
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getAllPayments,
  // shared with Phase 6's billing views
  PLANS
};

// src/app/modules/admin/admin.service.ts
var DEFAULT_PAGE_LIMIT2 = 10;
var DEFAULT_ADMIN_EMAIL = "admin@taskflow.dev";
var TOP_PROJECT_LIMIT = 5;
var PROTECTED_ADMIN_EMAILS = [config_default.admin_email, DEFAULT_ADMIN_EMAIL].filter(
  (value) => typeof value === "string" && value.length > 0
);
var isProtectedAdmin = (email) => PROTECTED_ADMIN_EMAILS.some(
  (candidate) => candidate.toLowerCase() === email.toLowerCase()
);
var USER_SORT_FIELDS = [
  "name",
  "email",
  "created_at",
  "last_login_at",
  "role",
  "user_status"
];
var PROJECT_SORT_FIELDS = [
  "name",
  "start_date",
  "end_date",
  "created_at"
];
var adminUserSelect = {
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
  _count: { select: { owned_projects: true, assigned_tasks: true } }
};
var adminProjectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  start_date: true,
  end_date: true,
  owner_id: true,
  created_at: true,
  updated_at: true,
  owner: {
    select: { id: true, name: true, email: true, avatar_url: true, role: true }
  },
  _count: { select: { tasks: true, members: true } }
};
var resolveSort = (sortBy, allowed, fallback) => sortBy && allowed.includes(sortBy) ? sortBy : fallback;
var parsePage = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT2, 1);
  return { page, limit, skip: (page - 1) * limit };
};
var listUsers = async (query) => {
  const { page, limit, skip } = parsePage(query);
  const sortField = resolveSort(
    query.sortBy,
    USER_SORT_FIELDS,
    "created_at"
  );
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const search = typeof query.search === "string" ? query.search : void 0;
  const roleFilter = typeof query.role === "string" ? query.role : void 0;
  const statusFilter = typeof query.user_status === "string" ? query.user_status : typeof query.status === "string" ? query.status : void 0;
  const andConditions = [{ is_deleted: false }];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (roleFilter && Object.values(Role).includes(roleFilter)) {
    andConditions.push({ role: roleFilter });
  }
  if (statusFilter && Object.values(UserStatus).includes(statusFilter)) {
    andConditions.push({ user_status: statusFilter });
  }
  const where = { AND: andConditions };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);
  return {
    data: users,
    meta: {
      page,
      limit,
      dataCount: total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};
var findUserOrThrow = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.is_deleted) {
    throw new appError_default(status8.NOT_FOUND, "User not found");
  }
  return user;
};
var setUserStatus = async (actor, userId, payload) => {
  const target = await findUserOrThrow(userId);
  if (isProtectedAdmin(target.email)) {
    throw new appError_default(
      status8.FORBIDDEN,
      "The primary admin account can't be suspended"
    );
  }
  if (target.id === actor.id) {
    throw new appError_default(
      status8.BAD_REQUEST,
      "You can't change the status of your own account"
    );
  }
  const suspended = payload.user_status === UserStatus.SUSPENDED;
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      user_status: payload.user_status,
      is_active: !suspended
    },
    omit: { password: true }
  });
  await audit_default({
    actor,
    action: suspended ? "user.suspended" : "user.activated",
    entity: "user",
    entityId: target.id,
    meta: { email: target.email, previous_status: target.user_status }
  });
  return updated;
};
var changeUserRole = async (actor, userId, payload) => {
  const target = await findUserOrThrow(userId);
  if (isProtectedAdmin(target.email) && payload.role !== Role.ADMIN) {
    throw new appError_default(
      status8.FORBIDDEN,
      "The primary admin account must stay an admin"
    );
  }
  if (target.id === actor.id && payload.role !== Role.ADMIN) {
    throw new appError_default(status8.BAD_REQUEST, "You can't change your own role");
  }
  if (target.role === payload.role) {
    return {
      id: target.id,
      role: target.role,
      unchanged: true
    };
  }
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: payload.role },
    omit: { password: true }
  });
  await audit_default({
    actor,
    action: "user.role_changed",
    entity: "user",
    entityId: target.id,
    meta: { email: target.email, from: target.role, to: payload.role }
  });
  return updated;
};
var allProjects = async (query) => {
  const { page, limit, skip } = parsePage(query);
  const sortField = resolveSort(
    query.sortBy,
    PROJECT_SORT_FIELDS,
    "created_at"
  );
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const search = typeof query.search === "string" ? query.search : void 0;
  const ownerName = typeof query.ownerName === "string" ? query.ownerName : void 0;
  const statusFilter = typeof query.status === "string" ? query.status : void 0;
  const andConditions = [];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (ownerName) {
    andConditions.push({
      owner: { name: { contains: ownerName, mode: "insensitive" } }
    });
  }
  if (statusFilter) {
    if (!Object.values(ProjectStatus).includes(statusFilter)) {
      throw new appError_default(status8.BAD_REQUEST, "Invalid project status filter");
    }
    andConditions.push({ status: statusFilter });
  }
  const where = { AND: andConditions };
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: adminProjectSelect,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit
    }),
    prisma.project.count({ where })
  ]);
  return {
    data: projects,
    meta: {
      page,
      limit,
      dataCount: total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};
var deleteAnyProject = async (actor, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, owner_id: true }
  });
  if (!project) {
    throw new appError_default(status8.NOT_FOUND, "Project not found");
  }
  await prisma.project.delete({ where: { id: project.id } });
  await audit_default({
    actor,
    action: "project.deleted",
    entity: "project",
    entityId: project.id,
    meta: { name: project.name, owner_id: project.owner_id }
  });
  return { id: project.id, name: project.name };
};
var allPayments = async (query) => {
  return await PaymentService.getAllPayments(query);
};
var getReports = async (query) => {
  const { page, limit, skip } = parsePage(query);
  const actionFilter = typeof query.action === "string" ? query.action : void 0;
  const entityFilter = typeof query.entity === "string" ? query.entity : void 0;
  const andConditions = [];
  if (actionFilter) {
    andConditions.push({
      action: { contains: actionFilter, mode: "insensitive" }
    });
  }
  if (entityFilter) {
    andConditions.push({
      entity: { equals: entityFilter, mode: "insensitive" }
    });
  }
  const where = { AND: andConditions };
  const [logs, logCount, users, projects, tasks, payments, topProjects] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where }),
    prisma.user.count({ where: { is_deleted: false } }),
    prisma.project.count(),
    prisma.task.count(),
    prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.project.findMany({
      orderBy: { tasks: { _count: "desc" } },
      take: TOP_PROJECT_LIMIT,
      select: adminProjectSelect
    })
  ]);
  return {
    auditLogs: {
      data: logs,
      meta: {
        page,
        limit,
        dataCount: logCount,
        totalPages: Math.ceil(logCount / limit) || 1
      }
    },
    totals: { users, projects, tasks, payments },
    topProjects
  };
};
var getSettings = async () => {
  return await getPlatformSettings();
};
var updateSettings = async (actor, payload) => {
  const changes = [];
  if (payload.maintenance_mode !== void 0) {
    changes.push({ key: "maintenance_mode", value: payload.maintenance_mode });
  }
  if (payload.registration_open !== void 0) {
    changes.push({
      key: "registration_open",
      value: payload.registration_open
    });
  }
  if (payload.support_email !== void 0) {
    changes.push({ key: "support_email", value: payload.support_email });
  }
  for (const change of changes) {
    await prisma.platformSetting.upsert({
      where: { key: change.key },
      update: { value: change.value },
      create: { key: change.key, value: change.value }
    });
  }
  await audit_default({
    actor,
    action: "settings.updated",
    entity: "platform_setting",
    meta: {
      updated: changes.map((change) => change.key)
    }
  });
  return await getSettings();
};
var AdminService = {
  listUsers,
  setUserStatus,
  changeUserRole,
  allProjects,
  deleteAnyProject,
  allPayments,
  getReports,
  getSettings,
  updateSettings
};

// src/app/modules/admin/admin.controller.ts
var pathParam = (value) => value;
var listUsers2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await AdminService.listUsers(query);
  sendResponse_default(res, {
    message: "Users fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var setUserStatus2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AdminService.setUserStatus(
    user,
    pathParam(req.params.id),
    req.body
  );
  sendResponse_default(res, {
    message: "User status updated Successfully",
    data: result
  });
});
var changeUserRole2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AdminService.changeUserRole(
    user,
    pathParam(req.params.id),
    req.body
  );
  sendResponse_default(res, {
    message: "User role updated Successfully",
    data: result
  });
});
var allProjects2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await AdminService.allProjects(query);
  sendResponse_default(res, {
    message: "Projects fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var deleteAnyProject2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AdminService.deleteAnyProject(
    user,
    pathParam(req.params.id)
  );
  sendResponse_default(res, {
    message: "Project deleted Successfully",
    data: result
  });
});
var allPayments2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await AdminService.allPayments(query);
  sendResponse_default(res, {
    message: "Payments fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var getReports2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await AdminService.getReports(query);
  sendResponse_default(res, {
    message: "Reports fetched Successfully",
    data: result
  });
});
var getSettings2 = catchAsync(async (_, res) => {
  const result = await AdminService.getSettings();
  sendResponse_default(res, {
    message: "Settings fetched Successfully",
    data: result
  });
});
var updateSettings2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AdminService.updateSettings(user, req.body);
  sendResponse_default(res, {
    message: "Settings updated Successfully",
    data: result
  });
});
var AdminController = {
  listUsers: listUsers2,
  setUserStatus: setUserStatus2,
  changeUserRole: changeUserRole2,
  allProjects: allProjects2,
  deleteAnyProject: deleteAnyProject2,
  allPayments: allPayments2,
  getReports: getReports2,
  getSettings: getSettings2,
  updateSettings: updateSettings2
};

// src/app/modules/admin/admin.schema.ts
import z from "zod";
var updateUserStatusSchema = z.object(
  {
    user_status: z.enum(UserStatus, {
      error: "user_status must be ACTIVE or SUSPENDED"
    })
  },
  "Please provide a valid object"
);
var updateUserRoleSchema = z.object(
  {
    role: z.enum(Role, {
      error: "role must be ADMIN, PROJECT_MANAGER, TEAM_MEMBER or CLIENT"
    })
  },
  "Please provide a valid object"
);
var updateSettingsSchema = z.object(
  {
    maintenance_mode: z.boolean().optional(),
    registration_open: z.boolean().optional(),
    support_email: z.email("Invalid email format").optional()
  },
  "Please provide a valid object"
).refine(
  (payload) => payload.maintenance_mode !== void 0 || payload.registration_open !== void 0 || payload.support_email !== void 0,
  { message: "Provide at least one setting to update" }
);

// src/app/modules/admin/admin.route.ts
var router = Router();
router.get("/users", auth_default(Role.ADMIN), AdminController.listUsers);
router.patch(
  "/users/:id/status",
  auth_default(Role.ADMIN),
  validateRequest_default(updateUserStatusSchema),
  AdminController.setUserStatus
);
router.patch(
  "/users/:id/role",
  auth_default(Role.ADMIN),
  validateRequest_default(updateUserRoleSchema),
  AdminController.changeUserRole
);
router.get("/projects", auth_default(Role.ADMIN), AdminController.allProjects);
router.delete(
  "/projects/:id",
  auth_default(Role.ADMIN),
  AdminController.deleteAnyProject
);
router.get("/payments", auth_default(Role.ADMIN), AdminController.allPayments);
router.get("/reports", auth_default(Role.ADMIN), AdminController.getReports);
router.get("/settings", auth_default(Role.ADMIN), AdminController.getSettings);
router.patch(
  "/settings",
  auth_default(Role.ADMIN),
  validateRequest_default(updateSettingsSchema),
  AdminController.updateSettings
);
var AdminRoutes = router;

// src/app/modules/analytics/analytics.route.ts
import { Router as Router2 } from "express";

// src/app/modules/analytics/analytics.service.ts
import status9 from "http-status";
var MONTH_BUCKET_COUNT = 12;
var WEEK_BUCKET_COUNT = 8;
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
var round2 = (value) => Math.round(value * 100) / 100;
var formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
var monthKey = (date) => formatDate(date).slice(0, 7);
var lastMonthKeys = (count) => {
  const now = /* @__PURE__ */ new Date();
  const keys = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(
      monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1))
    );
  }
  return keys;
};
var lastWeekStarts = (count) => {
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const starts = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    starts.push(new Date(today.getTime() - offset * WEEK_MS));
  }
  return starts;
};
var countTasksByStatus = async (taskWhere) => {
  const groups = await prisma.task.groupBy({
    by: ["status"],
    where: taskWhere,
    _count: { _all: true }
  });
  const counts = new Map(
    groups.map((group) => [group.status, group._count._all])
  );
  return Object.values(TaskStatus).map((taskStatus) => ({
    status: taskStatus,
    count: counts.get(taskStatus) ?? 0
  }));
};
var countProjectsByStatus = async (projectWhere) => {
  const groups = await prisma.project.groupBy({
    by: ["status"],
    where: projectWhere,
    _count: { _all: true }
  });
  const counts = new Map(
    groups.map((group) => [group.status, group._count._all])
  );
  return Object.values(ProjectStatus).map((projectStatus) => ({
    status: projectStatus,
    count: counts.get(projectStatus) ?? 0
  }));
};
var completionRateOf = (tasksByStatus) => {
  const total = tasksByStatus.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return 0;
  }
  const done = tasksByStatus.find((row) => row.status === TaskStatus.DONE)?.count ?? 0;
  return round2(done / total);
};
var buildWorkload = async (taskWhere, memberWhere) => {
  const [openGroups, memberships] = await Promise.all([
    prisma.task.groupBy({
      by: ["assignee_id"],
      where: {
        ...taskWhere,
        status: { not: TaskStatus.DONE },
        assignee_id: { not: null }
      },
      _count: { _all: true }
    }),
    prisma.projectMember.findMany({
      where: memberWhere,
      distinct: ["user_id"],
      select: { user_id: true }
    })
  ]);
  const openByUser = /* @__PURE__ */ new Map();
  const userIds = /* @__PURE__ */ new Set();
  for (const group of openGroups) {
    if (!group.assignee_id) {
      continue;
    }
    openByUser.set(group.assignee_id, group._count._all);
    userIds.add(group.assignee_id);
  }
  for (const membership of memberships) {
    userIds.add(membership.user_id);
  }
  if (userIds.size === 0) {
    return [];
  }
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, name: true, avatar_url: true }
  });
  return users.map((user) => ({
    ...user,
    openTasks: openByUser.get(user.id) ?? 0
  })).sort((a, b) => b.openTasks - a.openTasks || a.name.localeCompare(b.name));
};
var buildOverdueTrend = async (taskWhere) => {
  const starts = lastWeekStarts(WEEK_BUCKET_COUNT);
  const windowStart = starts[0] ?? /* @__PURE__ */ new Date();
  const buckets = starts.map((start) => ({
    week: formatDate(start),
    overdue: 0
  }));
  const overdueTasks = await prisma.task.findMany({
    where: {
      ...taskWhere,
      status: { not: TaskStatus.DONE },
      due_date: { not: null, gte: windowStart, lt: /* @__PURE__ */ new Date() }
    },
    select: { due_date: true }
  });
  for (const task of overdueTasks) {
    if (!task.due_date) {
      continue;
    }
    const index = Math.floor(
      (task.due_date.getTime() - windowStart.getTime()) / WEEK_MS
    );
    const bucket = buckets[Math.min(Math.max(index, 0), buckets.length - 1)] ?? buckets[0];
    if (bucket) {
      bucket.overdue += 1;
    }
  }
  return buckets;
};
var getAdminAnalytics = async () => {
  const now = /* @__PURE__ */ new Date();
  const monthKeys = lastMonthKeys(MONTH_BUCKET_COUNT);
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth() - (MONTH_BUCKET_COUNT - 1),
    1
  );
  const [
    totalUsers,
    activeProjects,
    totalTasks,
    liveSubscriptions,
    successPayments,
    signups,
    tasksByStatus
  ] = await Promise.all([
    prisma.user.count({ where: { is_deleted: false } }),
    prisma.project.count({
      where: { status: { not: ProjectStatus.ARCHIVED } }
    }),
    prisma.task.count(),
    // MRR = list price of every plan that is both ACTIVE and inside its paid period
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        plan: { in: [Plan.PRO, Plan.BUSINESS] },
        OR: [{ current_period_end: null }, { current_period_end: { gt: now } }]
      },
      select: { plan: true }
    }),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
        created_at: { gte: windowStart }
      },
      select: { amount: true, created_at: true }
    }),
    prisma.user.findMany({
      where: { created_at: { gte: windowStart } },
      select: { created_at: true }
    }),
    countTasksByStatus({})
  ]);
  const mrr = liveSubscriptions.reduce(
    (sum, subscription) => sum + PaymentService.PLANS[subscription.plan].price,
    0
  );
  const revenueByMonth = new Map(
    monthKeys.map((month) => [month, { revenue: 0, payments: 0 }])
  );
  for (const payment of successPayments) {
    const bucket = revenueByMonth.get(monthKey(payment.created_at));
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + payment.amount);
      bucket.payments += 1;
    }
  }
  const signupsByMonth = new Map(
    monthKeys.map((month) => [month, 0])
  );
  for (const signup of signups) {
    const month = monthKey(signup.created_at);
    const bucket = signupsByMonth.get(month);
    if (bucket !== void 0) {
      signupsByMonth.set(month, bucket + 1);
    }
  }
  return {
    totals: {
      users: totalUsers,
      activeProjects,
      tasks: totalTasks,
      paidSubscriptions: liveSubscriptions.length,
      mrr
    },
    monthlyRevenue: monthKeys.map((month) => ({
      month,
      ...revenueByMonth.get(month) ?? { revenue: 0, payments: 0 }
    })),
    monthlySignups: monthKeys.map((month) => ({
      month,
      signups: signupsByMonth.get(month) ?? 0
    })),
    tasksByStatus
  };
};
var getManagerAnalytics = async (user) => {
  const ownerWhere = { owner_id: user.id };
  const taskWhere = {
    project: { owner_id: user.id }
  };
  const [tasksByStatus, projectsByStatus, workload, overdueTrend, totalTasks] = await Promise.all([
    countTasksByStatus(taskWhere),
    countProjectsByStatus(ownerWhere),
    buildWorkload(taskWhere, { project: ownerWhere }),
    buildOverdueTrend(taskWhere),
    prisma.task.count({ where: taskWhere })
  ]);
  return {
    totals: {
      projects: projectsByStatus.reduce((sum, row) => sum + row.count, 0),
      tasks: totalTasks
    },
    completionRate: completionRateOf(tasksByStatus),
    tasksByStatus,
    projectsByStatus,
    workload,
    overdueTrend
  };
};
var getProjectAnalytics = async (user, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId.trim() },
    select: { id: true, name: true, status: true, owner_id: true }
  });
  if (!project) {
    throw new appError_default(status9.NOT_FOUND, "Project not found");
  }
  if (project.owner_id !== user.id) {
    throw new appError_default(
      status9.FORBIDDEN,
      "Only the project owner can view this project's analytics"
    );
  }
  const taskWhere = { project_id: project.id };
  const [tasksByStatus, workload, overdueTrend, totalTasks] = await Promise.all(
    [
      countTasksByStatus(taskWhere),
      buildWorkload(taskWhere, { project_id: project.id }),
      buildOverdueTrend(taskWhere),
      prisma.task.count({ where: taskWhere })
    ]
  );
  return {
    project: { id: project.id, name: project.name, status: project.status },
    totals: { tasks: totalTasks },
    completionRate: completionRateOf(tasksByStatus),
    tasksByStatus,
    workload,
    overdueTrend
  };
};
var getMemberProgress = async (user) => {
  const taskWhere = { assignee_id: user.id };
  const now = /* @__PURE__ */ new Date();
  const [tasksByStatus, totalTasks, overdueCount] = await Promise.all([
    countTasksByStatus(taskWhere),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({
      where: {
        assignee_id: user.id,
        status: { not: TaskStatus.DONE },
        due_date: { lt: now }
      }
    })
  ]);
  return {
    totals: { tasks: totalTasks, overdue: overdueCount },
    completionRate: completionRateOf(tasksByStatus),
    tasksByStatus,
    overdueCount
  };
};
var AnalyticsService = {
  getAdminAnalytics,
  getManagerAnalytics,
  getProjectAnalytics,
  getMemberProgress
};

// src/app/modules/analytics/analytics.controller.ts
var pathParam2 = (value) => value;
var getAdminAnalytics2 = catchAsync(async (_, res) => {
  const result = await AnalyticsService.getAdminAnalytics();
  sendResponse_default(res, {
    message: "Platform analytics fetched Successfully",
    data: result
  });
});
var getManagerAnalytics2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AnalyticsService.getManagerAnalytics(user);
  sendResponse_default(res, {
    message: "Manager analytics fetched Successfully",
    data: result
  });
});
var getProjectAnalytics2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AnalyticsService.getProjectAnalytics(
    user,
    pathParam2(req.params.projectId)
  );
  sendResponse_default(res, {
    message: "Project analytics fetched Successfully",
    data: result
  });
});
var getMemberProgress2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AnalyticsService.getMemberProgress(user);
  sendResponse_default(res, {
    message: "Progress fetched Successfully",
    data: result
  });
});
var AnalyticsController = {
  getAdminAnalytics: getAdminAnalytics2,
  getManagerAnalytics: getManagerAnalytics2,
  getProjectAnalytics: getProjectAnalytics2,
  getMemberProgress: getMemberProgress2
};

// src/app/modules/analytics/analytics.route.ts
var router2 = Router2();
router2.get("/admin", auth_default(Role.ADMIN), AnalyticsController.getAdminAnalytics);
router2.get(
  "/manager",
  auth_default(Role.PROJECT_MANAGER),
  AnalyticsController.getManagerAnalytics
);
router2.get(
  "/project/:projectId",
  auth_default(Role.PROJECT_MANAGER),
  AnalyticsController.getProjectAnalytics
);
router2.get(
  "/member",
  auth_default(Role.TEAM_MEMBER),
  AnalyticsController.getMemberProgress
);
var AnalyticsRoutes = router2;

// src/app/modules/attachment/attachment.route.ts
import { Router as Router3 } from "express";

// src/app/lib/multer.ts
import multer from "multer";
import z2 from "zod";
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var storage = multer.memoryStorage();
var upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});
var multerFileSchema = z2.object({
  fieldname: z2.string(),
  originalname: z2.string(),
  encoding: z2.string(),
  mimetype: z2.string(),
  buffer: z2.instanceof(Buffer),
  size: z2.number()
});
var multer_default = upload;

// src/app/utils/mergeMulterPayload.ts
var mergeMulterPayload = (...fields) => {
  return async (req, res, next) => {
    if (!req.body) {
      req.body = {};
    }
    if (req.body.data) {
      try {
        const parsedData = JSON.parse(req.body.data);
        req.body = { ...req.body, ...parsedData };
        delete req.body.data;
      } catch (_) {
        return res.status(400).json({ message: "Invalid JSON format in body data" });
      }
    }
    if (req.files) {
      let files;
      if (Array.isArray(req.files)) {
        files = {};
        for (const file of req.files) {
          const group = files[file.fieldname] ?? [];
          group.push(file);
          files[file.fieldname] = group;
        }
      } else {
        files = req.files;
      }
      fields.forEach((field) => {
        if (files[field]?.length) {
          const fieldFiles = files[field];
          req.body[field] = fieldFiles.length === 1 ? fieldFiles[0] : fieldFiles;
        } else {
          req.body[field] = null;
        }
      });
    }
    if (req.file) {
      const fieldName = fields[0];
      req.body[fieldName] = req.file;
    }
    next();
  };
};
var mergeMulterPayload_default = mergeMulterPayload;

// src/app/modules/attachment/attachment.controller.ts
import status12 from "http-status";

// src/app/modules/attachment/attachment.service.ts
import status11 from "http-status";

// src/app/lib/cloudinary.ts
import { v2 as Cloudinary } from "cloudinary";
Cloudinary.config({
  cloud_name: config_default.cloudinary_cloud_name,
  api_key: config_default.cloudinary_api_key,
  api_secret: config_default.cloudinary_api_secret
});
var cloudinary = Cloudinary;

// src/app/modules/project/project.service.ts
import crypto from "crypto";
import path5 from "path";
import ejs2 from "ejs";
import status10 from "http-status";
var PLAN_LIMITS = {
  FREE: { projects: 2, members: 3 },
  PRO: { projects: 15, members: 15 },
  BUSINESS: { projects: null, members: null }
};
var INVITATION_TTL_DAYS = 7;
var INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1e3;
var ALLOWED_SORT_FIELDS2 = [
  "name",
  "start_date",
  "end_date",
  "created_at"
];
var userBriefSelect = {
  id: true,
  name: true,
  email: true,
  avatar_url: true,
  role: true
};
var projectDetailSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  start_date: true,
  end_date: true,
  owner_id: true,
  created_at: true,
  updated_at: true,
  owner: { select: userBriefSelect },
  members: {
    select: {
      id: true,
      joined_at: true,
      user: { select: userBriefSelect }
    },
    orderBy: { joined_at: "asc" }
  },
  _count: { select: { tasks: true, members: true } }
};
var projectListSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  start_date: true,
  end_date: true,
  owner_id: true,
  created_at: true,
  updated_at: true,
  owner: { select: userBriefSelect },
  _count: { select: { members: true } }
};
var invitationSelect = {
  id: true,
  email: true,
  status: true,
  expires_at: true,
  // 🎯 Return the acceptance token so the invitee can accept/decline the
  // invitation from the in-app list (GET /projects/invitations/mine).
  token: true,
  created_at: true,
  updated_at: true,
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      owner: { select: userBriefSelect }
    }
  },
  invited_by: { select: userBriefSelect }
};
var getEffectivePlan = async (ownerId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      owner_id: ownerId,
      status: "ACTIVE",
      OR: [
        { current_period_end: null },
        { current_period_end: { gt: /* @__PURE__ */ new Date() } }
      ]
    },
    orderBy: { created_at: "desc" },
    select: { plan: true }
  });
  return subscription?.plan ?? "FREE";
};
var planLimitMessage = (plan, entity) => {
  const limit = PLAN_LIMITS[plan][entity];
  const noun = entity === "projects" ? "projects" : "members per project";
  return `Plan limit reached. Your ${plan} plan allows up to ${limit} ${noun}. Please upgrade your plan to continue.`;
};
var findProjectOrThrow = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(status10.NOT_FOUND, "Project not found");
  }
  return project;
};
var assertProjectAccess = async (projectId, user) => {
  const project = await findProjectOrThrow(projectId);
  if (user.role === "ADMIN" || project.owner_id === user.id) {
    return project;
  }
  const membership = await prisma.projectMember.findUnique({
    where: { project_id_user_id: { project_id: projectId, user_id: user.id } }
  });
  if (!membership) {
    throw new appError_default(
      status10.FORBIDDEN,
      "You are not a member of this project"
    );
  }
  return project;
};
var assertProjectOwner = async (projectId, user) => {
  const project = await findProjectOrThrow(projectId);
  if (project.owner_id !== user.id) {
    throw new appError_default(
      status10.FORBIDDEN,
      "Only the project owner can perform this action"
    );
  }
  return project;
};
var assertMemberLimit = async (projectId, ownerId) => {
  const plan = await getEffectivePlan(ownerId);
  const limit = PLAN_LIMITS[plan].members;
  if (limit === null) {
    return;
  }
  const memberCount = await prisma.projectMember.count({
    where: { project_id: projectId }
  });
  if (memberCount >= limit) {
    throw new appError_default(status10.FORBIDDEN, planLimitMessage(plan, "members"));
  }
};
var sendInvitationMail = async (recipientName, email, projectName, inviterName, acceptUrl, expiresAt) => {
  const filePath = path5.join(
    process.cwd(),
    "/src/app/templates/project-invitation.ejs"
  );
  const html = await ejs2.renderFile(filePath, {
    name: recipientName || "there",
    email,
    projectName,
    inviterName,
    acceptUrl,
    expiresOn: expiresAt.toDateString(),
    expiresInDays: INVITATION_TTL_DAYS
  });
  try {
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: email,
      subject: `${inviterName} invited you to "${projectName}" on TaskFlow`,
      html,
      attachments: [brandLogoAttachment]
    });
  } catch (error) {
    console.log("Invitation email could not be sent", error);
    if (config_default.environment === "development") {
      console.log(`[DEV]: Project invitation link -> ${acceptUrl}`);
    } else {
      throw new appError_default(
        status10.BAD_GATEWAY,
        "Invitation email could not be sent. please try again later"
      );
    }
  }
};
var createProject = async (user, payload) => {
  const plan = await getEffectivePlan(user.id);
  const projectLimit = PLAN_LIMITS[plan].projects;
  const project = await prisma.$transaction(async (tx) => {
    if (projectLimit !== null) {
      const activeProjects = await tx.project.count({
        where: { owner_id: user.id, status: { not: "ARCHIVED" } }
      });
      if (activeProjects >= projectLimit) {
        throw new appError_default(
          status10.FORBIDDEN,
          planLimitMessage(plan, "projects")
        );
      }
    }
    return await tx.project.create({
      data: {
        name: payload.name,
        ...payload.description !== void 0 ? { description: payload.description } : {},
        ...payload.status !== void 0 ? { status: payload.status } : {},
        start_date: payload.start_date,
        ...payload.end_date !== void 0 ? { end_date: payload.end_date } : {},
        owner_id: user.id
      },
      select: projectDetailSelect
    });
  });
  await audit_default({
    actor: user,
    action: "project.created",
    entity: "project",
    entityId: project.id,
    meta: { name: project.name, status: project.status }
  });
  return project;
};
var getAllProjects = async (query, user) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy;
  const sortField = sortBy && ALLOWED_SORT_FIELDS2.includes(sortBy) ? sortBy : "created_at";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const search = query.search;
  const statusFilter = query.status;
  const andConditions = [];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (statusFilter) {
    if (!Object.values(ProjectStatus).includes(statusFilter)) {
      throw new appError_default(status10.BAD_REQUEST, "Invalid project status filter");
    }
    andConditions.push({ status: statusFilter });
  }
  if (user.role !== "ADMIN") {
    andConditions.push({
      OR: [{ owner_id: user.id }, { members: { some: { user_id: user.id } } }]
    });
  }
  const where = { AND: andConditions };
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: projectListSelect,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit
    }),
    prisma.project.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: projects, meta };
};
var getProjectById = async (projectId, user) => {
  const project = await assertProjectAccess(projectId, user);
  return await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    select: projectDetailSelect
  });
};
var updateProject = async (projectId, user, payload) => {
  const project = await findProjectOrThrow(projectId);
  if (project.owner_id !== user.id && user.role !== "ADMIN") {
    throw new appError_default(
      status10.FORBIDDEN,
      "Only the project owner can update this project"
    );
  }
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...payload.name !== void 0 ? { name: payload.name } : {},
      ...payload.description !== void 0 ? { description: payload.description } : {},
      ...payload.status !== void 0 ? { status: payload.status } : {},
      ...payload.start_date !== void 0 ? { start_date: payload.start_date } : {},
      ...payload.end_date !== void 0 ? { end_date: payload.end_date } : {}
    },
    select: projectDetailSelect
  });
  await audit_default({
    actor: user,
    action: "project.updated",
    entity: "project",
    entityId: updated.id,
    meta: { name: updated.name, status: updated.status }
  });
  return updated;
};
var deleteProject = async (projectId, user) => {
  const project = await findProjectOrThrow(projectId);
  if (project.owner_id !== user.id && user.role !== "ADMIN") {
    throw new appError_default(
      status10.FORBIDDEN,
      "Only the project owner can delete this project"
    );
  }
  await prisma.project.delete({ where: { id: projectId } });
  await audit_default({
    actor: user,
    action: "project.deleted",
    entity: "project",
    entityId: project.id,
    meta: { name: project.name, owner_id: project.owner_id }
  });
  return { id: project.id, name: project.name };
};
var getProjectMembers = async (projectId, user) => {
  await assertProjectAccess(projectId, user);
  return await prisma.projectMember.findMany({
    where: { project_id: projectId },
    select: {
      id: true,
      joined_at: true,
      user: { select: userBriefSelect }
    },
    orderBy: { joined_at: "asc" }
  });
};
var removeMember = async (projectId, memberId, user) => {
  await assertProjectOwner(projectId, user);
  const member = await prisma.projectMember.findFirst({
    where: { id: memberId, project_id: projectId }
  });
  if (!member) {
    throw new appError_default(status10.NOT_FOUND, "Member not found in this project");
  }
  await prisma.projectMember.delete({ where: { id: member.id } });
  return { id: member.id };
};
var inviteMember = async (projectId, user, payload) => {
  const project = await assertProjectOwner(projectId, user);
  const email = payload.email;
  if (email.toLowerCase() === user.email.toLowerCase()) {
    throw new appError_default(status10.BAD_REQUEST, "You can't invite yourself");
  }
  await assertMemberLimit(projectId, project.owner_id);
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      project_id: projectId,
      user: { email: { equals: email, mode: "insensitive" } }
    }
  });
  if (existingMember) {
    throw new appError_default(
      status10.CONFLICT,
      "This email already belongs to a project member"
    );
  }
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const token = crypto.randomBytes(32).toString("hex");
  const pendingInvitation = await prisma.projectInvitation.findFirst({
    where: {
      project_id: projectId,
      status: "PENDING",
      email: { equals: email, mode: "insensitive" }
    }
  });
  const invitation = pendingInvitation ? await prisma.projectInvitation.update({
    where: { id: pendingInvitation.id },
    data: { token, expires_at: expiresAt },
    select: invitationSelect
  }) : await prisma.projectInvitation.create({
    data: {
      email,
      token,
      project_id: projectId,
      invited_by_id: user.id,
      expires_at: expiresAt
    },
    select: invitationSelect
  });
  const [invitedUser, inviter] = await Promise.all([
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true }
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    })
  ]);
  const inviterName = inviter?.name ?? "A project manager";
  if (invitedUser) {
    await NotificationService.createNotification({
      user_id: invitedUser.id,
      type: NotificationType.INVITE_RECEIVED,
      title: "Project invitation",
      message: `${inviterName} invited you to join "${project.name}"`,
      link: `/invitations?token=${token}`,
      actor_id: user.id,
      actor_name: inviter?.name ?? null
    });
  }
  await sendInvitationMail(
    invitedUser?.name ?? null,
    email,
    project.name,
    inviterName,
    `${config_default.frontend_url}/invitations?token=${token}`,
    expiresAt
  );
  return invitation;
};
var getProjectInvitations = async (projectId, user) => {
  await assertProjectOwner(projectId, user);
  return await prisma.projectInvitation.findMany({
    where: { project_id: projectId },
    select: invitationSelect,
    orderBy: { created_at: "desc" }
  });
};
var loadInvitationForResponse = async (token) => {
  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: { project: true }
  });
  if (!invitation) {
    throw new appError_default(status10.NOT_FOUND, "Invalid or expired invitation");
  }
  const isExpired = invitation.expires_at.getTime() < Date.now();
  if (invitation.status !== "PENDING" || isExpired) {
    if (invitation.status === "PENDING" && isExpired) {
      await prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
    }
    throw new appError_default(status10.NOT_FOUND, "Invalid or expired invitation");
  }
  return invitation;
};
var assertInvitationBelongsTo = (invitationEmail, user) => {
  if (invitationEmail.toLowerCase() !== user.email.toLowerCase()) {
    throw new appError_default(
      status10.FORBIDDEN,
      "This invitation was sent to a different email address"
    );
  }
};
var acceptInvitation = async (user, payload) => {
  const invitation = await loadInvitationForResponse(payload.token);
  assertInvitationBelongsTo(invitation.email, user);
  const projectId = invitation.project_id;
  const existingMember = await prisma.projectMember.findUnique({
    where: { project_id_user_id: { project_id: projectId, user_id: user.id } }
  });
  if (!existingMember) {
    await assertMemberLimit(projectId, invitation.project.owner_id);
  }
  const project = await prisma.$transaction(async (tx) => {
    if (!existingMember) {
      await tx.projectMember.create({
        data: { project_id: projectId, user_id: user.id }
      });
    }
    await tx.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" }
    });
    return await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: projectDetailSelect
    });
  });
  await audit_default({
    actor: user,
    action: "invitation.accepted",
    entity: "project_invitation",
    entityId: invitation.id,
    meta: { project_id: projectId, project_name: project.name }
  });
  return project;
};
var declineInvitation = async (user, payload) => {
  const invitation = await loadInvitationForResponse(payload.token);
  assertInvitationBelongsTo(invitation.email, user);
  return await prisma.projectInvitation.update({
    where: { id: invitation.id },
    data: { status: "DECLINED" },
    select: invitationSelect
  });
};
var getMyInvitations = async (user) => {
  return await prisma.projectInvitation.findMany({
    where: {
      email: { equals: user.email, mode: "insensitive" },
      status: "PENDING",
      expires_at: { gt: /* @__PURE__ */ new Date() }
    },
    select: invitationSelect,
    orderBy: { created_at: "desc" }
  });
};
var ProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  removeMember,
  inviteMember,
  getProjectInvitations,
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
  // plan source of truth — reads the active Subscription written by billing
  getEffectivePlan
};

// src/app/modules/attachment/attachment.service.ts
var MAX_FILES_PER_UPLOAD = 5;
var userBriefSelect2 = {
  id: true,
  name: true,
  avatar_url: true
};
var attachmentSelect = {
  id: true,
  file_name: true,
  url: true,
  mime_type: true,
  size: true,
  task_id: true,
  created_at: true,
  uploaded_by: { select: userBriefSelect2 }
};
var findTaskOrThrow = async (taskId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new appError_default(status11.NOT_FOUND, "Task not found");
  }
  return task;
};
var findProjectOrThrow2 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(status11.NOT_FOUND, "Project not found");
  }
  return project;
};
var assertProjectMember = async (project, userId) => {
  if (project.owner_id === userId) {
    return;
  }
  const membership = await prisma.projectMember.findUnique({
    where: { project_id_user_id: { project_id: project.id, user_id: userId } }
  });
  if (!membership) {
    throw new appError_default(
      status11.FORBIDDEN,
      "You are not a member of this project"
    );
  }
};
var assertAttachmentsAllowed = async (ownerId) => {
  const plan = await ProjectService.getEffectivePlan(ownerId);
  if (plan === "FREE") {
    throw new appError_default(
      status11.FORBIDDEN,
      "File attachments require a Pro or Business plan"
    );
  }
};
var normalizeFiles = (files) => {
  if (!files) {
    return [];
  }
  return Array.isArray(files) ? files : [files];
};
var uploadAttachments = async (taskId, user, rawFiles) => {
  const task = await findTaskOrThrow(taskId);
  const project = await findProjectOrThrow2(task.project_id);
  await assertProjectMember(project, user.id);
  await assertAttachmentsAllowed(project.owner_id);
  const files = normalizeFiles(rawFiles);
  if (files.length === 0) {
    throw new appError_default(status11.BAD_REQUEST, "At least one file is required");
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new appError_default(
      status11.BAD_REQUEST,
      `You can upload up to ${MAX_FILES_PER_UPLOAD} files at a time`
    );
  }
  const uploaded = await Promise.all(
    files.map(async (file) => {
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: `taskflow/tasks/${task.id}`,
          resource_type: "auto"
        }
      );
      return { file, result };
    })
  );
  const rows = await prisma.attachment.createManyAndReturn({
    data: uploaded.map(({ file, result }) => ({
      file_name: file.originalname,
      url: result.secure_url,
      public_id: result.public_id,
      mime_type: file.mimetype,
      size: file.size,
      task_id: task.id,
      uploaded_by_id: user.id
    })),
    select: attachmentSelect
  });
  return rows;
};
var getTaskAttachments = async (taskId, user) => {
  const task = await findTaskOrThrow(taskId);
  const project = await findProjectOrThrow2(task.project_id);
  if (user.role !== "ADMIN" && project.owner_id !== user.id && task.assignee_id !== user.id) {
    await assertProjectMember(project, user.id);
  }
  return await prisma.attachment.findMany({
    where: { task_id: task.id },
    select: attachmentSelect,
    orderBy: [{ created_at: "desc" }]
  });
};
var deleteAttachment = async (attachmentId, user) => {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId }
  });
  if (!attachment) {
    throw new appError_default(status11.NOT_FOUND, "Attachment not found");
  }
  const task = await findTaskOrThrow(attachment.task_id);
  const project = await findProjectOrThrow2(task.project_id);
  const isUploader = attachment.uploaded_by_id === user.id;
  const isOwner = project.owner_id === user.id;
  if (!isUploader && !isOwner && user.role !== "ADMIN") {
    throw new appError_default(
      status11.FORBIDDEN,
      "You are not allowed to delete this attachment"
    );
  }
  try {
    await cloudinary.uploader.destroy(attachment.public_id, {
      resource_type: "auto"
    });
  } catch {
  }
  await prisma.attachment.delete({ where: { id: attachment.id } });
  return { id: attachment.id, file_name: attachment.file_name };
};
var AttachmentService = {
  uploadAttachments,
  getTaskAttachments,
  deleteAttachment
};

// src/app/modules/attachment/attachment.controller.ts
var pathParam3 = (value) => value;
var uploadAttachments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const files = req.body?.files ?? null;
  const result = await AttachmentService.uploadAttachments(
    pathParam3(req.params.taskId),
    user,
    files
  );
  sendResponse_default(res, {
    status: status12.CREATED,
    message: "Attachments uploaded Successfully",
    data: result
  });
});
var getTaskAttachments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AttachmentService.getTaskAttachments(
    pathParam3(req.params.taskId),
    user
  );
  sendResponse_default(res, {
    message: "Attachments fetched Successfully",
    data: result
  });
});
var deleteAttachment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await AttachmentService.deleteAttachment(
    pathParam3(req.params.attachmentId),
    user
  );
  sendResponse_default(res, {
    message: "Attachment deleted Successfully",
    data: result
  });
});
var AttachmentController = {
  uploadAttachments: uploadAttachments2,
  getTaskAttachments: getTaskAttachments2,
  deleteAttachment: deleteAttachment2
};

// src/app/modules/attachment/attachment.route.ts
var router3 = Router3();
router3.post(
  "/:taskId/attachments",
  auth_default(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  multer_default.array("files", 5),
  mergeMulterPayload_default("files"),
  AttachmentController.uploadAttachments
);
router3.get(
  "/:taskId/attachments",
  auth_default(),
  AttachmentController.getTaskAttachments
);
router3.delete(
  "/attachments/:attachmentId",
  auth_default(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  AttachmentController.deleteAttachment
);
var AttachmentRoutes = router3;

// src/app/modules/auth/auth.route.ts
import { Router as Router4 } from "express";

// src/app/modules/auth/auth.controller.ts
import status15 from "http-status";

// src/app/modules/auth/auth.service.ts
import crypto2 from "crypto";
import path6 from "path";
import ejs3 from "ejs";
import status14 from "http-status";

// src/app/lib/googleAuth.ts
import { OAuth2Client } from "google-auth-library";
var googleClient = new OAuth2Client(config_default.google_client_id);
var googleAuth_default = googleClient;

// src/app/utils/hashPassword.ts
import bcrypt from "bcryptjs";
var hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config_default.bcrypt_salt_rounds)
  );
  return hashedPassword;
};
var comparePassword = async (password, hashedPassword) => {
  const result = await bcrypt.compare(password, hashedPassword);
  return result;
};

// src/app/utils/verifyOtp.ts
import status13 from "http-status";
var verifyOtp = async (payload) => {
  const redisOtp = await redis_default.get(payload.otpKey);
  if (!redisOtp) {
    throw new appError_default(status13.NOT_FOUND, "OTP expired, please try again");
  }
  if (payload.otp !== Number(redisOtp)) {
    throw new appError_default(status13.BAD_REQUEST, "Invalid OTP");
  }
  await redis_default.del(payload.otpKey);
  return true;
};

// src/app/modules/auth/auth.service.ts
var OTP_TTL_SECONDS = 60 * 5;
var RESEND_COOLDOWN_SECONDS = 60;
var EXPIRATION_MINUTES = 5;
var otpRedisKey = (email) => `verify-email-otp:${email}`;
var resendRedisKey = (email) => `otp-resend-cooldown:${email}`;
var forgotPasswordRedisKey = (email) => `forgot-password-otp:${email}`;
var forgotPasswordCooldownKey = (email) => `forgot-password-cooldown:${email}`;
var buildJwtPayload = (user) => {
  return { id: user.id, email: user.email, role: user.role };
};
var refreshTokenRedisKey = (userId) => `active-refresh-token:${userId}`;
var REFRESH_TRACKING_TTL_SECONDS = 30 * 24 * 60 * 60;
var hashToken = (token) => crypto2.createHash("sha256").update(token).digest("hex");
var rememberRefreshToken = async (userId, refreshToken) => {
  try {
    await redis_default.set(
      refreshTokenRedisKey(userId),
      hashToken(refreshToken),
      {
        EX: REFRESH_TRACKING_TTL_SECONDS
      }
    );
  } catch {
  }
};
var isCurrentRefreshToken = async (userId, refreshToken) => {
  try {
    const tracked = await redis_default.get(refreshTokenRedisKey(userId));
    return !tracked || tracked === hashToken(refreshToken);
  } catch {
    return true;
  }
};
var revokeSession = async (userId) => {
  try {
    await redis_default.del(refreshTokenRedisKey(userId));
  } catch {
  }
};
var signAccessToken = (payload) => {
  return signToken(payload, config_default.jwt_access_secret, config_default.jwt_access_time);
};
var signRefreshToken = (payload) => signToken(
  // a unique jti makes every refresh token distinct, so rotation and
  // single-session revocation (see rememberRefreshToken) actually work
  { ...payload, jti: crypto2.randomUUID() },
  config_default.jwt_refresh_secret,
  config_default.jwt_refresh_time
);
var buildSessionTokens = async (user) => {
  const payload = buildJwtPayload(user);
  const tokens = {
    access_token: signAccessToken(payload),
    refresh_token: signRefreshToken(payload)
  };
  await rememberRefreshToken(user.id, tokens.refresh_token);
  return tokens;
};
var storeOtp = async (email) => {
  const otpValue = crypto2.randomInt(1e5, 1e6).toString();
  if (config_default.environment === "development") {
    console.log(`[DEV]: User registration otp log -> ${otpValue}`);
  }
  await redis_default.set(otpRedisKey(email), otpValue, {
    expiration: {
      type: "EX",
      value: OTP_TTL_SECONDS
    }
  });
  return otpValue;
};
var sendOtpMail = async (name, email, otpValue) => {
  const filePath = path6.join(
    process.cwd(),
    "/src/app/templates/registration-otp.ejs"
  );
  const htmlData = {
    name,
    otp: otpValue,
    email,
    expirationMinutes: EXPIRATION_MINUTES
  };
  const html = await ejs3.renderFile(filePath, htmlData);
  try {
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: email,
      subject: "Your verification otp for TaskFlow",
      html,
      attachments: [brandLogoAttachment]
    });
  } catch (error) {
    console.log("OTP email could not be sent", error);
    if (config_default.environment !== "development") {
      throw new appError_default(
        status14.BAD_GATEWAY,
        "Verification email could not be sent. please try again later"
      );
    }
  }
};
var registerUser = async (payload) => {
  const { name, email, password, role } = payload;
  const settings = await getPlatformSettings();
  if (settings.maintenance_mode) {
    throw new appError_default(
      status14.SERVICE_UNAVAILABLE,
      "Under maintenance. Registration is temporarily disabled."
    );
  }
  if (!settings.registration_open) {
    throw new appError_default(
      status14.FORBIDDEN,
      "Registration is currently closed. Please contact support."
    );
  }
  const isUserExists = await prisma.user.findUnique({
    where: { email }
  });
  if (isUserExists?.is_verified) {
    throw new appError_default(
      status14.CONFLICT,
      "User already exists with this email. please login"
    );
  }
  const hashedPassword = await hashPassword(password);
  if (isUserExists) {
    await prisma.user.update({
      where: { id: isUserExists.id },
      data: { name, password: hashedPassword, role }
    });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        provider: "CREDENTIALS",
        is_verified: false
      }
    });
  }
  const otpValue = await storeOtp(email);
  await sendOtpMail(name, email, otpValue);
};
var verifyEmail = async (payload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email }
  });
  if (!user) {
    throw new appError_default(
      status14.NOT_FOUND,
      "No registration found for this email. please register"
    );
  }
  if (user.is_verified) {
    throw new appError_default(status14.CONFLICT, "Email already verified. please login");
  }
  await verifyOtp({
    otp: Number(payload.otp),
    otpKey: otpRedisKey(payload.email)
  });
  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { is_verified: true, last_login_at: /* @__PURE__ */ new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true
    }
  });
  return {
    ...await buildSessionTokens(verifiedUser),
    user: verifiedUser
  };
};
var resendOtp = async (payload) => {
  const { email } = payload;
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new appError_default(
      status14.NOT_FOUND,
      "No registration found for this email. please register"
    );
  }
  if (user.is_verified) {
    throw new appError_default(status14.CONFLICT, "Email already verified. please login");
  }
  const isOnCooldown = await redis_default.get(resendRedisKey(email));
  if (isOnCooldown) {
    throw new appError_default(
      status14.TOO_MANY_REQUESTS,
      "Please wait a minute before requesting another code"
    );
  }
  const otpValue = await storeOtp(email);
  await redis_default.set(resendRedisKey(email), "1", {
    expiration: {
      type: "EX",
      value: RESEND_COOLDOWN_SECONDS
    }
  });
  await sendOtpMail(user.name, email, otpValue);
};
var login = async (payload) => {
  const { email, password } = payload;
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (!user) {
    throw new appError_default(status14.NOT_FOUND, "No user found, please register");
  }
  if (user.is_deleted) {
    throw new appError_default(status14.NOT_FOUND, "No account found.");
  }
  if (user.user_status === "SUSPENDED") {
    throw new appError_default(
      status14.FORBIDDEN,
      "Your account is suspended. please contact support"
    );
  }
  if (!user.is_active) {
    throw new appError_default(status14.BAD_REQUEST, "Your account is inactive.");
  }
  if (!user.password) {
    throw new appError_default(status14.UNAUTHORIZED, "Invalid credentials");
  }
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new appError_default(status14.UNAUTHORIZED, "Invalid credentials");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: /* @__PURE__ */ new Date() }
  });
  return {
    ...await buildSessionTokens(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      need_password_change: user.need_password_change
    }
  };
};
var refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "You are not logged in. Please log in to access this resource."
    );
  }
  const decodedData = verifyToken(refreshToken, config_default.jwt_refresh_secret);
  if (!decodedData.success || !decodedData.data) {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "Your session has expired. Please log in again"
    );
  }
  if (!await isCurrentRefreshToken(decodedData.data.id, refreshToken)) {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "Your session has expired. Please log in again"
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: decodedData.data.id }
  });
  if (!user || user.is_deleted) {
    throw new appError_default(status14.UNAUTHORIZED, "No account found.");
  }
  if (user.user_status === "SUSPENDED") {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "Your account is suspended. please contact support"
    );
  }
  if (!user.is_active) {
    throw new appError_default(status14.BAD_REQUEST, "Your account is inactive.");
  }
  if (!user.is_verified) {
    throw new appError_default(
      status14.BAD_REQUEST,
      "Your account is not verified. Please verify your account to access this resource."
    );
  }
  return {
    ...await buildSessionTokens(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      need_password_change: user.need_password_change
    }
  };
};
var forgotPassword = async (payload) => {
  const email = payload.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.is_deleted) {
    throw new appError_default(status14.NOT_FOUND, "No account found for this email");
  }
  if (user.user_status === "SUSPENDED") {
    throw new appError_default(
      status14.FORBIDDEN,
      "Your account is suspended. please contact support"
    );
  }
  if (!user.is_verified) {
    throw new appError_default(
      status14.BAD_REQUEST,
      "Your account is not verified. please verify your email first"
    );
  }
  if (user.provider === "GOOGLE" || !user.password) {
    throw new appError_default(
      status14.FORBIDDEN,
      "This account signs in with Google. please use Google login"
    );
  }
  const isOnCooldown = await redis_default.get(forgotPasswordCooldownKey(email));
  if (isOnCooldown) {
    throw new appError_default(
      status14.TOO_MANY_REQUESTS,
      "Please wait a minute before requesting another code"
    );
  }
  const otpValue = crypto2.randomInt(1e5, 1e6).toString();
  if (config_default.environment === "development") {
    console.log(`[DEV]: Password reset otp log -> ${otpValue}`);
  }
  await redis_default.set(forgotPasswordRedisKey(email), otpValue, {
    expiration: {
      type: "EX",
      value: OTP_TTL_SECONDS
    }
  });
  await redis_default.set(forgotPasswordCooldownKey(email), "1", {
    expiration: {
      type: "EX",
      value: RESEND_COOLDOWN_SECONDS
    }
  });
  const filePath = path6.join(
    process.cwd(),
    "/src/app/templates/forgot-password-otp.ejs"
  );
  const html = await ejs3.renderFile(filePath, {
    name: user.name,
    email,
    otp: otpValue,
    expirationMinutes: EXPIRATION_MINUTES
  });
  try {
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: email,
      subject: "Your password reset code for TaskFlow",
      html,
      attachments: [brandLogoAttachment]
    });
  } catch (error) {
    console.log("Password reset email could not be sent", error);
    if (config_default.environment !== "development") {
      throw new appError_default(
        status14.BAD_GATEWAY,
        "Password reset email could not be sent. please try again later"
      );
    }
  }
};
var resetPassword = async (payload) => {
  const email = payload.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.is_deleted) {
    throw new appError_default(status14.NOT_FOUND, "No account found for this email");
  }
  if (user.user_status === "SUSPENDED") {
    throw new appError_default(
      status14.FORBIDDEN,
      "Your account is suspended. please contact support"
    );
  }
  if (!user.is_verified) {
    throw new appError_default(
      status14.BAD_REQUEST,
      "Your account is not verified. please verify your email first"
    );
  }
  if (user.provider === "GOOGLE" || !user.password) {
    throw new appError_default(
      status14.FORBIDDEN,
      "This account signs in with Google. please use Google login"
    );
  }
  await verifyOtp({
    otp: Number(payload.otp),
    otpKey: forgotPasswordRedisKey(email)
  });
  const hashedPassword = await hashPassword(payload.new_password);
  await prisma.user.update({
    where: { id: user.id },
    // the flag forces a proper password change through the signed-in
    // change-password flow (cleared by PATCH /users/me/password)
    data: { password: hashedPassword, need_password_change: true }
  });
  await revokeSession(user.id);
  const filePath = path6.join(
    process.cwd(),
    "/src/app/templates/password-reset-success.ejs"
  );
  const html = await ejs3.renderFile(filePath, { name: user.name });
  try {
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: email,
      subject: "Your TaskFlow password was changed",
      html,
      attachments: [brandLogoAttachment]
    });
  } catch (error) {
    console.log("Password reset confirmation email could not be sent", error);
  }
};
var googleLogin = async (payload) => {
  if (!config_default.google_client_id) {
    throw new appError_default(
      status14.INTERNAL_SERVER_ERROR,
      "Google login is not configured on this server"
    );
  }
  let idTokenPayload;
  try {
    const ticket = await googleAuth_default.verifyIdToken({
      idToken: payload.id_token,
      audience: config_default.google_client_id
    });
    idTokenPayload = ticket.getPayload();
  } catch {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "Google login failed. the ID token is invalid or expired"
    );
  }
  if (!idTokenPayload?.email || !idTokenPayload.sub) {
    throw new appError_default(
      status14.UNAUTHORIZED,
      "Google ID token is missing the email claim"
    );
  }
  const email = idTokenPayload.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  let user = existingUser;
  if (existingUser) {
    if (existingUser.is_deleted) {
      throw new appError_default(status14.NOT_FOUND, "No account found.");
    }
    if (existingUser.user_status === "SUSPENDED") {
      throw new appError_default(
        status14.FORBIDDEN,
        "Your account is suspended. please contact support"
      );
    }
    if (!existingUser.is_active) {
      throw new appError_default(status14.BAD_REQUEST, "Your account is inactive.");
    }
    if (existingUser.provider === "GOOGLE") {
      user = existingUser.google_id === idTokenPayload.sub ? existingUser : await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          google_id: idTokenPayload.sub,
          avatar_url: existingUser.avatar_url ?? idTokenPayload.picture ?? null
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          google_id: idTokenPayload.sub,
          provider: "GOOGLE",
          is_verified: true,
          avatar_url: existingUser.avatar_url ?? idTokenPayload.picture ?? null
        }
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: idTokenPayload.name || email.split("@")[0] || email,
        email,
        password: null,
        role: "TEAM_MEMBER",
        provider: "GOOGLE",
        google_id: idTokenPayload.sub,
        avatar_url: idTokenPayload.picture ?? null,
        is_verified: true
      }
    });
  }
  if (!user) {
    throw new appError_default(
      status14.INTERNAL_SERVER_ERROR,
      "Google login failed. please try again"
    );
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: /* @__PURE__ */ new Date() }
  });
  return {
    ...await buildSessionTokens(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      need_password_change: user.need_password_change
    }
  };
};
var getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true }
  });
  if (!user) {
    throw new appError_default(status14.NOT_FOUND, "User not found");
  }
  return user;
};
var AuthService = {
  registerUser,
  verifyEmail,
  resendOtp,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshSession,
  revokeSession,
  getMe
};

// src/app/modules/auth/auth.controller.ts
var SECOND = 1e3;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var TTL_UNIT_MS = {
  s: SECOND,
  m: MINUTE,
  h: HOUR,
  d: DAY
};
var ttlToMs = (value, fallback) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value * SECOND : fallback;
  }
  const match = /^(\d+)([smhd])$/.exec(value?.trim() ?? "");
  if (!match?.[1] || !match[2]) {
    return fallback;
  }
  return Number(match[1]) * (TTL_UNIT_MS[match[2]] ?? fallback);
};
var ACCESS_TOKEN_MAX_AGE = ttlToMs(config_default.jwt_access_time, 1 * DAY);
var REFRESH_TOKEN_MAX_AGE = ttlToMs(config_default.jwt_refresh_time, 7 * DAY);
var sessionCookieOptions = () => ({
  httpOnly: true,
  secure: config_default.environment !== "development",
  sameSite: config_default.environment === "development" ? "lax" : "none",
  path: "/"
});
var setSessionCookies = (res, tokens) => {
  const options = sessionCookieOptions();
  res.cookie("access_token", tokens.access_token, {
    ...options,
    maxAge: ACCESS_TOKEN_MAX_AGE
  });
  res.cookie("refresh_token", tokens.refresh_token, {
    ...options,
    maxAge: REFRESH_TOKEN_MAX_AGE
  });
};
var registerUser2 = catchAsync(async (req, res, _) => {
  await AuthService.registerUser(req.body);
  sendResponse_default(res, {
    status: status15.OK,
    message: "OTP has been sent to email"
  });
});
var verifyEmail2 = catchAsync(async (req, res) => {
  const result = await AuthService.verifyEmail(req.body);
  setSessionCookies(res, result);
  sendResponse_default(res, {
    status: status15.CREATED,
    message: "Email verified and user registration successful",
    data: { user: result.user }
  });
});
var resendOtp2 = catchAsync(async (req, res) => {
  await AuthService.resendOtp(req.body);
  sendResponse_default(res, {
    status: status15.OK,
    message: "OTP has been sent to email"
  });
});
var includeTokensInBody = () => config_default.environment !== "production";
var login2 = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  setSessionCookies(res, result);
  sendResponse_default(res, {
    message: "Login successful",
    data: {
      user: result.user,
      ...includeTokensInBody() && {
        access_token: result.access_token,
        refresh_token: result.refresh_token
      }
    }
  });
});
var googleLogin2 = catchAsync(async (req, res) => {
  const result = await AuthService.googleLogin(req.body);
  setSessionCookies(res, result);
  sendResponse_default(res, {
    message: "Google login successful",
    data: {
      user: result.user,
      ...includeTokensInBody() && {
        access_token: result.access_token,
        refresh_token: result.refresh_token
      }
    }
  });
});
var forgotPassword2 = catchAsync(async (req, res) => {
  await AuthService.forgotPassword(req.body);
  sendResponse_default(res, {
    message: "Password reset OTP has been sent to your email"
  });
});
var resetPassword2 = catchAsync(async (req, res) => {
  await AuthService.resetPassword(req.body);
  sendResponse_default(res, {
    message: "Password reset successful. please login with your new password"
  });
});
var refreshSession2 = catchAsync(async (req, res) => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.split(" ")[1] : header;
  const result = await AuthService.refreshSession(
    req.cookies?.refresh_token ?? bearerToken
  );
  setSessionCookies(res, result);
  sendResponse_default(res, {
    message: "Session refreshed Successfully",
    data: { user: result.user }
  });
});
var logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await AuthService.revokeSession(req.user.id);
  }
  const options = sessionCookieOptions();
  res.clearCookie("access_token", options);
  res.clearCookie("refresh_token", options);
  sendResponse_default(res, {
    message: "Logout successful"
  });
});
var getMe2 = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await AuthService.getMe(userId);
  sendResponse_default(res, {
    message: "Profile data fetched Successfully",
    data: result
  });
});
var AuthController = {
  registerUser: registerUser2,
  verifyEmail: verifyEmail2,
  resendOtp: resendOtp2,
  login: login2,
  googleLogin: googleLogin2,
  forgotPassword: forgotPassword2,
  resetPassword: resetPassword2,
  refreshSession: refreshSession2,
  logout,
  getMe: getMe2
};

// src/app/modules/auth/auth.schema.ts
import z3 from "zod";
var passwordField = z3.string("password is required").min(8, "password must be 8 characters long").max(24, "password can't be more that 24 characters").regex(/[a-z]/, "password should have one small letter").regex(/[A-Z]/, "password should have one capital letter");
var registerSchema = z3.object(
  {
    name: z3.string("Name is required").min(1, "Name is required"),
    email: z3.email("Invalid email format"),
    password: passwordField,
    role: z3.enum(["PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"])
  },
  "Please provide a valid object"
);
var verifyOtpSchema = z3.object({
  email: z3.email("Invalid email format"),
  otp: z3.string("OTP is required").length(6, "OTP must be 6 digits")
});
var resendOtpSchema = z3.object({
  email: z3.email("Invalid email format")
});
var loginSchema = z3.object({
  email: z3.email("Invalid email format"),
  password: passwordField
});
var googleLoginSchema = z3.object({
  id_token: z3.string("id_token is required").min(1, "Google ID token is required")
});
var forgotPasswordSchema = z3.object({
  email: z3.email("Invalid email format")
});
var resetPasswordSchema = z3.object({
  email: z3.email("Invalid email format"),
  otp: z3.string("OTP is required").length(6, "OTP must be 6 digits"),
  new_password: passwordField
});

// src/app/modules/auth/auth.route.ts
var router4 = Router4();
router4.post(
  "/register",
  validateRequest_default(registerSchema),
  AuthController.registerUser
);
router4.post(
  "/verify-email",
  validateRequest_default(verifyOtpSchema),
  AuthController.verifyEmail
);
router4.post(
  "/resend-otp",
  validateRequest_default(resendOtpSchema),
  AuthController.resendOtp
);
router4.post("/login", validateRequest_default(loginSchema), AuthController.login);
router4.post(
  "/google",
  validateRequest_default(googleLoginSchema),
  AuthController.googleLogin
);
router4.post(
  "/forgot-password",
  validateRequest_default(forgotPasswordSchema),
  AuthController.forgotPassword
);
router4.post(
  "/reset-password",
  validateRequest_default(resetPasswordSchema),
  AuthController.resetPassword
);
router4.post("/refresh", AuthController.refreshSession);
router4.post("/logout", auth_default(), AuthController.logout);
router4.get("/me", auth_default(), AuthController.getMe);
var AuthRoutes = router4;

// src/app/modules/comment/comment.route.ts
import { Router as Router5 } from "express";

// src/app/modules/comment/comment.controller.ts
import status17 from "http-status";

// src/app/modules/comment/comment.service.ts
import status16 from "http-status";
var DEFAULT_PAGE_LIMIT3 = 20;
var MENTION_REGEX = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
var userBriefSelect3 = {
  id: true,
  name: true,
  avatar_url: true
};
var commentSelect = {
  id: true,
  body: true,
  parent_id: true,
  created_at: true,
  updated_at: true,
  author: { select: userBriefSelect3 }
};
var commentWithRepliesSelect = {
  ...commentSelect,
  replies: {
    select: commentSelect,
    orderBy: [{ created_at: "asc" }]
  }
};
var findTaskOrThrow2 = async (taskId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new appError_default(status16.NOT_FOUND, "Task not found");
  }
  return task;
};
var findProjectOrThrow3 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(status16.NOT_FOUND, "Project not found");
  }
  return project;
};
var assertProjectMember2 = async (project, userId) => {
  if (project.owner_id === userId) {
    return;
  }
  const membership = await prisma.projectMember.findUnique({
    where: { project_id_user_id: { project_id: project.id, user_id: userId } }
  });
  if (!membership) {
    throw new appError_default(
      status16.FORBIDDEN,
      "You are not a member of this project"
    );
  }
};
var assertCanViewTask = async (taskId, user) => {
  const task = await findTaskOrThrow2(taskId);
  const project = await findProjectOrThrow3(task.project_id);
  if (user.role === "ADMIN" || project.owner_id === user.id || task.assignee_id === user.id) {
    return { task, project };
  }
  await assertProjectMember2(project, user.id);
  return { task, project };
};
var extractMentionEmails = (body) => {
  const matches = body.match(MENTION_REGEX) ?? [];
  return [...new Set(matches.map((token) => token.slice(1).toLowerCase()))];
};
var getComments = async (taskId, user, query) => {
  const { task } = await assertCanViewTask(taskId, user);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT3, 1);
  const skip = (page - 1) * limit;
  const where = {
    task_id: task.id,
    parent_id: null
  };
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      select: commentWithRepliesSelect,
      orderBy: [{ created_at: "asc" }],
      skip,
      take: limit
    }),
    prisma.comment.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: comments, meta };
};
var createComment = async (taskId, user, payload) => {
  const task = await findTaskOrThrow2(taskId);
  const project = await findProjectOrThrow3(task.project_id);
  await assertProjectMember2(project, user.id);
  let parent = null;
  if (payload.parent_id) {
    parent = await prisma.comment.findUnique({
      where: { id: payload.parent_id }
    });
    if (!parent || parent.task_id !== task.id) {
      throw new appError_default(
        status16.BAD_REQUEST,
        "Parent comment not found on this task"
      );
    }
    if (parent.parent_id) {
      throw new appError_default(
        status16.BAD_REQUEST,
        "You can reply only to top-level comments"
      );
    }
  }
  const comment = await prisma.comment.create({
    data: {
      body: payload.body,
      task_id: task.id,
      author_id: user.id,
      parent_id: parent?.id ?? null
    },
    select: commentWithRepliesSelect
  });
  const actorName = comment.author.name;
  const link = `/dashboard/tasks/${task.id}`;
  const notified = /* @__PURE__ */ new Set();
  const notify = async (recipientId, notificationType, title, message) => {
    if (!recipientId || recipientId === user.id || notified.has(recipientId)) {
      return;
    }
    notified.add(recipientId);
    await NotificationService.createNotification({
      user_id: recipientId,
      type: notificationType,
      title,
      message,
      link,
      actor_id: user.id,
      actor_name: actorName
    });
  };
  if (parent) {
    await notify(
      parent.author_id,
      NotificationType.COMMENT_ADDED,
      "New reply",
      `${actorName} replied to your comment on "${task.title}"`
    );
  } else {
    await notify(
      task.assignee_id,
      NotificationType.COMMENT_ADDED,
      "New comment",
      `${actorName} commented on "${task.title}"`
    );
  }
  const mentionEmails = extractMentionEmails(payload.body);
  if (mentionEmails.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: {
        // mentions are case-insensitive — extractMentionEmails lowercases
        email: { in: mentionEmails, mode: "insensitive" },
        is_deleted: false,
        OR: [
          { id: project.owner_id },
          { project_memberships: { some: { project_id: project.id } } }
        ]
      },
      select: { id: true }
    });
    for (const mentioned of mentionedUsers) {
      await notify(
        mentioned.id,
        NotificationType.MENTION,
        "Mentioned in a comment",
        `${actorName} mentioned you in a comment on "${task.title}"`
      );
    }
  }
  return comment;
};
var updateComment = async (commentId, user, payload) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });
  if (!comment) {
    throw new appError_default(status16.NOT_FOUND, "Comment not found");
  }
  if (comment.author_id !== user.id) {
    throw new appError_default(status16.FORBIDDEN, "You can only edit your own comments");
  }
  return await prisma.comment.update({
    where: { id: comment.id },
    data: { body: payload.body },
    select: commentSelect
  });
};
var deleteComment = async (commentId, user) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId }
  });
  if (!comment) {
    throw new appError_default(status16.NOT_FOUND, "Comment not found");
  }
  const task = await findTaskOrThrow2(comment.task_id);
  const project = await findProjectOrThrow3(task.project_id);
  const isAuthor = comment.author_id === user.id;
  const isOwner = project.owner_id === user.id;
  if (!isAuthor && !isOwner && user.role !== "ADMIN") {
    throw new appError_default(
      status16.FORBIDDEN,
      "You are not allowed to delete this comment"
    );
  }
  await prisma.comment.delete({ where: { id: comment.id } });
  return { id: comment.id, task_id: comment.task_id };
};
var CommentService = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};

// src/app/modules/comment/comment.controller.ts
var pathParam4 = (value) => value;
var getComments2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await CommentService.getComments(
    pathParam4(req.params.taskId),
    user,
    query
  );
  sendResponse_default(res, {
    message: "Comments fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var createComment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await CommentService.createComment(
    pathParam4(req.params.taskId),
    user,
    payload
  );
  sendResponse_default(res, {
    status: status17.CREATED,
    message: "Comment created Successfully",
    data: result
  });
});
var updateComment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await CommentService.updateComment(
    pathParam4(req.params.commentId),
    user,
    payload
  );
  sendResponse_default(res, {
    message: "Comment updated Successfully",
    data: result
  });
});
var deleteComment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await CommentService.deleteComment(
    pathParam4(req.params.commentId),
    user
  );
  sendResponse_default(res, {
    message: "Comment deleted Successfully",
    data: result
  });
});
var CommentController = {
  getComments: getComments2,
  createComment: createComment2,
  updateComment: updateComment2,
  deleteComment: deleteComment2
};

// src/app/modules/comment/comment.schema.ts
import z4 from "zod";
var COMMENT_MAX_LENGTH = 5e3;
var bodyField = z4.string("Comment body is required").trim().min(1, "Comment body can't be empty").max(
  COMMENT_MAX_LENGTH,
  `Comment body can't be more than ${COMMENT_MAX_LENGTH} characters`
);
var createCommentSchema = z4.object(
  {
    body: bodyField,
    parent_id: z4.string("Parent must be a comment id").min(1, "Parent must be a comment id").nullish()
  },
  "Please provide a valid object"
);
var updateCommentSchema = z4.object(
  {
    body: bodyField
  },
  "Please provide a valid object"
);

// src/app/modules/comment/comment.route.ts
var router5 = Router5();
router5.get("/:taskId/comments", auth_default(), CommentController.getComments);
router5.post(
  "/:taskId/comments",
  auth_default(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  validateRequest_default(createCommentSchema),
  CommentController.createComment
);
router5.patch(
  "/comments/:commentId",
  auth_default(),
  validateRequest_default(updateCommentSchema),
  CommentController.updateComment
);
router5.delete(
  "/comments/:commentId",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN),
  CommentController.deleteComment
);
var CommentRoutes = router5;

// src/app/modules/contact/contact.route.ts
import { Router as Router6 } from "express";

// src/app/modules/contact/contact.controller.ts
import status19 from "http-status";

// src/app/modules/contact/contact.service.ts
import status18 from "http-status";
var DEFAULT_PAGE_LIMIT4 = 10;
var contactSelect = {
  id: true,
  name: true,
  email: true,
  subject: true,
  message: true,
  status: true,
  created_at: true,
  updated_at: true
};
var resolveSupportInbox = async () => {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "support_email" },
    select: { value: true }
  });
  if (typeof setting?.value === "string" && setting.value.length > 0) {
    return setting.value;
  }
  return config_default.admin_email;
};
var notifySupportInbox = async (payload) => {
  try {
    const inbox = await resolveSupportInbox();
    await nodeMailer_default.sendMail({
      from: config_default.email_sender,
      to: inbox,
      subject: `[TaskFlow Contact] ${payload.subject}`,
      text: `New contact message on TaskFlow

Name: ${payload.name}
Email: ${payload.email}
Subject: ${payload.subject}

${payload.message}`
    });
  } catch (error) {
    console.log("Contact notification email could not be sent", error);
  }
};
var createContactMessage = async (payload) => {
  const message = await prisma.contactMessage.create({
    data: payload,
    select: contactSelect
  });
  await notifySupportInbox(payload);
  return message;
};
var listContactMessages = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT4, 1);
  const skip = (page - 1) * limit;
  const statusFilter = typeof query.status === "string" ? query.status : void 0;
  if (statusFilter && !Object.values(ContactStatus).includes(statusFilter)) {
    throw new appError_default(status18.BAD_REQUEST, "Invalid contact status filter");
  }
  const where = statusFilter ? { status: statusFilter } : {};
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      select: contactSelect,
      orderBy: { created_at: "desc" },
      skip,
      take: limit
    }),
    prisma.contactMessage.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: messages, meta };
};
var updateContactStatus = async (actor, messageId, payload) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id: messageId }
  });
  if (!existing) {
    throw new appError_default(status18.NOT_FOUND, "Contact message not found");
  }
  const updated = await prisma.contactMessage.update({
    where: { id: existing.id },
    data: { status: payload.status },
    select: contactSelect
  });
  if (existing.status !== payload.status) {
    await audit_default({
      actor,
      action: "contact.status_changed",
      entity: "contact_message",
      entityId: existing.id,
      meta: { from: existing.status, to: payload.status }
    });
  }
  return updated;
};
var ContactService = {
  createContactMessage,
  listContactMessages,
  updateContactStatus
};

// src/app/modules/contact/contact.controller.ts
var pathParam5 = (value) => value;
var createContactMessage2 = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await ContactService.createContactMessage(payload);
  sendResponse_default(res, {
    status: status19.CREATED,
    message: "Message received. We'll get back to you soon",
    data: result
  });
});
var listContactMessages2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await ContactService.listContactMessages(query);
  sendResponse_default(res, {
    message: "Contact messages fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var updateContactStatus2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ContactService.updateContactStatus(
    user,
    pathParam5(req.params.id),
    req.body
  );
  sendResponse_default(res, {
    message: "Contact message updated Successfully",
    data: result
  });
});
var ContactController = {
  createContactMessage: createContactMessage2,
  listContactMessages: listContactMessages2,
  updateContactStatus: updateContactStatus2
};

// src/app/modules/contact/contact.schema.ts
import z5 from "zod";
var createContactSchema = z5.object(
  {
    name: z5.string("Name is required").trim().min(1, "Name can't be empty").max(100, "Name can't be more than 100 characters"),
    email: z5.email("Invalid email format"),
    subject: z5.string("Subject is required").trim().min(1, "Subject can't be empty").max(150, "Subject can't be more than 150 characters"),
    message: z5.string("Message is required").trim().min(1, "Message can't be empty").max(5e3, "Message can't be more than 5000 characters")
  },
  "Please provide a valid object"
);
var updateContactStatusSchema = z5.object(
  {
    status: z5.enum(ContactStatus, {
      error: "status must be NEW, READ or RESOLVED"
    })
  },
  "Please provide a valid object"
);

// src/app/modules/contact/contact.route.ts
var router6 = Router6();
router6.post(
  "/",
  validateRequest_default(createContactSchema),
  ContactController.createContactMessage
);
router6.get("/", auth_default(Role.ADMIN), ContactController.listContactMessages);
router6.patch(
  "/:id",
  auth_default(Role.ADMIN),
  validateRequest_default(updateContactStatusSchema),
  ContactController.updateContactStatus
);
var ContactRoutes = router6;

// src/app/modules/notification/notification.route.ts
import { Router as Router7 } from "express";

// src/app/modules/notification/notification.controller.ts
var pathParam6 = (value) => value;
var getNotifications2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await NotificationService.getNotifications(user, query);
  sendResponse_default(res, {
    message: "Notifications fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var markAsRead2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationService.markAsRead(
    user,
    pathParam6(req.params.id)
  );
  sendResponse_default(res, {
    message: "Notification marked as read",
    data: result
  });
});
var markAllRead2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationService.markAllRead(user);
  sendResponse_default(res, {
    message: "All notifications marked as read",
    data: result
  });
});
var getUnreadCount2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationService.getUnreadCount(user);
  sendResponse_default(res, {
    message: "Unread count fetched Successfully",
    data: result
  });
});
var NotificationController = {
  getNotifications: getNotifications2,
  markAsRead: markAsRead2,
  markAllRead: markAllRead2,
  getUnreadCount: getUnreadCount2
};

// src/app/modules/notification/notification.route.ts
var router7 = Router7();
router7.get("/", auth_default(), NotificationController.getNotifications);
router7.get("/unread-count", auth_default(), NotificationController.getUnreadCount);
router7.patch("/read-all", auth_default(), NotificationController.markAllRead);
router7.patch("/:id/read", auth_default(), NotificationController.markAsRead);
var NotificationRoutes = router7;

// src/app/modules/payment/payment.route.ts
import { Router as Router8 } from "express";

// src/app/modules/payment/payment.controller.ts
import status20 from "http-status";
var getPlans2 = catchAsync(async (_, res) => {
  const result = await PaymentService.getPlans();
  sendResponse_default(res, {
    message: "Plans fetched successfully",
    data: result
  });
});
var getMySubscription2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await PaymentService.getMySubscription(user);
  sendResponse_default(res, {
    message: "Subscription fetched successfully",
    data: result
  });
});
var createCheckoutSession2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await PaymentService.createCheckoutSession(user, payload);
  sendResponse_default(res, {
    status: status20.OK,
    message: "Checkout session created",
    data: result
  });
});
var verifyPayment2 = catchAsync(async (req, res) => {
  const user = req.user;
  const sessionId = req.query.session_id;
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    throw new appError_default(status20.BAD_REQUEST, "session_id is required");
  }
  const result = await PaymentService.verifyPayment(user, sessionId.trim());
  sendResponse_default(res, {
    message: "Payment verified successfully",
    data: result
  });
});
var handleWebhook2 = catchAsync(async (req, res) => {
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    throw new appError_default(
      status20.BAD_REQUEST,
      "Stripe webhook requires a raw request body"
    );
  }
  const signature = req.headers["stripe-signature"];
  await PaymentService.handleWebhook(
    rawBody,
    typeof signature === "string" ? signature : void 0
  );
  res.status(status20.OK).json({ received: true });
});
var getPaymentHistory2 = catchAsync(async (req, res) => {
  const user = req.user;
  const query = req.query;
  const result = await PaymentService.getPaymentHistory(user, query);
  sendResponse_default(res, {
    message: "Payment history fetched successfully",
    data: result.data,
    meta: result.meta
  });
});
var getAllPayments2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await PaymentService.getAllPayments(query);
  sendResponse_default(res, {
    message: "Payments fetched successfully",
    data: result.data,
    meta: result.meta
  });
});
var PaymentController = {
  getPlans: getPlans2,
  getMySubscription: getMySubscription2,
  createCheckoutSession: createCheckoutSession2,
  verifyPayment: verifyPayment2,
  handleWebhook: handleWebhook2,
  getPaymentHistory: getPaymentHistory2,
  getAllPayments: getAllPayments2
};

// src/app/modules/payment/payment.schema.ts
import z6 from "zod";
var createCheckoutSchema = z6.object(
  {
    plan: z6.enum(Plan, { error: "Plan must be PRO or BUSINESS" }).refine((plan) => plan !== Plan.FREE, {
      message: "Only the PRO and BUSINESS plans can be purchased"
    })
  },
  "Please provide a valid object"
);

// src/app/modules/payment/payment.route.ts
var router8 = Router8();
router8.get("/plans", PaymentController.getPlans);
router8.post("/webhook", PaymentController.handleWebhook);
router8.get(
  "/subscription",
  auth_default(Role.CLIENT),
  PaymentController.getMySubscription
);
router8.post(
  "/checkout",
  auth_default(Role.CLIENT),
  validateRequest_default(createCheckoutSchema),
  PaymentController.createCheckoutSession
);
router8.get("/verify", auth_default(Role.CLIENT), PaymentController.verifyPayment);
router8.get(
  "/history/admin",
  auth_default(Role.ADMIN),
  PaymentController.getAllPayments
);
router8.get("/history", auth_default(Role.CLIENT), PaymentController.getPaymentHistory);
var PaymentRoutes = router8;

// src/app/modules/project/project.route.ts
import { Router as Router9 } from "express";

// src/app/modules/project/project.controller.ts
import status21 from "http-status";
var pathParam7 = (value) => value;
var getMyProjects = catchAsync(async (req, res) => {
  const query = req.query;
  const user = req.user;
  const result = await ProjectService.getAllProjects(query, user);
  sendResponse_default(res, {
    message: "Projects fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var createProject2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await ProjectService.createProject(user, payload);
  sendResponse_default(res, {
    status: status21.CREATED,
    message: "Project created Successfully",
    data: result
  });
});
var getProjectById2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.getProjectById(
    pathParam7(req.params.id),
    user
  );
  sendResponse_default(res, {
    message: "Project fetched Successfully",
    data: result
  });
});
var updateProject2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await ProjectService.updateProject(
    pathParam7(req.params.id),
    user,
    payload
  );
  sendResponse_default(res, {
    message: "Project updated Successfully",
    data: result
  });
});
var deleteProject2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.deleteProject(
    pathParam7(req.params.id),
    user
  );
  sendResponse_default(res, {
    message: "Project deleted Successfully",
    data: result
  });
});
var getProjectMembers2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.getProjectMembers(
    pathParam7(req.params.id),
    user
  );
  sendResponse_default(res, {
    message: "Project members fetched Successfully",
    data: result
  });
});
var removeMember2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.removeMember(
    pathParam7(req.params.id),
    pathParam7(req.params.memberId),
    user
  );
  sendResponse_default(res, {
    message: "Member removed Successfully",
    data: result
  });
});
var inviteMember2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await ProjectService.inviteMember(
    pathParam7(req.params.id),
    user,
    payload
  );
  sendResponse_default(res, {
    status: status21.CREATED,
    message: "Invitation sent Successfully",
    data: result
  });
});
var getProjectInvitations2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.getProjectInvitations(
    pathParam7(req.params.id),
    user
  );
  sendResponse_default(res, {
    message: "Project invitations fetched Successfully",
    data: result
  });
});
var acceptInvitation2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await ProjectService.acceptInvitation(user, payload);
  sendResponse_default(res, {
    message: "Invitation accepted Successfully",
    data: result
  });
});
var declineInvitation2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await ProjectService.declineInvitation(user, payload);
  sendResponse_default(res, {
    message: "Invitation declined Successfully",
    data: result
  });
});
var getMyInvitations2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await ProjectService.getMyInvitations(user);
  sendResponse_default(res, {
    message: "Invitations fetched Successfully",
    data: result
  });
});
var ProjectController = {
  getMyProjects,
  createProject: createProject2,
  getProjectById: getProjectById2,
  updateProject: updateProject2,
  deleteProject: deleteProject2,
  getProjectMembers: getProjectMembers2,
  removeMember: removeMember2,
  inviteMember: inviteMember2,
  getProjectInvitations: getProjectInvitations2,
  acceptInvitation: acceptInvitation2,
  declineInvitation: declineInvitation2,
  getMyInvitations: getMyInvitations2
};

// src/app/modules/project/project.schema.ts
import z7 from "zod";
var createProjectSchema = z7.object(
  {
    name: z7.string("Project name is required").trim().min(1, "Project name can't be empty").max(100, "Project name can't be more than 100 characters"),
    description: z7.string("Description must be text").max(2e3, "Description can't be more than 2000 characters").nullish(),
    status: z7.enum(ProjectStatus).optional(),
    start_date: z7.coerce.date({ error: "Start date is required" }),
    end_date: z7.coerce.date({ error: "End date must be a valid date" }).nullish()
  },
  "Please provide a valid object"
);
var updateProjectSchema = createProjectSchema.partial();
var inviteMemberSchema = z7.object(
  {
    email: z7.email("Invalid email format")
  },
  "Please provide a valid object"
);
var invitationTokenSchema = z7.object(
  {
    token: z7.string("Invitation token is required").min(1, "Invitation token is required")
  },
  "Please provide a valid object"
);

// src/app/modules/project/project.route.ts
var router9 = Router9();
router9.post(
  "/invitations/accept",
  auth_default(Role.TEAM_MEMBER, Role.PROJECT_MANAGER),
  validateRequest_default(invitationTokenSchema),
  ProjectController.acceptInvitation
);
router9.post(
  "/invitations/decline",
  auth_default(Role.TEAM_MEMBER, Role.PROJECT_MANAGER),
  validateRequest_default(invitationTokenSchema),
  ProjectController.declineInvitation
);
router9.get("/invitations/mine", auth_default(), ProjectController.getMyInvitations);
router9.get(
  "/",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER),
  ProjectController.getMyProjects
);
router9.post(
  "/",
  auth_default(Role.PROJECT_MANAGER),
  validateRequest_default(createProjectSchema),
  ProjectController.createProject
);
router9.get(
  "/:id",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER),
  ProjectController.getProjectById
);
router9.patch(
  "/:id",
  auth_default(Role.PROJECT_MANAGER),
  validateRequest_default(updateProjectSchema),
  ProjectController.updateProject
);
router9.delete(
  "/:id",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN),
  ProjectController.deleteProject
);
router9.get(
  "/:id/members",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN, Role.TEAM_MEMBER),
  ProjectController.getProjectMembers
);
router9.delete(
  "/:id/members/:memberId",
  auth_default(Role.PROJECT_MANAGER),
  ProjectController.removeMember
);
router9.post(
  "/:id/invitations",
  auth_default(Role.PROJECT_MANAGER),
  validateRequest_default(inviteMemberSchema),
  ProjectController.inviteMember
);
router9.get(
  "/:id/invitations",
  auth_default(Role.PROJECT_MANAGER),
  ProjectController.getProjectInvitations
);
var ProjectRoutes = router9;

// src/app/modules/task/task.route.ts
import { Router as Router10 } from "express";

// src/app/modules/task/task.controller.ts
import status23 from "http-status";

// src/app/modules/task/task.service.ts
import status22 from "http-status";
var ALLOWED_SORT_FIELDS3 = [
  "title",
  "status",
  "priority",
  "due_date",
  "position",
  "created_at",
  "updated_at"
];
var userBriefSelect4 = {
  id: true,
  name: true,
  avatar_url: true
};
var taskListSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  due_date: true,
  labels: true,
  position: true,
  project_id: true,
  assignee_id: true,
  created_by_id: true,
  created_at: true,
  updated_at: true,
  assignee: { select: userBriefSelect4 },
  project: { select: { id: true, name: true, status: true } },
  _count: { select: { comments: true } }
};
var taskDetailSelect = {
  ...taskListSelect,
  created_by: { select: userBriefSelect4 },
  project: { select: { id: true, name: true, status: true } }
};
var notifyTaskAssignee = async (task, assigneeId) => {
  if (!assigneeId || assigneeId === task.created_by_id) {
    return;
  }
  const creator = await prisma.user.findUnique({
    where: { id: task.created_by_id },
    select: { name: true }
  });
  await NotificationService.createNotification({
    user_id: assigneeId,
    type: NotificationType.TASK_ASSIGNED,
    title: "Task assigned",
    message: `${creator?.name ?? "A teammate"} assigned you to "${task.title}"`,
    link: `/dashboard/tasks/${task.id}`,
    actor_id: task.created_by_id,
    actor_name: creator?.name ?? null
  });
};
var notifyTaskStatusChanged = async (task, newStatus, actorId) => {
  const [project, actor] = await Promise.all([
    prisma.project.findUnique({
      where: { id: task.project_id },
      select: { owner_id: true }
    }),
    prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true }
    })
  ]);
  if (!project) {
    return;
  }
  const recipients = /* @__PURE__ */ new Set();
  if (project.owner_id) {
    recipients.add(project.owner_id);
  }
  if (task.assignee_id) {
    recipients.add(task.assignee_id);
  }
  recipients.delete(actorId);
  const statusLabel = newStatus.replaceAll("_", " ").toLowerCase();
  for (const recipientId of recipients) {
    await NotificationService.createNotification({
      user_id: recipientId,
      type: NotificationType.TASK_STATUS_CHANGED,
      title: "Task status changed",
      message: `${actor?.name ?? "A teammate"} moved "${task.title}" to ${statusLabel}`,
      link: `/dashboard/tasks/${task.id}`,
      actor_id: actorId,
      actor_name: actor?.name ?? null
    });
  }
};
var findTaskOrThrow3 = async (taskId) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new appError_default(status22.NOT_FOUND, "Task not found");
  }
  return task;
};
var findProjectOrThrow4 = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new appError_default(status22.NOT_FOUND, "Project not found");
  }
  return project;
};
var resolveTaskScope = async (projectId, user, mode = "read") => {
  const project = await findProjectOrThrow4(projectId);
  if (user.role === "ADMIN" || project.owner_id === user.id) {
    return { project, seesAll: true };
  }
  const membership = await prisma.projectMember.findUnique({
    where: { project_id_user_id: { project_id: projectId, user_id: user.id } }
  });
  if (!membership) {
    throw new appError_default(
      status22.FORBIDDEN,
      "You are not a member of this project"
    );
  }
  return {
    project,
    seesAll: mode === "read" || user.role === "PROJECT_MANAGER"
  };
};
var assertProjectOwner2 = (project, user) => {
  if (project.owner_id !== user.id) {
    throw new appError_default(
      status22.FORBIDDEN,
      "Only the project owner can perform this action"
    );
  }
};
var assertAssignable = async (project, assigneeId) => {
  if (assigneeId === project.owner_id) {
    return;
  }
  const membership = await prisma.projectMember.findUnique({
    where: {
      project_id_user_id: { project_id: project.id, user_id: assigneeId }
    }
  });
  if (!membership) {
    throw new appError_default(
      status22.BAD_REQUEST,
      "Assignee must be a member of this project"
    );
  }
};
var normalizeEnumFilter = (rawValue, allowedValues, filterName) => {
  const normalized = rawValue.trim().toUpperCase().replaceAll("-", "_");
  if (!allowedValues.includes(normalized)) {
    throw new appError_default(status22.BAD_REQUEST, `Invalid task ${filterName} filter`);
  }
  return normalized;
};
var emptyBoard = () => ({
  TODO: [],
  IN_PROGRESS: [],
  IN_REVIEW: [],
  DONE: []
});
var reindexColumn = async (tx, projectId, column, appendedTaskId) => {
  const columnTasks = await tx.task.findMany({
    where: {
      project_id: projectId,
      status: column,
      ...appendedTaskId ? { id: { not: appendedTaskId } } : {}
    },
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
    select: { id: true, position: true }
  });
  if (appendedTaskId) {
    columnTasks.push({ id: appendedTaskId, position: Number.MAX_SAFE_INTEGER });
  }
  const renames = columnTasks.map((task, index) => ({ id: task.id, position: index + 1 })).filter((row, index) => columnTasks[index]?.position !== row.position);
  for (const row of renames) {
    await tx.task.update({
      where: { id: row.id },
      data: { position: row.position }
    });
  }
};
var createTask = async (user, payload) => {
  const project = await findProjectOrThrow4(payload.projectId);
  assertProjectOwner2(project, user);
  if (project.status === "ARCHIVED") {
    throw new appError_default(
      status22.BAD_REQUEST,
      "Tasks can't be added to an archived project"
    );
  }
  if (payload.assigneeId) {
    await assertAssignable(project, payload.assigneeId);
  }
  const lastPosition = await prisma.task.aggregate({
    where: { project_id: project.id, status: "TODO" },
    _max: { position: true }
  });
  const task = await prisma.task.create({
    data: {
      title: payload.title,
      ...payload.description !== void 0 ? { description: payload.description } : {},
      ...payload.priority !== void 0 ? { priority: payload.priority } : {},
      ...payload.due_date !== void 0 ? { due_date: payload.due_date } : {},
      ...payload.labels !== void 0 ? { labels: payload.labels } : {},
      ...payload.assigneeId !== void 0 ? { assignee_id: payload.assigneeId } : {},
      position: (lastPosition._max.position ?? 0) + 1,
      project_id: project.id,
      created_by_id: user.id
    },
    select: taskDetailSelect
  });
  if (payload.assigneeId) {
    await notifyTaskAssignee(task, payload.assigneeId);
  }
  return task;
};
var getTasks = async (query, user) => {
  const projectId = typeof query.projectId === "string" ? query.projectId.trim() : "";
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy;
  const sortField = sortBy && ALLOWED_SORT_FIELDS3.includes(sortBy) ? sortBy : void 0;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const search = query.search;
  const statusFilter = query.status;
  const priorityFilter = query.priority;
  const assigneeFilter = typeof query.assigneeId === "string" ? query.assigneeId.trim() : "";
  const dueBefore = typeof query.dueBefore === "string" ? query.dueBefore.trim() : "";
  const andConditions = [];
  if (projectId) {
    const { seesAll } = await resolveTaskScope(projectId, user);
    andConditions.push({ project_id: projectId });
    if (!seesAll) {
      andConditions.push({ assignee_id: user.id });
    } else if (assigneeFilter) {
      andConditions.push({ assignee_id: assigneeFilter });
    }
  } else {
    andConditions.push({ assignee_id: user.id });
    andConditions.push({
      project: {
        OR: [
          { owner_id: user.id },
          { members: { some: { user_id: user.id } } }
        ]
      }
    });
  }
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (statusFilter) {
    andConditions.push({
      status: normalizeEnumFilter(
        statusFilter,
        Object.values(TaskStatus),
        "status"
      )
    });
  }
  if (priorityFilter) {
    andConditions.push({
      priority: normalizeEnumFilter(
        priorityFilter,
        Object.values(TaskPriority),
        "priority"
      )
    });
  }
  if (dueBefore) {
    const dueBeforeDate = new Date(dueBefore);
    if (Number.isNaN(dueBeforeDate.getTime())) {
      throw new appError_default(status22.BAD_REQUEST, "Invalid dueBefore filter");
    }
    andConditions.push({ due_date: { lte: dueBeforeDate } });
  }
  const where = { AND: andConditions };
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskListSelect,
      orderBy: sortField ? [{ [sortField]: sortOrder }] : projectId ? [{ position: "asc" }, { created_at: "desc" }] : [{ created_at: "desc" }],
      skip,
      take: limit
    }),
    prisma.task.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: tasks, meta };
};
var getBoard = async (projectId, user) => {
  const trimmedProjectId = typeof projectId === "string" ? projectId.trim() : "";
  if (!trimmedProjectId) {
    throw new appError_default(
      status22.BAD_REQUEST,
      "projectId query parameter is required"
    );
  }
  const { seesAll } = await resolveTaskScope(trimmedProjectId, user);
  const tasks = await prisma.task.findMany({
    where: {
      project_id: trimmedProjectId,
      ...seesAll ? {} : { assignee_id: user.id }
    },
    select: taskListSelect,
    orderBy: [{ position: "asc" }, { created_at: "asc" }]
  });
  const board = emptyBoard();
  for (const task of tasks) {
    const column = board[task.status];
    if (column) {
      column.push(task);
    }
  }
  return board;
};
var getTaskById = async (taskId, user) => {
  const task = await findTaskOrThrow3(taskId);
  await resolveTaskScope(task.project_id, user);
  return await prisma.task.findUniqueOrThrow({
    where: { id: task.id },
    select: taskDetailSelect
  });
};
var updateTask = async (taskId, user, payload) => {
  const task = await findTaskOrThrow3(taskId);
  const project = await findProjectOrThrow4(task.project_id);
  const isProjectOwner = project.owner_id === user.id;
  const isAdmin = user.role === "ADMIN";
  const isAssignee = task.assignee_id === user.id;
  const isTeamMember = user.role === "TEAM_MEMBER";
  if (!isProjectOwner && !isAdmin) {
    if (!(isTeamMember && isAssignee)) {
      assertProjectOwner2(project, user);
    }
  }
  if (isTeamMember && payload.assigneeId !== void 0) {
    throw new appError_default(status22.FORBIDDEN, "You can't reassign this task");
  }
  if (!isTeamMember && payload.assigneeId) {
    await assertAssignable(project, payload.assigneeId);
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...payload.title !== void 0 ? { title: payload.title } : {},
      ...payload.description !== void 0 ? { description: payload.description } : {},
      ...payload.priority !== void 0 ? { priority: payload.priority } : {},
      ...payload.due_date !== void 0 ? { due_date: payload.due_date } : {},
      ...payload.labels !== void 0 ? { labels: payload.labels } : {},
      ...!isTeamMember && payload.assigneeId !== void 0 ? { assignee_id: payload.assigneeId } : {}
    },
    select: taskDetailSelect
  });
  if (!isTeamMember && payload.assigneeId && payload.assigneeId !== task.assignee_id) {
    await notifyTaskAssignee(updated, payload.assigneeId);
  }
  return updated;
};
var deleteTask = async (taskId, user) => {
  const task = await findTaskOrThrow3(taskId);
  const project = await findProjectOrThrow4(task.project_id);
  if (project.owner_id !== user.id && user.role !== "ADMIN") {
    throw new appError_default(
      status22.FORBIDDEN,
      "Only the project owner can delete this task"
    );
  }
  await prisma.task.delete({ where: { id: task.id } });
  await audit_default({
    actor: user,
    action: "task.deleted",
    entity: "task",
    entityId: task.id,
    meta: { title: task.title, project_id: task.project_id }
  });
  return { id: task.id, title: task.title };
};
var moveTask = async (taskId, user, payload) => {
  const task = await findTaskOrThrow3(taskId);
  if (user.role === "ADMIN") {
    throw new appError_default(
      status22.FORBIDDEN,
      "You are not allowed to move tasks on this board"
    );
  }
  const { project } = await resolveTaskScope(task.project_id, user, "write");
  const isProjectOwner = project.owner_id === user.id;
  const isAssignee = task.assignee_id === user.id;
  if (!isProjectOwner && !isAssignee && user.role !== "PROJECT_MANAGER") {
    throw new appError_default(
      status22.FORBIDDEN,
      "You can only move tasks assigned to you"
    );
  }
  const previousStatus = task.status;
  const updated = await prisma.$transaction(async (tx) => {
    if (previousStatus !== payload.status) {
      await tx.task.update({
        where: { id: task.id },
        data: { status: payload.status }
      });
    }
    await reindexColumn(tx, project.id, payload.status, task.id);
    if (previousStatus !== payload.status) {
      await reindexColumn(tx, project.id, previousStatus);
    }
    return await tx.task.findUniqueOrThrow({
      where: { id: task.id },
      select: taskDetailSelect
    });
  });
  if (previousStatus !== payload.status) {
    await notifyTaskStatusChanged(updated, payload.status, user.id);
  }
  return updated;
};
var assignTask = async (taskId, user, payload) => {
  const task = await findTaskOrThrow3(taskId);
  const project = await findProjectOrThrow4(task.project_id);
  assertProjectOwner2(project, user);
  if (payload.assigneeId) {
    await assertAssignable(project, payload.assigneeId);
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { assignee_id: payload.assigneeId },
    select: taskDetailSelect
  });
  if (payload.assigneeId) {
    await notifyTaskAssignee(updated, payload.assigneeId);
  }
  return updated;
};
var TaskService = {
  createTask,
  getTasks,
  getBoard,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  assignTask
};

// src/app/modules/task/task.controller.ts
var pathParam8 = (value) => value;
var getTasks2 = catchAsync(async (req, res) => {
  const query = req.query;
  const user = req.user;
  const result = await TaskService.getTasks(query, user);
  sendResponse_default(res, {
    message: "Tasks fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var createTask2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await TaskService.createTask(user, payload);
  sendResponse_default(res, {
    status: status23.CREATED,
    message: "Task created Successfully",
    data: result
  });
});
var getBoard2 = catchAsync(async (req, res) => {
  const user = req.user;
  const projectId = req.query.projectId;
  const result = await TaskService.getBoard(projectId ?? "", user);
  sendResponse_default(res, {
    message: "Task board fetched Successfully",
    data: result
  });
});
var getTaskById2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await TaskService.getTaskById(pathParam8(req.params.id), user);
  sendResponse_default(res, {
    message: "Task fetched Successfully",
    data: result
  });
});
var updateTask2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await TaskService.updateTask(
    pathParam8(req.params.id),
    user,
    payload
  );
  sendResponse_default(res, {
    message: "Task updated Successfully",
    data: result
  });
});
var deleteTask2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await TaskService.deleteTask(pathParam8(req.params.id), user);
  sendResponse_default(res, {
    message: "Task deleted Successfully",
    data: result
  });
});
var moveTask2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await TaskService.moveTask(
    pathParam8(req.params.id),
    user,
    payload
  );
  sendResponse_default(res, {
    message: "Task moved Successfully",
    data: result
  });
});
var assignTask2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await TaskService.assignTask(
    pathParam8(req.params.id),
    user,
    payload
  );
  sendResponse_default(res, {
    message: "Task assigned Successfully",
    data: result
  });
});
var TaskController = {
  getTasks: getTasks2,
  createTask: createTask2,
  getBoard: getBoard2,
  getTaskById: getTaskById2,
  updateTask: updateTask2,
  deleteTask: deleteTask2,
  moveTask: moveTask2,
  assignTask: assignTask2
};

// src/app/modules/task/task.schema.ts
import z8 from "zod";
var LABEL_MAX_LENGTH = 30;
var LABELS_MAX_COUNT = 10;
var createTaskSchema = z8.object(
  {
    projectId: z8.string("Project is required").min(1, "Project is required"),
    title: z8.string("Task title is required").trim().min(1, "Task title can't be empty").max(200, "Task title can't be more than 200 characters"),
    description: z8.string("Description must be text").max(5e3, "Description can't be more than 5000 characters").nullish(),
    priority: z8.enum(TaskPriority, { error: "Invalid task priority" }).optional(),
    due_date: z8.coerce.date({ error: "Due date must be a valid date" }).nullish(),
    labels: z8.array(
      z8.string("Labels must be text").trim().min(1, "Labels can't contain empty values").max(
        LABEL_MAX_LENGTH,
        `A label can't be more than ${LABEL_MAX_LENGTH} characters`
      )
    ).max(LABELS_MAX_COUNT, `You can add up to ${LABELS_MAX_COUNT} labels`).optional(),
    assigneeId: z8.string("Assignee must be a user id").min(1, "Assignee must be a user id").nullish()
  },
  "Please provide a valid object"
);
var updateTaskSchema = createTaskSchema.omit({ projectId: true }).partial();
var updateTaskStatusSchema = z8.object(
  {
    status: z8.enum(TaskStatus, { error: "Task status is required" })
  },
  "Please provide a valid object"
);
var assignTaskSchema = z8.object(
  {
    assigneeId: z8.string("Assignee must be a user id").min(1, "Assignee must be a user id").nullable()
  },
  "Please provide a valid object"
);

// src/app/modules/task/task.route.ts
var router10 = Router10();
router10.get("/", auth_default(), TaskController.getTasks);
router10.post(
  "/",
  auth_default(Role.PROJECT_MANAGER),
  validateRequest_default(createTaskSchema),
  TaskController.createTask
);
router10.get("/board", auth_default(), TaskController.getBoard);
router10.get("/:id", auth_default(), TaskController.getTaskById);
router10.patch(
  "/:id",
  auth_default(Role.PROJECT_MANAGER, Role.TEAM_MEMBER),
  validateRequest_default(updateTaskSchema),
  TaskController.updateTask
);
router10.delete(
  "/:id",
  auth_default(Role.PROJECT_MANAGER, Role.ADMIN),
  TaskController.deleteTask
);
router10.patch(
  "/:id/status",
  auth_default(),
  validateRequest_default(updateTaskStatusSchema),
  TaskController.moveTask
);
router10.patch(
  "/:id/assign",
  auth_default(Role.PROJECT_MANAGER),
  validateRequest_default(assignTaskSchema),
  TaskController.assignTask
);
var TaskRoutes = router10;

// src/app/modules/user/user.route.ts
import { Router as Router11 } from "express";

// src/app/modules/user/user.service.ts
import status24 from "http-status";

// src/app/utils/uploadImage.ts
import streamifier from "streamifier";
var uploadImage = async (buffer, options) => {
  return await new Promise((resolve, reject) => {
    if (!buffer) {
      return resolve(null);
    }
    const upload_stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
        ...options
      },
      (err, result) => {
        if (err || !result) {
          console.log("Cloudinary error", err);
          return reject(
            new appError_default(err?.http_code, err?.message)
          );
        }
        return resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(upload_stream);
  });
};
var uploadImage_default = uploadImage;

// src/app/modules/user/user.service.ts
var ALLOWED_SORT_FIELDS4 = [
  "name",
  "email",
  "created_at",
  "last_login_at",
  "role",
  "user_status"
];
var userSelect = {
  id: true,
  name: true,
  email: true,
  avatar_url: true,
  role: true,
  user_status: true,
  is_active: true,
  is_verified: true,
  last_login_at: true,
  created_at: true
};
var getAllUsers = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy;
  const sortField = sortBy && ALLOWED_SORT_FIELDS4.includes(sortBy) ? sortBy : "created_at";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const search = query.search;
  const roleFilter = query.role;
  const statusFilter = query.status;
  const andConditions = [{ is_deleted: false }];
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }
  if (roleFilter) {
    andConditions.push({ role: roleFilter });
  }
  if (statusFilter) {
    andConditions.push({ user_status: statusFilter });
  }
  const where = { AND: andConditions };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit
    }),
    prisma.user.count({ where })
  ]);
  const meta = {
    page,
    limit,
    dataCount: total,
    totalPages: Math.ceil(total / limit) || 1
  };
  return { data: users, meta };
};
var getMyProfile = async (userId) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true }
  });
  if (!userProfile) {
    throw new appError_default(status24.NOT_FOUND, "User profile not found");
  }
  return userProfile;
};
var updateProfile = async (user, payload) => {
  const { name, email } = payload;
  if (email && email !== user.email) {
    const isEmailTaken = await prisma.user.findUnique({
      where: { email }
    });
    if (isEmailTaken) {
      throw new appError_default(status24.CONFLICT, "This email is already in use");
    }
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...name ? { name } : {},
      ...email ? { email } : {}
    },
    omit: { password: true }
  });
  return updatedUser;
};
var changePassword = async (user, payload) => {
  const { current_password, new_password } = payload;
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  });
  if (!existingUser) {
    throw new appError_default(status24.NOT_FOUND, "User not found");
  }
  if (!existingUser.password) {
    throw new appError_default(
      status24.BAD_REQUEST,
      "No password is set for this account"
    );
  }
  const isCurrentPasswordValid = await comparePassword(
    current_password,
    existingUser.password
  );
  if (!isCurrentPasswordValid) {
    throw new appError_default(status24.UNAUTHORIZED, "Current password is incorrect");
  }
  const hashedPassword = await hashPassword(new_password);
  await prisma.user.update({
    where: { id: user.id },
    // a deliberate password change also lifts the forced-change flag that
    // reset-password may have set
    data: { password: hashedPassword, need_password_change: false }
  });
  return true;
};
var updateAvatar = async (user, avatar) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  });
  if (!existingUser) {
    throw new appError_default(status24.NOT_FOUND, "User not found");
  }
  const avatarDetails = await uploadImage_default(avatar.buffer, {
    folder: "profile/avatar"
  });
  if (!avatarDetails) {
    throw new appError_default(status24.BAD_REQUEST, "Avatar file is required");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatar_url: avatarDetails.secure_url,
      avatar_public_id: avatarDetails.public_id
    }
  });
  if (existingUser.avatar_public_id) {
    await cloudinary.uploader.destroy(existingUser.avatar_public_id);
  }
  return avatarDetails.secure_url;
};
var UserService = {
  getAllUsers,
  getMyProfile,
  updateProfile,
  changePassword,
  updateAvatar
};

// src/app/modules/user/user.controller.ts
var getAllUsers2 = catchAsync(async (req, res) => {
  const query = req.query;
  const result = await UserService.getAllUsers(query);
  sendResponse_default(res, {
    message: "Users fetched Successfully",
    data: result.data,
    meta: result.meta
  });
});
var getMyProfile2 = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const result = await UserService.getMyProfile(userId);
  sendResponse_default(res, {
    message: "Profile data fetched Successfully",
    data: result
  });
});
var updateProfile2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const result = await UserService.updateProfile(user, payload);
  sendResponse_default(res, {
    message: "Profile updated Successfully",
    data: result
  });
});
var changePassword2 = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  await UserService.changePassword(user, payload);
  sendResponse_default(res, {
    message: "Password changed Successfully"
  });
});
var updateAvatar2 = catchAsync(async (req, res) => {
  const avatar = req.file;
  const user = req.user;
  const result = await UserService.updateAvatar(user, avatar);
  sendResponse_default(res, {
    message: "Avatar updated Successfully",
    data: { avatar_url: result }
  });
});
var UserController = {
  getAllUsers: getAllUsers2,
  getMyProfile: getMyProfile2,
  updateProfile: updateProfile2,
  changePassword: changePassword2,
  updateAvatar: updateAvatar2
};

// src/app/modules/user/user.schema.ts
import z9 from "zod";
var passwordField2 = z9.string("password is required").min(8, "password must be 8 characters long").max(24, "password can't be more that 24 characters").regex(/[a-z]/, "password should have one small letter").regex(/[A-Z]/, "password should have one capital letter");
var updateProfileSchema = z9.object({
  name: z9.string("Name must be string").min(1, "Name can't be empty").optional(),
  email: z9.email("Invalid email format").optional()
});
var changePasswordSchema = z9.object({
  current_password: z9.string("Current password is required"),
  new_password: passwordField2
});
var updateAvatarSchema = z9.object({
  avatar: multerFileSchema
});

// src/app/modules/user/user.route.ts
var router11 = Router11();
router11.get("/", auth_default(Role.ADMIN), UserController.getAllUsers);
router11.get("/me", auth_default(), UserController.getMyProfile);
router11.patch(
  "/me",
  auth_default(),
  validateRequest_default(updateProfileSchema),
  UserController.updateProfile
);
router11.patch(
  "/me/password",
  auth_default(),
  validateRequest_default(changePasswordSchema),
  UserController.changePassword
);
router11.patch(
  "/me/avatar",
  auth_default(),
  multer_default.single("avatar"),
  mergeMulterPayload_default("avatar"),
  validateRequest_default(updateAvatarSchema),
  UserController.updateAvatar
);
var UserRoutes = router11;

// src/app.ts
var app = express();
app.use(
  cors({
    origin: config_default.frontend_url,
    credentials: true
  })
);
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/v1", maintenance_default);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/projects", ProjectRoutes);
app.use("/api/v1/tasks", TaskRoutes);
app.use("/api/v1/tasks", CommentRoutes);
app.use("/api/v1/tasks", AttachmentRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/contact", ContactRoutes);
app.get("/", async (_, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});
app.use(globalErrorHandler_default);
app.use(notFound);
var app_default = app;

// src/app/utils/seed.ts
import path7 from "path";
import { pathToFileURL } from "url";
var DAY_MS = 24 * 60 * 60 * 1e3;
var daysFromNow = (days) => new Date(Date.now() + days * DAY_MS);
var seedId = (tag, index) => `${tag}0000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
var seedAdmin = async () => {
  const adminEmail = config_default.admin_email;
  const adminPassword = config_default.admin_password;
  if (!adminEmail || !adminPassword) {
    return console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set, env admin not seeded"
    );
  }
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  if (existingAdmin) {
    if (existingAdmin.role !== "ADMIN" || !existingAdmin.is_verified) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: "ADMIN", is_verified: true }
      });
      return console.log("Admin account role/verification restored");
    }
    return console.log("Admin exists");
  }
  const hashedPassword = await hashPassword(adminPassword);
  await prisma.user.create({
    data: {
      name: config_default.admin_name || "TaskFlow Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      provider: "CREDENTIALS",
      user_status: "ACTIVE",
      is_verified: true
    }
  });
  return console.log("Admin created");
};
var DEMO_ACCOUNTS = [
  {
    id: seedId("a", 1),
    name: "TaskFlow Admin",
    email: "admin@taskflow.dev",
    password: "Admin@123",
    role: Role.ADMIN
  },
  {
    id: seedId("a", 2),
    name: "Maya Manager",
    email: "manager@taskflow.dev",
    password: "Manager@123",
    role: Role.PROJECT_MANAGER
  },
  {
    id: seedId("a", 3),
    name: "Mia Member",
    email: "member@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 4),
    name: "Alex Rivera",
    email: "alex@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 5),
    name: "Priya Nair",
    email: "priya@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 6),
    name: "Sam Okafor",
    email: "sam@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 7),
    name: "Taylor Brooks",
    email: "taylor@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 8),
    name: "Noah Chen",
    email: "noah@taskflow.dev",
    password: "Member@123",
    role: Role.TEAM_MEMBER
  },
  {
    id: seedId("a", 9),
    name: "Cleo Client",
    email: "client@taskflow.dev",
    password: "Client@123",
    role: Role.CLIENT
  }
];
var ACCOUNT_BY_EMAIL = new Map(
  DEMO_ACCOUNTS.map((account2) => [account2.email, account2])
);
var account = (email) => {
  const found = ACCOUNT_BY_EMAIL.get(email);
  if (!found) {
    throw new Error(`Seed account "${email}" is not defined`);
  }
  return found;
};
var MEMBER_EMAILS = [
  "member@taskflow.dev",
  "alex@taskflow.dev",
  "priya@taskflow.dev",
  "sam@taskflow.dev",
  "taylor@taskflow.dev",
  "noah@taskflow.dev"
];
var seedAccounts = async () => {
  for (const demo of DEMO_ACCOUNTS) {
    const password = await hashPassword(demo.password);
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
        password,
        role: demo.role,
        user_status: UserStatus.ACTIVE,
        is_active: true,
        is_verified: true,
        // a fresh seed run also lifts any forced-password-change flag
        need_password_change: false
      },
      create: {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        password,
        role: demo.role,
        provider: "CREDENTIALS",
        user_status: UserStatus.ACTIVE,
        is_active: true,
        is_verified: true,
        need_password_change: false
      }
    });
  }
  console.log(`${DEMO_ACCOUNTS.length} demo accounts ready`);
};
var seedSubscription = async (ownerId) => {
  const data = {
    plan: Plan.PRO,
    status: SubscriptionStatus.ACTIVE,
    current_period_end: daysFromNow(20),
    cancel_at_period_end: false
  };
  const existing = await prisma.subscription.findFirst({
    where: { owner_id: ownerId }
  });
  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data });
    return;
  }
  await prisma.subscription.create({ data: { ...data, owner_id: ownerId } });
};
var seedPayments = async (ownerId) => {
  const now = /* @__PURE__ */ new Date();
  const rows = [
    {
      transaction_id: "ch_seed_pro_last_month",
      created_at: new Date(now.getFullYear(), now.getMonth() - 1, 15, 10)
    },
    {
      transaction_id: "ch_seed_pro_this_month",
      created_at: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10
      )
    }
  ];
  for (const [index, row] of rows.entries()) {
    await prisma.payment.upsert({
      where: { transaction_id: row.transaction_id },
      update: {
        owner_id: ownerId,
        plan: Plan.PRO,
        amount: 12,
        status: PaymentStatus.SUCCESS,
        created_at: row.created_at
      },
      create: {
        id: seedId("7", index + 1),
        transaction_id: row.transaction_id,
        plan: Plan.PRO,
        amount: 12,
        currency: "USD",
        status: PaymentStatus.SUCCESS,
        payment_gateway: PaymentGateway.STRIPE,
        owner_id: ownerId,
        created_at: row.created_at
      }
    });
  }
  console.log("Pro subscription + 2 payments ready");
};
var PROJECT_SPECS = [
  {
    id: seedId("b", 1),
    name: "Website Redesign",
    description: "Rebuild the marketing site with a new information architecture, refreshed visual system and a faster frontend.",
    status: ProjectStatus.ACTIVE,
    startDaysAgo: 60,
    endInDays: 30,
    members: [0, 1, 2, 3, 4, 5]
  },
  {
    id: seedId("b", 2),
    name: "Mobile App Launch",
    description: "Ship the first public release of the iOS/Android companion app, including onboarding, push notifications and store assets.",
    status: ProjectStatus.ACTIVE,
    startDaysAgo: 30,
    endInDays: 60,
    members: [0, 1, 2, 3]
  },
  {
    id: seedId("b", 3),
    name: "Brand Guidelines",
    description: "Document the color, typography and logo rules the whole product and marketing team has to follow.",
    status: ProjectStatus.COMPLETED,
    startDaysAgo: 120,
    endInDays: 20,
    members: [0, 1, 2]
  }
];
var seedProjects = async (ownerId) => {
  for (const spec of PROJECT_SPECS) {
    await prisma.project.upsert({
      where: { id: spec.id },
      update: {
        name: spec.name,
        description: spec.description,
        status: spec.status,
        start_date: daysFromNow(-spec.startDaysAgo),
        end_date: spec.endInDays === null ? null : daysFromNow(spec.endInDays),
        owner_id: ownerId
      },
      create: {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        status: spec.status,
        start_date: daysFromNow(-spec.startDaysAgo),
        end_date: spec.endInDays === null ? null : daysFromNow(spec.endInDays),
        owner_id: ownerId
      }
    });
    for (const memberIndex of spec.members) {
      const member = account(MEMBER_EMAILS[memberIndex]);
      await prisma.projectMember.upsert({
        where: {
          project_id_user_id: {
            project_id: spec.id,
            user_id: member.id
          }
        },
        update: {},
        create: { project_id: spec.id, user_id: member.id }
      });
    }
  }
  console.log(`${PROJECT_SPECS.length} projects + memberships ready`);
};
var TASK_SPECS = [
  // --- Website Redesign (2 of each status, 1 overdue, 2 due within 24h)
  {
    index: 1,
    project: 0,
    title: "Audit current site map",
    description: "Inventory every live URL and flag redirect candidates.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    labels: ["research"],
    dueIn: null,
    assignee: 0
  },
  {
    index: 2,
    project: 0,
    title: "Design new homepage mockups",
    description: "Desktop and mobile layouts for the new hero and feature grid.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    labels: ["design", "frontend"],
    dueIn: 0.7,
    assignee: 0
  },
  {
    index: 3,
    project: 0,
    title: "Build hero section",
    description: "Implement the approved hero with responsive breakpoints.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    labels: ["frontend"],
    dueIn: 5,
    assignee: 4
  },
  {
    index: 4,
    project: 0,
    title: "Migrate blog content",
    description: "Move the 42 legacy posts into the new CMS structure.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    labels: ["content"],
    dueIn: 10,
    assignee: 2
  },
  {
    index: 5,
    project: 0,
    title: "Set up analytics events",
    description: "Track CTA clicks, form starts and newsletter signups.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    labels: ["analytics"],
    dueIn: 0.5,
    assignee: 5
  },
  {
    index: 6,
    project: 0,
    title: "Accessibility audit",
    description: "WCAG 2.2 AA pass over the key templates \u2014 overdue.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.URGENT,
    labels: ["qa", "a11y"],
    dueIn: -3,
    assignee: 1
  },
  {
    index: 7,
    project: 0,
    title: "Client review round 2",
    description: "Consolidate feedback from the stakeholder walkthrough.",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    labels: ["design"],
    dueIn: null,
    assignee: 4
  },
  {
    index: 8,
    project: 0,
    title: "Navigation copy review",
    description: "Tighten menu labels before handoff.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.MEDIUM,
    labels: ["content", "review"],
    dueIn: 2,
    assignee: 5
  },
  // --- Mobile App Launch (2 of each status, 1 overdue)
  {
    index: 9,
    project: 1,
    title: "Define onboarding flow",
    description: "First-run experience from signup to first project.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    labels: ["product"],
    dueIn: null,
    assignee: 0
  },
  {
    index: 10,
    project: 1,
    title: "Implement push notifications",
    description: "Task assigned + deadline reminders on both platforms.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    labels: ["mobile", "backend"],
    dueIn: 0.9,
    assignee: 0
  },
  {
    index: 11,
    project: 1,
    title: "App store screenshots",
    description: "Localized screenshot set for the store listings.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    labels: ["marketing"],
    dueIn: 7,
    assignee: 3
  },
  {
    index: 12,
    project: 1,
    title: "Beta tester recruitment",
    description: "Recruit 50 testers through the newsletter.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    labels: ["marketing"],
    dueIn: 14,
    assignee: 0
  },
  {
    index: 13,
    project: 1,
    title: "Crash reporting setup",
    description: "Wire symbolication and alerting for release builds.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    labels: ["mobile", "qa"],
    dueIn: null,
    assignee: 1
  },
  {
    index: 14,
    project: 1,
    title: "Localize strings",
    description: "Extract every user-facing string \u2014 overdue.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.HIGH,
    labels: ["mobile", "i18n"],
    dueIn: -20,
    assignee: 2
  },
  {
    index: 15,
    project: 1,
    title: "Performance profiling",
    description: "Cold start and scroll frame profiling on mid-range devices.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    labels: ["mobile"],
    dueIn: null,
    assignee: 3
  },
  {
    index: 16,
    project: 1,
    title: "Release notes v1.0",
    description: "Draft store copy and in-app changelog.",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.LOW,
    labels: ["marketing"],
    dueIn: 3,
    assignee: 1
  },
  // --- Brand Guidelines (completed project: every task DONE, no deadlines)
  {
    index: 17,
    project: 2,
    title: "Collect brand references",
    description: "Competitor and aspiration boards.",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    labels: ["research"],
    dueIn: null,
    assignee: 1
  },
  {
    index: 18,
    project: 2,
    title: "Draft color palette",
    description: "Primary, secondary and semantic color ramps.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    labels: ["design"],
    dueIn: null,
    assignee: 2
  },
  {
    index: 19,
    project: 2,
    title: "Typography selection",
    description: "Heading/body pairing with license review.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    labels: ["design"],
    dueIn: null,
    assignee: 0
  },
  {
    index: 20,
    project: 2,
    title: "Logo usage rules",
    description: "Clear space, minimum size and misuse examples.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    labels: ["design"],
    dueIn: null,
    assignee: 1
  },
  {
    index: 21,
    project: 2,
    title: "Finalize icon set",
    description: "24px grid icons for the product UI.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    labels: ["design"],
    dueIn: null,
    assignee: 2
  },
  {
    index: 22,
    project: 2,
    title: "Publish guidelines PDF",
    description: "Export and share the final document.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    labels: ["docs"],
    dueIn: null,
    assignee: 1
  },
  {
    index: 23,
    project: 2,
    title: "Team walkthrough session",
    description: "Walk the whole company through the rules.",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    labels: ["docs"],
    dueIn: null,
    assignee: 2
  },
  {
    index: 24,
    project: 2,
    title: "Archive source files",
    description: "Move working files to the archive bucket.",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    labels: ["ops"],
    dueIn: null,
    assignee: 2
  }
];
var seedTasks = async () => {
  const positions = /* @__PURE__ */ new Map();
  for (const spec of TASK_SPECS) {
    const project = PROJECT_SPECS[spec.project];
    if (!project) {
      throw new Error(`Task ${spec.index} points at an unknown project`);
    }
    const column = `${project.id}:${spec.status}`;
    const nextPosition = (positions.get(column) ?? 0) + 1;
    positions.set(column, nextPosition);
    const assignee = account(MEMBER_EMAILS[spec.assignee]);
    const creator = account("manager@taskflow.dev");
    const dueDate = spec.dueIn === null ? null : daysFromNow(spec.dueIn);
    const data = {
      title: spec.title,
      description: spec.description,
      status: spec.status,
      priority: spec.priority,
      labels: spec.labels,
      due_date: dueDate,
      position: nextPosition,
      project_id: project.id,
      assignee_id: assignee.id,
      created_by_id: creator.id
    };
    await prisma.task.upsert({
      where: { id: seedId("c", spec.index) },
      update: data,
      create: { id: seedId("c", spec.index), ...data }
    });
  }
  console.log(`${TASK_SPECS.length} tasks ready`);
};
var COMMENT_SPECS = [
  {
    id: seedId("d", 1),
    taskIndex: 2,
    authorEmail: "manager@taskflow.dev",
    body: "Love this direction \u2014 can we push the hero headline a touch larger?",
    parentId: null,
    createdDaysAgo: 6
  },
  {
    id: seedId("d", 2),
    taskIndex: 2,
    authorEmail: "member@taskflow.dev",
    body: "Agreed. I'll also tighten the spacing below the fold.",
    parentId: null,
    createdDaysAgo: 5
  },
  {
    id: seedId("d", 3),
    taskIndex: 2,
    authorEmail: "alex@taskflow.dev",
    body: "Mockups are in the shared drive \u2014 ready for review.",
    parentId: null,
    createdDaysAgo: 4
  },
  {
    id: seedId("d", 4),
    taskIndex: 2,
    authorEmail: "manager@taskflow.dev",
    body: "Bumped it to 72px in the latest revision.",
    parentId: seedId("d", 1),
    createdDaysAgo: 3
  }
];
var seedComments = async () => {
  for (const spec of COMMENT_SPECS) {
    const task_id = seedId("c", spec.taskIndex);
    const author = account(spec.authorEmail);
    const data = {
      body: spec.body,
      task_id,
      author_id: author.id,
      parent_id: spec.parentId,
      created_at: daysFromNow(-spec.createdDaysAgo)
    };
    await prisma.comment.upsert({
      where: { id: spec.id },
      update: data,
      create: { id: spec.id, ...data }
    });
  }
  console.log(`${COMMENT_SPECS.length} comments ready`);
};
var seedNotifications = async () => {
  const member = account("member@taskflow.dev");
  const manager = account("manager@taskflow.dev");
  const alex = account("alex@taskflow.dev");
  const taskLink = `/dashboard/tasks/${seedId("c", 2)}`;
  const rows = [
    {
      id: seedId("e", 1),
      type: NotificationType.TASK_ASSIGNED,
      title: "Task assigned",
      message: 'Maya Manager assigned you to "Design new homepage mockups"',
      link: taskLink,
      is_read: true,
      actor_id: manager.id,
      actor_name: manager.name,
      created_at: daysFromNow(-3)
    },
    {
      id: seedId("e", 2),
      type: NotificationType.COMMENT_ADDED,
      title: "New comment",
      message: 'Alex Rivera commented on "Design new homepage mockups"',
      link: taskLink,
      is_read: false,
      actor_id: alex.id,
      actor_name: alex.name,
      created_at: daysFromNow(-1)
    },
    {
      id: seedId("e", 3),
      type: NotificationType.DEADLINE_APPROACHING,
      title: "Deadline approaching",
      message: 'Task "Design new homepage mockups" is due within the next 24 hours',
      link: taskLink,
      is_read: false,
      actor_id: null,
      actor_name: null,
      created_at: daysFromNow(-0.25)
    }
  ];
  for (const row of rows) {
    await prisma.notification.upsert({
      where: { id: row.id },
      update: {
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        is_read: row.is_read,
        user_id: member.id,
        actor_id: row.actor_id,
        actor_name: row.actor_name,
        created_at: row.created_at
      },
      create: { ...row, user_id: member.id }
    });
  }
  const client = account("client@taskflow.dev");
  const clientRows = [
    {
      id: seedId("e", 4),
      type: NotificationType.PAYMENT_SUCCESS,
      title: "Payment successful",
      message: "Your Pro plan is active \u2014 $12.00 USD paid.",
      link: "/client/subscription",
      is_read: false,
      created_at: daysFromNow(-2)
    }
  ];
  for (const row of clientRows) {
    await prisma.notification.upsert({
      where: { id: row.id },
      update: {
        type: row.type,
        title: row.title,
        message: row.message,
        link: row.link,
        is_read: row.is_read,
        user_id: client.id,
        actor_id: null,
        actor_name: null,
        created_at: row.created_at
      },
      create: {
        ...row,
        user_id: client.id,
        actor_id: null,
        actor_name: null
      }
    });
  }
  console.log(`${rows.length + clientRows.length} notifications ready`);
};
var CONTACT_SEEDS = [
  {
    id: seedId("f", 1),
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    subject: "Question about the Business plan",
    message: "Do you support invoiced billing and SSO on the Business plan? We're a team of 40 and procurement needs a PO flow.",
    status: ContactStatus.NEW,
    createdDaysAgo: 1
  },
  {
    id: seedId("f", 2),
    name: "Rita Chen",
    email: "rita.chen@example.com",
    subject: "API rate limits",
    message: "What is the rate limit on the public API? We're building a reporting sync and want to stay well inside it.",
    status: ContactStatus.READ,
    createdDaysAgo: 4
  }
];
var seedContacts = async () => {
  for (const row of CONTACT_SEEDS) {
    const data = {
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      created_at: daysFromNow(-row.createdDaysAgo)
    };
    await prisma.contactMessage.upsert({
      where: { id: row.id },
      update: data,
      create: { id: row.id, ...data }
    });
  }
  console.log(`${CONTACT_SEEDS.length} contact messages ready`);
};
var seedAuditLogs = async () => {
  const admin = account("admin@taskflow.dev");
  const manager = account("manager@taskflow.dev");
  const member = account("member@taskflow.dev");
  const rows = [
    {
      index: 1,
      actor: manager,
      action: "project.created",
      entity: "project",
      entity_id: PROJECT_SPECS[2]?.id ?? null,
      meta: { name: "Brand Guidelines", status: ProjectStatus.COMPLETED },
      createdDaysAgo: 120
    },
    {
      index: 2,
      actor: manager,
      action: "project.created",
      entity: "project",
      entity_id: PROJECT_SPECS[0]?.id ?? null,
      meta: { name: "Website Redesign", status: ProjectStatus.ACTIVE },
      createdDaysAgo: 60
    },
    {
      index: 3,
      actor: manager,
      action: "project.created",
      entity: "project",
      entity_id: PROJECT_SPECS[1]?.id ?? null,
      meta: { name: "Mobile App Launch", status: ProjectStatus.ACTIVE },
      createdDaysAgo: 30
    },
    {
      index: 4,
      actor: member,
      action: "invitation.accepted",
      entity: "project_invitation",
      // invitations are consumed by the flow, so the id is not kept around
      entity_id: null,
      meta: {
        project_id: PROJECT_SPECS[0]?.id ?? null,
        project_name: "Website Redesign"
      },
      createdDaysAgo: 25
    },
    {
      index: 5,
      actor: admin,
      action: "settings.updated",
      entity: "platform_setting",
      entity_id: null,
      meta: { updated: ["registration_open"] },
      createdDaysAgo: 15
    },
    {
      index: 6,
      actor: manager,
      action: "project.updated",
      entity: "project",
      entity_id: PROJECT_SPECS[2]?.id ?? null,
      meta: { name: "Brand Guidelines", status: ProjectStatus.COMPLETED },
      createdDaysAgo: 20
    },
    {
      index: 7,
      actor: manager,
      action: "payment.success",
      entity: "payment",
      entity_id: "ch_seed_pro_last_month",
      meta: { plan: Plan.PRO, amount: 12, currency: "USD" },
      createdDaysAgo: 30
    },
    {
      index: 8,
      actor: manager,
      action: "payment.success",
      entity: "payment",
      entity_id: "ch_seed_pro_this_month",
      meta: { plan: Plan.PRO, amount: 12, currency: "USD" },
      createdDaysAgo: 10
    },
    {
      index: 9,
      actor: manager,
      action: "task.deleted",
      entity: "task",
      entity_id: seedId("c", 99),
      meta: {
        title: "Old pricing page draft",
        project_id: PROJECT_SPECS[0]?.id ?? null
      },
      createdDaysAgo: 7
    },
    {
      index: 10,
      actor: admin,
      action: "contact.status_changed",
      entity: "contact_message",
      entity_id: CONTACT_SEEDS[1]?.id ?? null,
      meta: { from: ContactStatus.NEW, to: ContactStatus.READ },
      createdDaysAgo: 3
    }
  ];
  for (const row of rows) {
    const data = {
      actor_id: row.actor.id,
      actor_name: row.actor.name,
      actor_role: row.actor.role,
      action: row.action,
      entity: row.entity,
      entity_id: row.entity_id,
      meta: row.meta,
      created_at: daysFromNow(-row.createdDaysAgo)
    };
    await prisma.auditLog.upsert({
      where: { id: seedId("9", row.index) },
      update: data,
      create: { id: seedId("9", row.index), ...data }
    });
  }
  console.log(`${rows.length} audit log entries ready`);
};
var seedSettings = async () => {
  const rows = [
    { key: "maintenance_mode", value: false },
    { key: "registration_open", value: true },
    {
      key: "support_email",
      value: config_default.admin_email || "support@taskflow.dev"
    }
  ];
  for (const row of rows) {
    await prisma.platformSetting.upsert({
      where: { key: row.key },
      update: { value: row.value },
      create: { key: row.key, value: row.value }
    });
  }
  console.log(`${rows.length} platform settings ready`);
};
var runSeed = async () => {
  console.log("Seeding TaskFlow demo data...");
  await seedAdmin();
  await seedAccounts();
  const manager = account("manager@taskflow.dev");
  const client = account("client@taskflow.dev");
  await seedSubscription(manager.id);
  await seedSubscription(client.id);
  await seedPayments(client.id);
  await seedProjects(manager.id);
  await seedTasks();
  await seedComments();
  await seedNotifications();
  await seedContacts();
  await seedAuditLogs();
  await seedSettings();
  console.log("\nDemo data ready. Sign in with:");
  console.log("  admin@taskflow.dev    / Admin@123    (ADMIN)");
  console.log("  manager@taskflow.dev  / Manager@123  (PROJECT_MANAGER)");
  console.log("  member@taskflow.dev   / Member@123   (TEAM_MEMBER)");
  console.log("  client@taskflow.dev   / Client@123   (CLIENT)");
};
var entryPath = process.argv[1] ? path7.resolve(process.argv[1]) : "";
var invokedDirectly = pathToFileURL(entryPath).href === import.meta.url || entryPath.replaceAll("\\", "/").endsWith("src/app/utils/seed.ts");
if (invokedDirectly) {
  runSeed().then(async () => {
    await prisma.$disconnect();
  }).catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
}

// src/server.ts
var port = config_default.port;
if (!port) {
  throw new Error("port is missing in env");
}
var main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database successfully");
    redis_default.connect().then(() => {
      console.log("Redis connected successfully");
    }).catch((error) => {
      console.error(
        "Redis initial connection failed; retrying in the background",
        error
      );
    });
    await nodeMailer_default.verify().catch((error) => {
      console.log("nodemailer not reachable, OTP mails will fail", error);
    });
    await seedAdmin();
    app_default.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (error) {
    console.log(`Failed to start the server`, error);
    prisma.$disconnect();
    process.exit(1);
  }
};
main();
//# sourceMappingURL=server.js.map
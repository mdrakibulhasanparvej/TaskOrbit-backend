# TaskFlow Backend

TaskFlow is a project-management SaaS backend: teams create projects, plan work on a Kanban board, collaborate with comments and attachments, and pay for higher plan limits through Stripe. It is a TypeScript Express API in front of PostgreSQL (Prisma) with Redis for OTP throttling, refresh-token tracking and notification dedupe.

## Tech Stack

- Node.js + TypeScript, Express 5
- PostgreSQL + Prisma ORM (client generated to `generated/prisma`)
- Redis (OTP throttling, refresh-token tracking, deadline-sweep locks)
- JWT in HttpOnly cookies (access + refresh), optional `Authorization: Bearer` fallback
- Stripe (checkout, webhook, subscription lifecycle)
- Cloudinary (avatars, attachments), Nodemailer (OTP, invites, receipts), Multer, Zod, Biome

## Quick Start

```bash
npm install
npx prisma migrate dev       # applies migrations + regenerates the client
npm run seed                 # demo accounts, projects, tasks, billing, audit trail
npm run dev                  # http://localhost:5000
```

Health check: `GET /` → `{ "success": true, "message": "Server is running" }`.

### Environment Variables

Create `.env` in the project root (never commit it):

| Variable | Used by | Notes |
| --- | --- | --- |
| `ENVIRONMENT`, `PORT`, `FRONTEND_URL` | core | `PORT=5000`, CORS origin comes from `FRONTEND_URL` |
| `DATABASE_URL`, `BCRYPT_SALT_ROUNDS` | core | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_TIME` | auth | access token lifetime, e.g. `1d` |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_TIME` | auth | refresh token lifetime, e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | avatars, attachments | |
| `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` | redis lib | OTP throttling, refresh-token tracking, notification dedupe |
| `EMAIL_SENDER`, `GOOGLE_APP_PASSWORD` | nodemailer | Gmail app password for OTP, invitations, receipts |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed | env-configured admin created at boot |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | payments | test-mode `sk_test_...` / `whsec_...` |

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` / `npm start` | bundle with tsup / run `dist/server.js` |
| `npm run seed` | idempotent demo dataset (see below) |
| `npm run check` | Biome check with `--write` (format + lint fixes) |
| `npm run stripe:webhook` | `stripe listen --forward-to localhost:5000/api/v1/payments/webhook` |

## Demo Accounts (created by `npm run seed`)

| Email | Password | Role | Redirect |
| --- | --- | --- | --- |
| `admin@taskflow.dev` | `Admin@123` | ADMIN | /admin |
| `manager@taskflow.dev` | `Manager@123` | PROJECT_MANAGER | /manager |
| `member@taskflow.dev` | `Member@123` | TEAM_MEMBER | /dashboard |

Five extra TEAM_MEMBER accounts (`alex@`, `priya@`, `sam@`, `taylor@`, `noah@taskflow.dev`, password `Member@123`) populate the workload charts. Every seeded account is verified.

The seed also creates: a manager-owned PRO subscription with two settled payments, 3 projects (2 ACTIVE, 1 COMPLETED) with memberships, 24 tasks (2 overdue, 3 due within 24h), a comment thread, notifications, 2 contact messages, 10 audit-log entries and the 3 platform settings. It is deterministic and idempotent — re-running refreshes the same rows instead of duplicating them:

```bash
npm run seed
```

## Authentication Model

Auth is **cookie-first**: no token is ever returned in a response body. `login`, `verify-email` and `refresh` respond with `{ success, message, data: { user } }` and set two HttpOnly cookies — `access_token` (1d) and `refresh_token` (7d, rotated on every refresh).

- `auth(...roles)` resolves credentials as `access_token` cookie → `refresh_token` cookie → optional `Authorization: Bearer` header (either secret).
- After the token it loads the user and checks `is_deleted` / `user_status` / `is_active` / `is_verified`, then the role allow-list. Role-layer mismatches answer **401**; ownership and plan checks inside services answer **403**.
- `POST /api/v1/auth/refresh` carries no `auth()` guard so an expired access token can be exchanged for a fresh pair.

## Roles and Permissions

| Capability | ADMIN | PROJECT_MANAGER | TEAM_MEMBER |
| --- | --- | --- | --- |
| Platform analytics, admin users/projects/payments/reports/settings | ✅ | ❌ | ❌ |
| Create/update/delete own projects, invite members, manage tasks | ✅ (any project) | ✅ (owned) | ❌ |
| Move a task on the board | ❌ | ✅ | ✅ (assigned tasks only) |
| Comments / attachments | ✅ | ✅ | ✅ (member of the project) |
| Billing (checkout, subscription, history) | ✅ | ✅ | ❌ |
| Personal progress, notifications, profile | ✅ | ✅ | ✅ |

Plan limits are enforced in the service layer: FREE = 2 projects / 3 members, PRO = 15 / 15, BUSINESS = unlimited. The effective plan comes from the owner's active `Subscription`.

## API Overview

All routes are prefixed with `/api/v1`.

### Auth — `/auth`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/register` | public (OTP emailed) |
| POST | `/verify-email` | public |
| POST | `/resend-otp` | public (throttled) |
| POST | `/login` | public |
| POST | `/refresh` | refresh cookie/Bearer |
| POST | `/logout` | any signed-in user |
| GET | `/me` | any signed-in user |

### Users — `/users`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/` | ADMIN (light list; `/admin/users` is canonical) |
| GET · PATCH | `/me` | any signed-in user |
| PATCH | `/me/password` | any signed-in user |
| PATCH | `/me/avatar` | any signed-in user (multipart `avatar`) |

### Projects — `/projects`

| Method | Path | Access |
| --- | --- | --- |
| GET · POST | `/` | PROJECT_MANAGER, ADMIN (GET) |
| GET · PATCH · DELETE | `/:id` | owner (DELETE also ADMIN) |
| GET | `/:id/members` | owner, ADMIN, members |
| DELETE | `/:id/members/:memberId` | owner |
| POST · GET | `/:id/invitations` | owner |
| POST | `/invitations/accept` · `/invitations/decline` | PROJECT_MANAGER, TEAM_MEMBER |
| GET | `/invitations/mine` | any signed-in user |

### Tasks — `/tasks`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/?projectId=...` | members (TEAM_MEMBER sees only assigned) |
| POST | `/` | PROJECT_MANAGER |
| GET | `/board?projectId=...` | members |
| GET | `/:id` | members |
| PATCH | `/:id` | owner |
| DELETE | `/:id` | owner, ADMIN |
| PATCH | `/:id/status` | owner, assignee, PROJECT_MANAGER (ADMIN blocked) |
| PATCH | `/:id/assign` | owner |

### Comments — `/tasks`

| Method | Path | Access |
| --- | --- | --- |
| GET · POST | `/:taskId/comments` | PROJECT_MANAGER, TEAM_MEMBER (POST) |
| PATCH | `/comments/:commentId` | author |
| DELETE | `/comments/:commentId` | PROJECT_MANAGER, ADMIN |

### Attachments — `/tasks`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/:taskId/attachments` (multipart `files`, max 5) | members, Pro/Business plan |
| GET | `/:taskId/attachments` | members |
| DELETE | `/attachments/:attachmentId` | PROJECT_MANAGER, TEAM_MEMBER |

### Notifications — `/notifications`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/?unreadOnly=true` | any signed-in user |
| GET | `/unread-count` | any signed-in user |
| PATCH | `/read-all` | any signed-in user |
| PATCH | `/:id/read` | any signed-in user |

### Payments — `/payments`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/plans` | public pricing table |
| POST | `/webhook` | Stripe signature (raw-body guard in `src/app.ts`) |
| GET | `/subscription` | PROJECT_MANAGER |
| POST | `/checkout` | PROJECT_MANAGER |
| GET | `/verify?session_id=...` | PROJECT_MANAGER |
| GET | `/history` | PROJECT_MANAGER |
| GET | `/history/admin` | ADMIN |

### Analytics — `/analytics`

| Method | Path | Access | Returns |
| --- | --- | --- | --- |
| GET | `/admin` | ADMIN | totals (users, active projects, tasks, MRR), 12-month revenue and signups, tasks by status |
| GET | `/manager` | PROJECT_MANAGER | completion rate, tasks/projects by status, member workload, 8-week overdue trend |
| GET | `/project/:projectId` | PROJECT_MANAGER (owner only) | per-project variant of the manager charts |
| GET | `/member` | TEAM_MEMBER | my tasks by status, completion rate, overdue count |

All chart payloads are flat arrays ready for Recharts.

### Admin — `/admin`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/users` | ADMIN (search, `role`, `user_status`, sort, pagination, project/task counters) |
| PATCH | `/users/:id/status` | ADMIN (`ACTIVE`/`SUSPENDED`, blocks self and the seed admin) |
| PATCH | `/users/:id/role` | ADMIN |
| GET | `/projects` | ADMIN (platform-wide + `ownerName` search) |
| DELETE | `/projects/:id` | ADMIN |
| GET | `/payments` | ADMIN (status/plan filters) |
| GET | `/reports` | ADMIN (paginated audit log with `action`/`entity` filters, platform totals, top projects) |
| GET · PATCH | `/settings` | ADMIN (`maintenance_mode`, `registration_open`, `support_email`) |

### Contact — `/contact`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/` | public (name, email, subject, message; also emails the support inbox, best-effort) |
| GET | `/?status=NEW` | ADMIN |
| PATCH | `/:id` | ADMIN (`NEW` / `READ` / `RESOLVED`) |

### Health

- `GET /` — server status.

## Testing with Postman

Import **`TaskOrbit.postman_collection.json`** (repo root) into the Postman desktop app: **Import → Files → select the file**. It contains every route above (67 requests across Health, Auth, Users, Projects, Tasks, Comments, Attachments, Notifications, Payments, Analytics, Admin, Contact) with ready-made bodies, query params and role notes on each request.

### Prerequisites

```bash
npm install
npx prisma migrate dev
npm run seed      # creates the demo accounts and sample data below
npm run dev       # http://localhost:5000
```

### Collection variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `baseUrl` | `http://localhost:5000/api/v1` | every request URL is built from this |
| `serverUrl` | `http://localhost:5000` | health check only |
| `access_token` | *(empty)* | optional JWT for header auth — leave empty and rely on cookies |
| `email`, `password`, `otp` | `tester@example.com` / `Password123` / `123456` | register/verify/login payloads |
| `projectId`, `taskId`, `userId`, `commentId`, `attachmentId`, `notificationId`, `contactId`, `memberId`, `invitationToken`, `sessionId` | *(empty)* | fill these with real ids as responses return them |

### Authentication in Postman

Tokens are **HttpOnly cookies** (`access_token`, `refresh_token`) — they never appear in a response body.

1. Keep Postman's cookie jar enabled (it is on by default — **Settings → General → Cookie Jar**). After **Auth → Login** (or Verify Email / Refresh) the jar stores both cookies and every later request authenticates automatically.
2. Header fallback: paste a JWT into the `access_token` collection variable and the collection-level pre-request script sends `Authorization: Bearer <token>` on every request. Clear the variable to go back to cookie-only.
3. Validate the session with **Auth → Get Current User** — `200` means auth works, `400/401` means you are not signed in.

### Test data

**Seeded accounts** (from `npm run seed`, all verified):

| Email | Password | Role | Use it for |
| --- | --- | --- | --- |
| `admin@taskflow.dev` | `Admin@123` | ADMIN | Admin folder, `/analytics/admin`, `/payments/history/admin`, `/users`, contact list |
| `manager@taskflow.dev` | `Manager@123` | PROJECT_MANAGER | Projects, tasks, invitations, billing, `/analytics/manager` |
| `member@taskflow.dev` | `Member@123` | TEAM_MEMBER | Comments, attachments, board moves, `/analytics/member` |

Five extra members (`alex@`, `priya@`, `sam@`, `taylor@`, `noah@taskflow.dev`, password `Member@123`) populate the workload charts. To exercise registration instead, use any fresh email with a password of **8–24 chars containing at least one uppercase and one lowercase letter** (e.g. `Password123`), `role` = `PROJECT_MANAGER` or `TEAM_MEMBER` (ADMIN is not allowed), then take the 6-digit OTP from the email — with mail unconfigured, read it from the Redis OTP store — and call Verify Email.

**Request bodies you will need (copy-paste ready):**

| Request | Body |
| --- | --- |
| `POST /auth/login` | `{ "email": "manager@taskflow.dev", "password": "Manager@123" }` |
| `POST /projects` | `{ "name": "Postman Smoke Test", "description": "created via collection", "status": "PLANNING", "start_date": "2026-10-15", "end_date": "2026-12-31" }` |
| `POST /projects/:id/invitations` | `{ "email": "member@taskflow.dev" }` |
| `POST /projects/invitations/accept` | `{ "token": "<token from the invitation email>" }` |
| `POST /tasks` | `{ "projectId": "{{projectId}}", "title": "Smoke test task", "description": "via Postman", "priority": "HIGH", "due_date": "2026-10-30", "labels": ["qa"], "assigneeId": null }` |
| `PATCH /tasks/:id/status` | `{ "status": "IN_PROGRESS" }` |
| `PATCH /tasks/:id/assign` | `{ "assigneeId": "{{userId}}" }` (send `null` to unassign) |
| `POST /tasks/:taskId/comments` | `{ "body": "Looks good to me!", "parent_id": null }` |
| `POST /contact` | `{ "name": "Test User", "email": "tester@example.com", "subject": "Pricing question", "message": "Does the PRO plan include unlimited projects?" }` |
| `POST /payments/checkout` | `{ "plan": "PRO" }` (test card `4242 4242 4242 4242`, future expiry, any CVC) |
| `PATCH /admin/users/:id/status` | `{ "user_status": "SUSPENDED" }` |
| `PATCH /admin/users/:id/role` | `{ "role": "TEAM_MEMBER" }` |
| `PATCH /admin/settings` | `{ "maintenance_mode": false, "registration_open": true, "support_email": "support@taskflow.dev" }` |

**Allowed enum values** (zod rejects anything else):

| Field | Values |
| --- | --- |
| `role` | `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER` (register accepts only the last two) |
| `status` (project) | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |
| `status` (task) | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `user_status` | `ACTIVE`, `SUSPENDED` |
| `status` (contact) | `NEW`, `READ`, `RESOLVED` |
| `plan` | `PRO`, `BUSINESS` for checkout (`FREE` is rejected) |

### Suggested run order

1. **Health → Server is running** — confirms the server is up.
2. **Auth → Login** as `manager@taskflow.dev`, then **Get Current User** — confirms the session cookie.
3. **Projects → Create Project** — copy the returned `id` into the `projectId` variable.
4. **Tasks → Create Task** — copy the returned `id` into `taskId`; then try **Get Board**, **Move Task**, **Update Task**.
5. **Comments / Attachments** — thread a comment (`commentId`) and upload a file (`attachmentId`). Attachments require a PRO/BUSINESS plan on the owning account.
6. **Notifications / Analytics** — as the matching role.
7. **Payments → List Plans** (public) → **Create Checkout Session** → complete the Stripe test page → **Verify Payment** with `session_id`.
8. **Admin** folder as `admin@taskflow.dev`, **Contact → Send Message** (public) then list/update it as admin.

### Expected results and gotchas

- Success codes: `200` for most reads/updates, `201` for Verify Email and some creations. `400` = missing/invalid body or not logged in, `401` = wrong role or suspended, `403` = ownership/plan limit, `404` = unknown id, `409`/duplicate complaints come from the service layer.
- Role mismatches answer **401**; ownership and plan-limit violations answer **403**. Log in as the right demo account rather than fighting a 401/403.
- Multipart requests: **Update My Avatar** (`avatar`, ≤10 MB) and **Upload Attachments** (`files`, ≤5 files) — pick the file(s) in Postman before sending; do not add a manual `Content-Type` header.
- `POST /payments/webhook` will 400 on hand-made requests because Stripe verifies the raw body signature — use `npm run stripe:webhook` instead.
- Enabling `maintenance_mode` in **Admin → Update Platform Settings** answers **503** for everyone except an ADMIN session; `/api/v1/auth/*` and the Stripe webhook stay reachable, so log in as `admin@taskflow.dev` and `PATCH /admin/settings` again to switch it off.
- A collection-level test asserts **no 5xx** on every response; check the Test Results tab as you go.

## Project Structure

```bash
src/
├── app.ts                 # CORS, body parsing, raw-body webhook guard, router mounts
├── server.ts              # DB/Redis connect, admin seed, listen
└── app/
    ├── config/            # env loading
    ├── lib/               # prisma, redis, stripe, cloudinary, nodemailer, multer
    ├── middlewares/       # auth, validateRequest, globalErrorHandler, notFound
    ├── modules/           # auth, user, project, task, comment, attachment,
    │                      # notification, payment, analytics, admin, contact
    ├── templates/         # ejs mails (otp, invitation, payment success)
    ├── types/
    └── utils/             # audit, seed, jwt, hashing, sendResponse, uploadImage
prisma/
├── schema/                # one file per model + enum.prisma
└── migrations/
```

Each module follows the same layout: `*.route.ts` → `validateRequest` → `*.controller.ts` (req/res only, via `catchAsync` + `sendResponse`) → `*.service.ts` (all Prisma access, throws `AppError`).

## Database

Models live in [prisma/schema](prisma/schema): `User`, `Project`, `ProjectMember`, `ProjectInvitation`, `Task`, `Comment`, `Attachment`, `Notification`, `Subscription`, `Payment`, `AuditLog`, `ContactMessage`, `PlatformSetting`. Ids are `uuid()` with snake_case columns mapped to plural table names.

`AuditLog` intentionally has **no relations**, so deleting users or projects never blocks on the audit trail; `actor_name` is snapshotted at write time by `src/app/utils/audit.ts` (`recordAudit`, fire-and-forget).

## Stripe Billing

- `STRIPE_SECRET_KEY` must be a **test-mode** secret (`sk_test_...`); `STRIPE_WEBHOOK_SECRET` (`whsec_...`) is printed by `npm run stripe:webhook`.
- Checkout uses inline `price_data` (USD 12 PRO / 29 BUSINESS per month) — no dashboard products needed. Test card `4242 4242 4242 4242`, any future expiry, any CVC.
- The webhook is optional for the demo: the frontend calls `GET /api/v1/payments/verify?session_id=...` on the success redirect, which activates the plan. The webhook adds renewals (`invoice.paid`) and downgrades (`customer.subscription.deleted`).

```bash
npm run stripe:webhook     # forwards to POST /api/v1/payments/webhook
```

## Verification

```bash
npx prisma validate
npx tsc --noEmit
npm run check      # Biome
npm run build
```

## License

This project is for educational and internal use unless otherwise specified by the project owner.

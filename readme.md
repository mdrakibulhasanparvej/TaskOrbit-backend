# TaskFlow Backend

TaskFlow is a project-management SaaS backend: teams create projects, plan work on a Kanban board, collaborate with comments and attachments and pay for higher plan limits through Stripe. It is a TypeScript Express API in front of PostgreSQL (Prisma) with Redis for OTP throttling, refresh-token tracking and notification dedupe.

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

| Variable                                                               | Used by              | Notes                                                       |
| ---------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------- |
| `ENVIRONMENT`, `PORT`, `FRONTEND_URL`                                  | core                 | `PORT=5000`, CORS origin comes from `FRONTEND_URL`          |
| `DATABASE_URL`, `BCRYPT_SALT_ROUNDS`                                   | core                 | PostgreSQL connection string                                |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_TIME`                                 | auth                 | access token lifetime, e.g. `1d`                            |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_TIME`                               | auth                 | refresh token lifetime, e.g. `7d`                           |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | avatars, attachments |                                                             |
| `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT`         | redis lib            | OTP throttling, refresh-token tracking, notification dedupe |
| `EMAIL_SENDER`, `GOOGLE_APP_PASSWORD`                                  | nodemailer           | Gmail app password for OTP, invitations, receipts           |
| `GOOGLE_CLIENT_ID`                                                     | google oauth         | OAuth client id for `POST /api/v1/auth/google` (500 until set) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`                          | seed                 | env-configured admin created at boot                        |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                           | payments             | test-mode `sk_test_...` / `whsec_...`                       |

### Scripts

| Script                        | What it does                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                 | `tsx watch src/server.ts`                                           |
| `npm run build` / `npm start` | bundle with tsup / run `dist/server.js`                             |
| `npm run seed`                | idempotent demo dataset (see below)                                 |
| `npm run check`               | Biome check with `--write` (format + lint fixes)                    |
| `npm run stripe:webhook`      | `stripe listen --forward-to localhost:5000/api/v1/payments/webhook` |

## Demo Accounts (created by `npm run seed`)

| Email                  | Password      | Role            | Redirect   |
| ---------------------- | ------------- | --------------- | ---------- |
| `admin@taskflow.dev`   | `Admin@123`   | ADMIN           | /admin     |
| `manager@taskflow.dev` | `Manager@123` | PROJECT_MANAGER | /manager   |
| `member@taskflow.dev`  | `Member@123`  | TEAM_MEMBER     | /dashboard |

Five extra TEAM_MEMBER accounts (`alex@`, `priya@`, `sam@`, `taylor@`, `noah@taskflow.dev`, password `Member@123`) populate the workload charts. Every seeded account is verified.

The seed also creates: a manager-owned PRO subscription with two settled payments, 3 projects (2 ACTIVE, 1 COMPLETED) with memberships, 24 tasks (2 overdue, 3 due within 24h), a comment thread, notifications, 2 contact messages, 10 audit-log entries and the 3 platform settings. It is deterministic and idempotent — re-running refreshes the same rows instead of duplicating them:

```bash
npm run seed
```

## Authentication Model

Auth is **cookie-first**: `login`, `verify-email` and `refresh` set two HttpOnly cookies — `access_token` (1d) and `refresh_token` (7d, rotated on every refresh). Outside production (`ENVIRONMENT !== "production"` — i.e. dev/test), the **login** response additionally returns both tokens in the body so non-browser clients (Postman, scripts) can pick them up directly: `{ success, message: "Login successful", data: { user, access_token, refresh_token } }`. The `user` object carries `need_password_change` — set by `reset-password`, cleared by `PATCH /users/me/password`. `verify-email` and `refresh` stay body-free: `{ success, message, data: { user } }`.

- `auth(...roles)` resolves credentials as `access_token` cookie → `refresh_token` cookie → optional `Authorization: Bearer` header (either secret).
- After the token it loads the user and checks `is_deleted` / `user_status` / `is_active` / `is_verified`, then the role allow-list. Role-layer mismatches answer **401**; ownership and plan checks inside services answer **403**.
- `POST /api/v1/auth/refresh` carries no `auth()` guard so an expired access token can be exchanged for a fresh pair.

## Roles and Permissions

| Capability                                                         | ADMIN            | PROJECT_MANAGER | TEAM_MEMBER                |
| ------------------------------------------------------------------ | ---------------- | --------------- | -------------------------- |
| Platform analytics, admin users/projects/payments/reports/settings | ✅               | ❌              | ❌                         |
| Create/update/delete own projects, invite members, manage tasks    | ✅ (any project) | ✅ (owned)      | ❌                         |
| Move a task on the board                                           | ❌               | ✅              | ✅ (assigned tasks only)   |
| Comments / attachments                                             | ✅               | ✅              | ✅ (member of the project) |
| Billing (checkout, subscription, history)                          | ✅               | ✅              | ❌                         |
| Personal progress, notifications, profile                          | ✅               | ✅              | ✅                         |

Plan limits are enforced in the service layer: FREE = 2 projects / 3 members, PRO = 15 / 15, BUSINESS = unlimited. The effective plan comes from the owner's active `Subscription`.

## API Overview

All routes are prefixed with `/api/v1`.

### Auth — `/auth`

| Method | Path            | Access                |
| ------ | --------------- | --------------------- |
| POST   | `/register`     | public (OTP emailed)  |
| POST   | `/verify-email` | public                |
| POST   | `/resend-otp`   | public (throttled)    |
| POST   | `/login`        | public                |
| POST   | `/google`       | public (Google ID token; needs `GOOGLE_CLIENT_ID`) |
| POST   | `/forgot-password` | public (reset OTP emailed, 5-min TTL) |
| POST   | `/reset-password`  | public (OTP + new password, revokes sessions) |
| POST   | `/refresh`      | refresh cookie/Bearer |
| POST   | `/logout`       | any signed-in user    |
| GET    | `/me`           | any signed-in user    |

### Users — `/users`

| Method      | Path           | Access                                          |
| ----------- | -------------- | ----------------------------------------------- |
| GET         | `/`            | ADMIN (light list; `/admin/users` is canonical) |
| GET · PATCH | `/me`          | any signed-in user                              |
| PATCH       | `/me/password` | any signed-in user                              |
| PATCH       | `/me/avatar`   | any signed-in user (multipart `avatar`)         |

### Projects — `/projects`

| Method               | Path                                           | Access                       |
| -------------------- | ---------------------------------------------- | ---------------------------- |
| GET · POST           | `/`                                            | PROJECT_MANAGER, ADMIN (GET) |
| GET · PATCH · DELETE | `/:id`                                         | owner (DELETE also ADMIN)    |
| GET                  | `/:id/members`                                 | owner, ADMIN, members        |
| DELETE               | `/:id/members/:memberId`                       | owner                        |
| POST · GET           | `/:id/invitations`                             | owner                        |
| POST                 | `/invitations/accept` · `/invitations/decline` | PROJECT_MANAGER, TEAM_MEMBER |
| GET                  | `/invitations/mine`                            | any signed-in user           |

### Tasks — `/tasks`

| Method | Path                   | Access                                           |
| ------ | ---------------------- | ------------------------------------------------ |
| GET    | `/?projectId=...`      | members (TEAM_MEMBER sees only assigned)         |
| POST   | `/`                    | PROJECT_MANAGER                                  |
| GET    | `/board?projectId=...` | members                                          |
| GET    | `/:id`                 | members                                          |
| PATCH  | `/:id`                 | owner                                            |
| DELETE | `/:id`                 | owner, ADMIN                                     |
| PATCH  | `/:id/status`          | owner, assignee, PROJECT_MANAGER (ADMIN blocked) |
| PATCH  | `/:id/assign`          | owner                                            |

### Comments — `/tasks`

| Method     | Path                   | Access                              |
| ---------- | ---------------------- | ----------------------------------- |
| GET · POST | `/:taskId/comments`    | PROJECT_MANAGER, TEAM_MEMBER (POST) |
| PATCH      | `/comments/:commentId` | author                              |
| DELETE     | `/comments/:commentId` | PROJECT_MANAGER, ADMIN              |

### Attachments — `/tasks`

| Method | Path                                              | Access                       |
| ------ | ------------------------------------------------- | ---------------------------- |
| POST   | `/:taskId/attachments` (multipart `files`, max 5) | members, Pro/Business plan   |
| GET    | `/:taskId/attachments`                            | members                      |
| DELETE | `/attachments/:attachmentId`                      | PROJECT_MANAGER, TEAM_MEMBER |

### Notifications — `/notifications`

| Method | Path                | Access             |
| ------ | ------------------- | ------------------ |
| GET    | `/?unreadOnly=true` | any signed-in user |
| GET    | `/unread-count`     | any signed-in user |
| PATCH  | `/read-all`         | any signed-in user |
| PATCH  | `/:id/read`         | any signed-in user |

### Payments — `/payments`

| Method | Path                     | Access                                            |
| ------ | ------------------------ | ------------------------------------------------- |
| GET    | `/plans`                 | public pricing table                              |
| POST   | `/webhook`               | Stripe signature (raw-body guard in `src/app.ts`) |
| GET    | `/subscription`          | PROJECT_MANAGER                                   |
| POST   | `/checkout`              | PROJECT_MANAGER                                   |
| GET    | `/verify?session_id=...` | PROJECT_MANAGER                                   |
| GET    | `/history`               | PROJECT_MANAGER                                   |
| GET    | `/history/admin`         | ADMIN                                             |

### Analytics — `/analytics`

| Method | Path                  | Access                       | Returns                                                                                    |
| ------ | --------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/admin`              | ADMIN                        | totals (users, active projects, tasks, MRR), 12-month revenue and signups, tasks by status |
| GET    | `/manager`            | PROJECT_MANAGER              | completion rate, tasks/projects by status, member workload, 8-week overdue trend           |
| GET    | `/project/:projectId` | PROJECT_MANAGER (owner only) | per-project variant of the manager charts                                                  |
| GET    | `/member`             | TEAM_MEMBER                  | my tasks by status, completion rate, overdue count                                         |

All chart payloads are flat arrays ready for Recharts.

### Admin — `/admin`

| Method      | Path                | Access                                                                                    |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------- |
| GET         | `/users`            | ADMIN (search, `role`, `user_status`, sort, pagination, project/task counters)            |
| PATCH       | `/users/:id/status` | ADMIN (`ACTIVE`/`SUSPENDED`, blocks self and the seed admin)                              |
| PATCH       | `/users/:id/role`   | ADMIN                                                                                     |
| GET         | `/projects`         | ADMIN (platform-wide + `ownerName` search)                                                |
| DELETE      | `/projects/:id`     | ADMIN                                                                                     |
| GET         | `/payments`         | ADMIN (status/plan filters)                                                               |
| GET         | `/reports`          | ADMIN (paginated audit log with `action`/`entity` filters, platform totals, top projects) |
| GET · PATCH | `/settings`         | ADMIN (`maintenance_mode`, `registration_open`, `support_email`)                          |

### Contact — `/contact`

| Method | Path           | Access                                                                             |
| ------ | -------------- | ---------------------------------------------------------------------------------- |
| POST   | `/`            | public (name, email, subject, message; also emails the support inbox, best-effort) |
| GET    | `/?status=NEW` | ADMIN                                                                              |
| PATCH  | `/:id`         | ADMIN (`NEW` / `READ` / `RESOLVED`)                                                |

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

| Variable                                                                                                                                | Default                                         | Meaning                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `baseUrl`                                                                                                                               | `http://localhost:5000/api/v1`                  | every request URL is built from this                           |
| `serverUrl`                                                                                                                             | `http://localhost:5000`                         | health check only                                              |
| `access_token`, `refresh_token`                                                             | _(empty)_                                       | filled automatically by Login on success; `access_token` is sent as `Authorization: Bearer ...` |
| `email`, `password`, `otp`                                                                                                              | `tester@example.com` / `Password123` / `123456` | register/verify/login payloads                                 |
| `projectId`, `taskId`, `userId`, `commentId`, `attachmentId`, `notificationId`, `contactId`, `memberId`, `invitationToken`, `sessionId` | _(empty)_                                       | fill these with real ids as responses return them              |

### Authentication in Postman

**Auth → Login** (in dev/test, i.e. `ENVIRONMENT !== "production"`) returns both tokens in the response body — `data.access_token` and `data.refresh_token` — *and* sets them as HttpOnly cookies (`access_token`, `refresh_token`). Verify Email and Refresh still set only cookies.

1. Keep Postman's cookie jar enabled (it is on by default — **Settings → General → Cookie Jar**). After **Auth → Login** (or Verify Email / Refresh) the jar stores both cookies and every later request authenticates automatically.
2. **Token capture on login:** the Login request's script reads `data.access_token` / `data.refresh_token` from the body (falling back to the cookies) and stores them in collection variables — but **only** when the response is `success: true` with a login-success message; a failed login stores nothing. The collection pre-request script then attaches `Authorization: Bearer <access_token>` to every following request (the auth middleware accepts cookie or header), and `refresh_token` is available for testing `POST /auth/refresh`. You can also paste a JWT into `access_token` by hand at any time.
3. Validate the session with **Auth → Get Current User** — `200` means auth works, `400/401` means you are not signed in. The Login request's Test Results tab shows `Login successful — access_token & refresh_token captured` when the hand-off worked.

### Test data

**Seeded accounts** (from `npm run seed`, all verified):

| Email                  | Password      | Role            | Use it for                                                                          |
| ---------------------- | ------------- | --------------- | ----------------------------------------------------------------------------------- |
| `admin@taskflow.dev`   | `Admin@123`   | ADMIN           | Admin folder, `/analytics/admin`, `/payments/history/admin`, `/users`, contact list |
| `manager@taskflow.dev` | `Manager@123` | PROJECT_MANAGER | Projects, tasks, invitations, billing, `/analytics/manager`                         |
| `member@taskflow.dev`  | `Member@123`  | TEAM_MEMBER     | Comments, attachments, board moves, `/analytics/member`                             |

Five extra members (`alex@`, `priya@`, `sam@`, `taylor@`, `noah@taskflow.dev`, password `Member@123`) populate the workload charts. To exercise registration instead, use any fresh email with a password of **8–24 chars containing at least one uppercase and one lowercase letter** (e.g. `Password123`), `role` = `PROJECT_MANAGER` or `TEAM_MEMBER` (ADMIN is not allowed), then take the 6-digit OTP from the email — with mail unconfigured, read it from the Redis OTP store — and call Verify Email.

**Request bodies you will need (copy-paste ready):**

| Request                             | Body                                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`                  | `{ "email": "manager@taskflow.dev", "password": "Manager@123" }`                                                                                                                 |
| `POST /auth/forgot-password`        | `{ "email": "member@taskflow.dev" }` — in dev the OTP is printed to the server console as `[DEV]: Password reset otp log -> 123456`                                              |
| `POST /auth/reset-password`         | `{ "email": "member@taskflow.dev", "otp": "<code from the console>", "new_password": "NewPassword123" }`                                                                          |
| `POST /auth/google`                 | `{ "id_token": "<Google ID token>" }` — requires `GOOGLE_CLIENT_ID` in `.env`                                                                                                     |
| `POST /projects`                    | `{ "name": "Postman Smoke Test", "description": "created via collection", "status": "PLANNING", "start_date": "2026-10-15", "end_date": "2026-12-31" }`                          |
| `POST /projects/:id/invitations`    | `{ "email": "member@taskflow.dev" }`                                                                                                                                             |
| `POST /projects/invitations/accept` | `{ "token": "<token from the invitation email>" }`                                                                                                                               |
| `POST /tasks`                       | `{ "projectId": "{{projectId}}", "title": "Smoke test task", "description": "via Postman", "priority": "HIGH", "due_date": "2026-10-30", "labels": ["qa"], "assigneeId": null }` |
| `PATCH /tasks/:id/status`           | `{ "status": "IN_PROGRESS" }`                                                                                                                                                    |
| `PATCH /tasks/:id/assign`           | `{ "assigneeId": "{{userId}}" }` (send `null` to unassign)                                                                                                                       |
| `POST /tasks/:taskId/comments`      | `{ "body": "Looks good to me!", "parent_id": null }`                                                                                                                             |
| `POST /contact`                     | `{ "name": "Test User", "email": "tester@example.com", "subject": "Pricing question", "message": "Does the PRO plan include unlimited projects?" }`                              |
| `POST /payments/checkout`           | `{ "plan": "PRO" }` (test card `4242 4242 4242 4242`, future expiry, any CVC)                                                                                                    |
| `PATCH /admin/users/:id/status`     | `{ "user_status": "SUSPENDED" }`                                                                                                                                                 |
| `PATCH /admin/users/:id/role`       | `{ "role": "TEAM_MEMBER" }`                                                                                                                                                      |
| `PATCH /admin/settings`             | `{ "maintenance_mode": false, "registration_open": true, "support_email": "support@taskflow.dev" }`                                                                              |

**Allowed enum values** (zod rejects anything else):

| Field              | Values                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| `role`             | `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER` (register accepts only the last two) |
| `status` (project) | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`                       |
| `status` (task)    | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`                                     |
| `priority`         | `LOW`, `MEDIUM`, `HIGH`, `URGENT`                                              |
| `user_status`      | `ACTIVE`, `SUSPENDED`                                                          |
| `status` (contact) | `NEW`, `READ`, `RESOLVED`                                                      |
| `plan`             | `PRO`, `BUSINESS` for checkout (`FREE` is rejected)                            |

### Suggested run order

1. **Health → Server is running** — confirms the server is up.
2. **Auth → Login** as `manager@taskflow.dev`, then **Get Current User** — confirms the session cookie.
3. **Projects → Create Project** — copy the returned `id` into the `projectId` variable.
4. **Tasks → Create Task** — copy the returned `id` into `taskId`; then try **Get Board**, **Move Task**, **Update Task**.
5. **Comments / Attachments** — thread a comment (`commentId`) and upload a file (`attachmentId`). Attachments require a PRO/BUSINESS plan on the owning account.
6. **Notifications / Analytics** — as the matching role.
7. **Payments → List Plans** (public) → **Create Checkout Session** → complete the Stripe test page → **Verify Payment** with `session_id`.
8. **Admin** folder as `admin@taskflow.dev`, **Contact → Send Message** (public) then list/update it as admin.

### Endpoint guide — what each request does and how to test it

Every request below lives in the imported collection. "Any" under Access means `auth()` with no role restriction. Base path is `{{baseUrl}}` = `/api/v1`.

#### Health

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /` | Returns server status, no auth. | Run first — `200 { success: true, message: "Server is running" }`. Anything else means the server is down. |

#### Auth — `/auth`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `POST /register` | Creates an **unverified** account (`provider: CREDENTIALS`) and emails a 6-digit OTP (Redis, 5-min TTL, 60-s resend cooldown). | Fresh email + password (8–24 chars, upper+lower) + `role` `PROJECT_MANAGER`/`TEAM_MEMBER` → `200 "OTP has been sent to email"`. In dev the OTP is printed to the server console as `[DEV]: User registration otp log -> …`. Existing verified email → `409`. |
| `POST /verify-email` | Checks the OTP, flips `is_verified` to `true` and opens a session (sets both cookies). | `email` + the 6-digit OTP → `201` + cookies. Wrong OTP → `400`, expired → `404`. |
| `POST /resend-otp` | Stores a fresh OTP and re-sends the mail; 60-s cooldown between sends. | After register → `200`. Call twice in a minute → `429`. |
| `POST /login` | Verifies email+password (all account guards: deleted/suspended/inactive), sets `access_token`/`refresh_token` cookies, and (dev only) returns both tokens in the body. | `manager@taskflow.dev` / `Manager@123` → `200`, collection Test tab shows `Login successful — access_token & refresh_token captured`. Wrong password → `401`, suspended → `403`, unknown email → `404`. |
| `POST /google` | Verifies a Google ID token against `GOOGLE_CLIENT_ID`, then signs in the matching email, **links** Google to a credentials account, or creates a new `TEAM_MEMBER` (`provider: GOOGLE`, `is_verified: true`). Returns the same session as login. | Needs `GOOGLE_CLIENT_ID` in `.env` + a real ID token pasted into `{{google_id_token}}` → `200` with `data.user` + tokens. Bogus token → `401`; client id unset → `500 "Google login is not configured"`. |
| `POST /forgot-password` | Finds the account (must be verified, not Google-only), emails a reset OTP (5-min TTL, 60-s cooldown). | `{ "email": "member@taskflow.dev" }` → `200` and `[DEV]: Password reset otp log -> …` in the console. Unknown email → `404`, Google-only → `403`, spamming → `429`. |
| `POST /reset-password` | Consumes the OTP (single use), re-hashes `new_password`, sets `need_password_change: true` and revokes the tracked refresh token (kills old sessions), then emails a confirmation. | Run Forgot first, paste the OTP → `200`. Then Login works with the **new** password, fails with the old one (`401`), and reusing the OTP → `404`. Wrong OTP → `400`. |
| `POST /refresh` | Exchanges a valid `refresh_token` (cookie first, `Authorization` fallback) for a rotated pair — the access token may already be expired, which is why this route has no auth guard. | Send any time → `200` + new cookies (and `need_password_change` in `data.user`). Stolen/expired token → `401`. |
| `POST /logout` | Revokes the tracked refresh token server-side and clears both cookies. | With a session → `200`; afterwards `Get Current User` fails until you log in again. |
| `GET /me` | Returns the session's user (`{ id, email, role }` from the JWT, re-read from DB). | The quickest auth check: `200` after Login, `400 "You are not logged in…"` otherwise. |

#### Users — `/users`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /` | ADMIN-only light user list (pagination + search/role/user_status). | As `admin@taskflow.dev` → `200` with `data` + `meta`. As manager → `401`. |
| `GET /me` | Full profile minus the password — includes `provider`, `is_verified`, `need_password_change`, timestamps. | After Login → `200`. |
| `PATCH /me` | Updates `name` and/or `email` (both optional; email uniqueness enforced). | `{ "name": "New Name" }` → `200`. An email owned by someone else → `409`. |
| `PATCH /me/password` | Compares `current_password`, stores the hash of `new_password`, and **clears `need_password_change`**. | Wrong current → `401`. Valid pair → `200`; then log in with the new password. |
| `PATCH /me/avatar` | multipart `avatar` → Cloudinary, replaces `avatar_url`/`avatar_public_id` (old image destroyed). | Pick a file ≤10 MB in the Body tab → `200` with the new URL. No file → `400`. |

#### Projects — `/projects`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `POST /projects/invitations/accept` | Consumes the emailed invitation token and adds you as a `ProjectMember`. | Log in as the invitee, paste the token from the mail → `200`. Garbage token → `4xx`. |
| `POST /projects/invitations/decline` | Same token flow, marks the invitation `DECLINED`. | As invitee with a valid token → `200`. |
| `GET /invitations/mine` | Lists invitations addressed to the signed-in user (pending/accepted/…). | Any signed-in user → `200`. |
| `GET /projects` | Owner's projects (`PROJECT_MANAGER`) or all (`ADMIN`); `page/limit/search/status/sortBy/sortOrder`. | As manager → `200`; as team member → `401` (role gate). |
| `POST /projects` | Creates a project owned by the caller. `name` (≤100) and `start_date` required; plan limits enforced (FREE=2, PRO=15, BUSINESS=∞). | `{ "name": "Postman Smoke Test", "status": "PLANNING", "start_date": "2026-10-15" }` → `200` — copy the returned `id` into `{{projectId}}`. Over the plan limit → `403`. |
| `GET /projects/:id` | Project details; access = owner, ADMIN or a member of that project. | Owner or member → `200`; an outsider → `403`/`404`. |
| `PATCH /projects/:id` | Owner-only partial update (same fields as create). | `{ "status": "ACTIVE" }` → `200`. |
| `DELETE /projects/:id` | Owner or ADMIN; cascades memberships/tasks ownership cleanup. | As owner → `200`; then `GET :id` → `404`. |
| `GET /projects/:id/members` | Members of the project with their roles. | Owner/member → `200`. |
| `DELETE /projects/:id/members/:memberId` | Owner removes a member (`memberId` is the ProjectMember id from the members list). | From the members response → `200`. |
| `POST /projects/:id/invitations` | Owner invites a user by email; an invitation token is emailed. | `{ "email": "member@taskflow.dev" }` → `200`; then accept it as that user. |
| `GET /projects/:id/invitations` | Owner's view of that project's invitations and statuses. | → `200`. |

#### Tasks — `/tasks`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /tasks` | Task list for one project — `projectId` **required**; optional `status/priority/assigneeId/search/dueBefore/page/limit/sortBy/sortOrder`. TEAM_MEMBERs only see tasks assigned to them. | `{{projectId}}` filled → `200`. Without `projectId` → empty/400 behaviour per service filter. |
| `POST /tasks` | PROJECT_MANAGER creates a task in a project (`projectId` + `title` ≤200 required; `labels` ≤10 × 30 chars; `due_date`, `assigneeId` nullable). | Body in the Test-data table → `200` — copy the `id` into `{{taskId}}`. As team member → `401`. |
| `GET /tasks/board` | Kanban payload grouped into `TODO / IN_PROGRESS / IN_REVIEW / DONE` with positions. | With `projectId` → `200`; compare columns after a status move. |
| `GET /tasks/:id` | Single task with owner/assignee info; project members only. | → `200`; unknown id → `404`. |
| `PATCH /tasks/:id` | Owner-only partial update — `status` deliberately excluded (move endpoint owns it). | `{ "priority": "URGENT" }` → `200`. |
| `DELETE /tasks/:id` | Owner or ADMIN. | → `200`; `GET :id` then → `404`. |
| `PATCH /tasks/:id/status` | Kanban move; allowed for the owner, assignee and manager — ADMIN alone is **blocked**. | `{ "status": "IN_PROGRESS" }` → `200`; check `/tasks/board` reflects it. Invalid enum → `400`. |
| `PATCH /tasks/:id/assign` | Manager assigns (`assigneeId`) or unassigns (`null`); the assignee gets a notification. | `{ "assigneeId": "{{userId}}" }` → `200`. |

#### Comments — mounted under `/tasks`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /tasks/:taskId/comments` | Threaded comments (with `parent_id` replies) for a task. | → `200`. |
| `POST /tasks/:taskId/comments` | PROJECT_MANAGER/TEAM_MEMBER adds a comment (≤5000 chars); `parent_id` optional for replies; triggers a notification. | `{ "body": "Looks good!", "parent_id": null }` → `200`. |
| `PATCH /tasks/comments/:commentId` | Author edits their own comment. | As the author → `200`; as another member → `403`. |
| `DELETE /tasks/comments/:commentId` | PROJECT_MANAGER or ADMIN removes a comment. | → `200`. |

#### Attachments — mounted under `/tasks`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `POST /tasks/:taskId/attachments` | multipart `files` (≤5, 10 MB each) → Cloudinary. **Plan-gated**: PRO/BUSINESS only. | Pick files in the Body tab → `200`. On a FREE owner → `403`. |
| `GET /tasks/:taskId/attachments` | Attachment list (URLs, sizes) for a task. | → `200`. |
| `DELETE /tasks/attachments/:attachmentId` | PROJECT_MANAGER/TEAM_MEMBER deletes the file (Cloudinary cleanup). | → `200`. |

#### Notifications — `/notifications`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /notifications` | Own notifications; `page/limit/unreadOnly=true/sortBy/sortOrder`. | → `200`. |
| `GET /notifications/unread-count` | Badge counter only. | Compare before/after the two PATCH calls. |
| `PATCH /notifications/read-all` | Marks everything read. | → `200`; unread-count drops to 0. |
| `PATCH /notifications/:id/read` | Marks one notification read. | Use an id from the list → `200`. |

#### Payments — `/payments`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /plans` | Public pricing table (FREE/PRO/BUSINESS limits). | No auth → `200`. |
| `POST /checkout` | PROJECT_MANAGER starts a Stripe checkout session (inline `price_data`, USD 12/29 per month). Only PRO/BUSINESS purchasable. | `{ "plan": "PRO" }` → `200` with a checkout URL; `{ "plan": "FREE" }` → `400`. |
| `GET /subscription` | The caller's current plan + status + period end. | → `200`. |
| `GET /verify` | Confirms a Stripe session after payment and activates the plan. `session_id` required. | After paying on the Stripe test page, pass `?session_id=cs_…` → `200`, plan becomes PRO. Missing param → `400`. |
| `GET /history` | The manager's own payments; filters `status/plan/page/limit`. | → `200`. |
| `GET /history/admin` | ADMIN view of every payment. | As admin → `200`; as manager → `401`. |
| `POST /webhook` | Stripe signs the **raw** body; the signature is verified before JSON parsing. | A hand-made request normally → `400` — that is correct. To test properly run `npm run stripe:webhook` and use Stripe CLI triggers. |

#### Analytics — `/analytics`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /admin` | ADMIN platform totals (users, active projects, tasks, MRR), 12-month revenue/signups, tasks by status — flat arrays for Recharts. | As admin → `200`; as manager → `401`. |
| `GET /manager` | PROJECT_MANAGER: completion rate, tasks/projects by status, member workload, 8-week overdue trend. | As manager → `200`. |
| `GET /project/:projectId` | Per-project variant; **owner only**. | Owner → `200`; another manager → `403`. |
| `GET /member` | TEAM_MEMBER: my tasks by status, completion rate, overdue count. | As member → `200`; as manager → `401`. |

#### Admin — `/admin` (every route requires ADMIN)

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `GET /users` | Platform users with project/task counters; `search/role/user_status/sort/page`. | As `admin@taskflow.dev` → `200`. |
| `PATCH /users/:id/status` | Sets `ACTIVE`/`SUSPENDED` (cannot suspend yourself or the seed admin). | `{ "user_status": "SUSPENDED" }` → `200`; that user's next request → `401`. |
| `PATCH /users/:id/role` | Changes a user's role (`ADMIN`/`PROJECT_MANAGER`/`TEAM_MEMBER`). | `{ "role": "TEAM_MEMBER" }` → `200`. |
| `GET /projects` | Every project platform-wide; `ownerName` search. | → `200`. |
| `DELETE /projects/:id` | Force-deletes any project. | → `200`. |
| `GET /payments` | All payments with `status/plan` filters. | → `200`. |
| `GET /reports` | Paginated audit log (`action` contains / `entity` equals) + platform totals. | → `200`. |
| `GET /settings` | The three platform switches. | → `200` with current values. |
| `PATCH /settings` | Partial update of `maintenance_mode`/`registration_open`/`support_email` — at least one required. **`maintenance_mode: true` makes every `/api/v1` route answer 503 for non-admins** (auth + webhook stay open), so turn it straight back off. | `{ "registration_open": false }` → `200`; verify with `GET /settings`. |

#### Contact — `/contact`

| Endpoint | How it works | How to test |
| --- | --- | --- |
| `POST /` | Public contact form; all four fields required (name ≤100, subject ≤150, message ≤5000) and the support inbox is emailed (best-effort). | The Test-data body → `200`. Missing field → `400`. |
| `GET /` | ADMIN list with `status` filter and pagination. | As admin → `200`. |
| `PATCH /:id` | ADMIN moves a message through `NEW` → `READ` → `RESOLVED`. | `{ "status": "RESOLVED" }` → `200`. |

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

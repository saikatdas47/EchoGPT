# EchoGPT Backend REST API

Production-style backend for the EchoGPT browser extension, built with NestJS, PostgreSQL (Neon), Prisma ORM, JWT and Swagger.

## Submission links

- GitHub repository: https://github.com/saikatdas47/EchoGPT
- Live Swagger API documentation: https://echogpt-f29g.onrender.com/docs
- Local Swagger: `http://localhost:3100/docs`

## Assignment coverage

| Area | Implementation |
| --- | --- |
| Authentication | Registration, login, bcrypt hashing, JWT access token, rotating hashed refresh tokens, logout, email OTP verification |
| Users | Profile, update, password change, account deletion, `USER`/`ADMIN` authorization |
| Subscriptions | Free/Premium plans, status, plan change, monthly chat/search limits and remaining usage |
| AI providers | OpenAI, Anthropic and Gemini CRUD, enable/disable, default selection and encrypted API keys |
| Chat | Provider selection, prompt/response persistence, conversations and history |
| Search | No-key basic search, history, recent queries, suggestions and 15-minute database cache |
| Admin | Dashboard totals, user/subscription/provider lists, usage analytics and request logs |
| Operations | Neon PostgreSQL, Prisma migration, health check, Docker, Swagger and Render Blueprint |

Email verification is included. Streaming remains the only bonus feature not implemented. Search uses DuckDuckGo Instant Answers as a zero-configuration fallback, not a commercial full web-search index. Provider health confirms usable configuration without sending a billable provider request.

## Architecture

```text
Chrome Extension / Swagger / API Client
                  |
          HTTP REST request
                  |
       Guards + Validation Pipes
                  |
             Controller
                  |
               Service
                  |
             Prisma ORM
                  |
        Neon PostgreSQL database

Chat Service --> OpenAI / Anthropic / Gemini
```

The request flow is `route -> JWT/role guard -> DTO validation -> controller -> service -> Prisma -> Neon -> response`. A global interceptor records endpoint, method, status and response time for analytics.

## Project structure

```text
src/
  auth/           JWT authentication, refresh-token rotation and email OTP
  users/          Profile and account management
  subscriptions/  Plans and usage limits
  providers/      Encrypted multi-provider configuration
  chat/           AI requests and conversation history
  search/         Search, history, suggestions and caching
  admin/          Statistics, analytics and logs
  common/         Guards, decorators and usage interceptor
  health/         Application and database readiness
  prisma/         Shared Prisma service
prisma/
  schema.prisma
  migrations/
test/
  app.e2e-spec.ts
```

## Features

- Registration, login, rotating refresh tokens and secure logout
- Gmail OTP email verification with database-backed expiry, resend cooldown, attempt limit and single use
- Profile updates, password changes and account deletion
- Admin/user roles and guarded admin endpoints
- Free/premium subscriptions with monthly request limits
- Encrypted OpenAI, Anthropic and Gemini API keys
- Provider selection, health/configuration status and defaults
- Chat conversations and message history
- Web search history, recent searches, suggestions and 15-minute caching
- API usage logs, analytics and system health
- OpenAPI documentation at `/docs`

## Setup

Requirements: Node.js 22+, npm and a Neon PostgreSQL database.

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

Set both `DATABASE_URL` and `DIRECT_URL` using the connection strings shown in the Neon dashboard. Use the pooled URL for `DATABASE_URL` and direct URL for migrations where available.

Generate secure values:

```bash
openssl rand -base64 48
openssl rand -hex 32
```

Use separate base64 values for the two JWT secrets and the 64-character hex value for `PROVIDER_ENCRYPTION_KEY`.

For email verification, use a Gmail account with 2-Step Verification enabled and create a Google App Password. Set `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME` and a separate random `OTP_SECRET` in `.env`. Never use the normal Gmail password and never commit real values.

## API

- API base: `http://localhost:3100/api/v1`
- Swagger UI: `http://localhost:3100/docs`
- Health: `GET /api/v1/health`

The Swagger UI documents request fields, authentication requirements and response schemas derived from the DTOs.

### Endpoint groups

| Prefix | Purpose |
| --- | --- |
| `/api/v1/auth` | Register, login, refresh, logout and email OTP verification |
| `/api/v1/users/me` | Current-user profile, password and account |
| `/api/v1/subscriptions` | Plan, status and remaining usage |
| `/api/v1/providers` | AI provider management |
| `/api/v1/chat` | Prompts, conversations and history |
| `/api/v1/search` | Search, history, recent and suggestions |
| `/api/v1/admin` | Admin-only statistics and operational data |
| `/api/v1/health` | Public application/database health |

## Database migrations

For development schema changes:

```bash
npx prisma migrate dev --name describe_the_change
```

For deployment:

```bash
npx prisma migrate deploy
```

Never commit `.env`. The submitted `.env.example` contains placeholders only.

## AI providers

Create a provider through `POST /api/v1/providers`. API keys are encrypted with AES-256-GCM before storage. Chat supports OpenAI, Anthropic and Gemini request formats. No provider secret is returned by the API.

## Email verification flow

1. Register with `POST /api/v1/auth/register`.
2. Send a code with `POST /api/v1/auth/email/send-otp` and `{ "email": "user@example.com" }`.
3. Read the six-digit code from the email.
4. Verify with `POST /api/v1/auth/email/verify` and `{ "email": "user@example.com", "otp": "483921" }`.
5. If necessary, request another code through `POST /api/v1/auth/email/resend-otp` after the cooldown.

Only an HMAC-SHA256 hash is stored in PostgreSQL. Codes expire after five minutes by default, become invalid after five wrong attempts, are single-use, and a new code invalidates older active codes. Send responses are deliberately generic so the endpoint does not reveal whether an account exists.

## Web search

Basic search uses DuckDuckGo Instant Answers and needs no API key. It is intentionally a lightweight, zero-configuration fallback rather than a full commercial web-search index. Search history, recent queries, suggestions and 15-minute database caching are included.

## Verification

```bash
npm run build
npm test
npm run test:e2e
npx prisma validate
```

The E2E suite uses the configured database, creates a unique temporary user, verifies health, registration, the complete OTP lifecycle through a mocked mail transport, JWT-protected profile access and refresh-token rotation, and deletes the test user before completing. The mock prevents automated tests from sending real email; Gmail SMTP credentials must be verified separately in the deployment environment.

## Deploy to Render

The included `render.yaml` defines a free Node.js web service. Push the repository to GitHub, choose **New > Blueprint** in Render, and select the repository. Add the secret values requested by Render:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PROVIDER_ENCRYPTION_KEY`
- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`

Render installs dependencies, generates Prisma Client, builds NestJS, applies pending migrations at startup, and launches the production server. Its health-check path is `/api/v1/health`. Render supplies the runtime `PORT`, so do not hardcode production port `3100` in the dashboard.

## Security notes

- Passwords use bcrypt with 12 rounds.
- Refresh tokens are stored only as SHA-256 hashes and rotated on use.
- Email OTPs are HMAC-hashed, time-limited, single-use and attempt-limited.
- Provider keys are encrypted at rest.
- DTO validation rejects unknown input fields.
- Authorization checks scope user-owned resources by `userId`.
- Helmet is enabled. Localhost and the assignment's EchoGPT extension origin are accepted automatically, so an extension ID is not required in `.env` during development.

# EchoGPT Backend REST API

Production-style backend for the EchoGPT browser extension, built with NestJS, PostgreSQL (Neon), Prisma ORM, JWT and Swagger.

## Features

- Registration, login, rotating refresh tokens and secure logout
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

## API

- API base: `http://localhost:3100/api/v1`
- Swagger UI: `http://localhost:3100/docs`
- Health: `GET /api/v1/health`

The Swagger UI documents request fields, authentication requirements and response schemas derived from the DTOs.

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

## Web search

Basic search uses DuckDuckGo Instant Answers and needs no API key. It is intentionally a lightweight, zero-configuration fallback rather than a full commercial web-search index. Search history, recent queries, suggestions and 15-minute database caching are included.

## Verification

```bash
npm run build
npm test
npx prisma validate
```

## Security notes

- Passwords use bcrypt with 12 rounds.
- Refresh tokens are stored only as SHA-256 hashes and rotated on use.
- Provider keys are encrypted at rest.
- DTO validation rejects unknown input fields.
- Authorization checks scope user-owned resources by `userId`.
- Helmet is enabled. Localhost and the assignment's EchoGPT extension origin are accepted automatically, so an extension ID is not required in `.env` during development.

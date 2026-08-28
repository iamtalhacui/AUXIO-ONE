# AUXIO One

Multi-tenant SaaS platform for NDIS providers (Australia).

## Run locally (W-01 & W-02)

**Prerequisites:** Node.js 20+, pnpm 11+, PostgreSQL running locally.

### 1. Install

```bash
pnpm install
```

### 2. Environment

Copy the example env and set your Postgres password:

```bash
cp .env.example packages/database/.env
```

Create the database once (psql, pgAdmin, etc.):

```sql
CREATE DATABASE auxio_one;
```

### 3. Database + seed

```bash
pnpm db:setup
```

### 4. Start server + client

In one terminal:

```bash
pnpm server:dev
```

In another terminal:

```bash
pnpm --filter @repo/client dev
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:3001`

## Postman

Import `postman/AUXIO-One-W01-W02.postman_collection.json`.

1. **Login — Super Admin**
2. **Create Organisation** (temp Org Admin password prints in server console)
3. **Login — Org Admin**
4. **List / Enable / Disable modules**

**Super Admin:** `superadmin@auxio.local` / `SuperAdmin123!`

## API endpoints

| Method | Path | Role |
|---|---|---|
| POST | `/auth/login` | Public |
| POST | `/auth/change-password` | Authenticated |
| POST | `/organisations` | SUPER_ADMIN |
| GET | `/organisations/:id` | Public |
| GET | `/organisations/:id/modules` | ORG_ADMIN |
| PATCH | `/organisations/:id/modules/:moduleCode` | ORG_ADMIN |

# Partido State University Executive Dashboard

Official public analytics platform for Partido State University. Anyone with the URL can view published information. There is no public registration. Administrators sign in at `/admin/login`.

## Technology stack

- Next.js 16 App Router, TypeScript, Tailwind CSS
- Prisma ORM with PostgreSQL (Docker Compose locally; Neon or Vercel Postgres in production)
- ExcelJS for workbook import
- Recharts for visualizations
- bcrypt + httpOnly session cookies for administrator authentication

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start PostgreSQL and create the database:

```bash
docker compose up -d
npx prisma generate
npx prisma migrate deploy
```

3. Import `Executive-Dashboard.xlsx` and create the first administrator:

```bash
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public dashboard.

Default local administrator (change immediately):

- Email: value of `ADMIN_EMAIL`
- Password: value of `ADMIN_PASSWORD`

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Local Docker default is in `.env.example`. |
| `AUTH_SECRET` | Session signing secret. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap administrator. |
| `AUTH_COOKIE_SECURE` | Set `true` behind HTTPS. |
| `EXCEL_SOURCE_PATH` | Workbook used by the seed importer. |

## Database

- Local: PostgreSQL via `docker compose` on port 5433
- Production: Neon or Vercel Postgres. See `DEPLOYMENT.md`.

## Initial Excel import

The seed command parses `Executive-Dashboard.xlsx`, stores normalized records, records validation warnings (including cross-sheet conflicts), and publishes the first dataset versions. KPI values are calculated from those records and are not hard-coded in the UI.

## Tests

```bash
npm test
```

## Production

See `DEPLOYMENT.md`, `ADMIN_GUIDE.md`, `IMPORT_GUIDE.md` and `DATA_MODEL.md`.

# Deployment

## Local PostgreSQL

```bash
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

`DATABASE_URL` for local Docker:

```
postgresql://parsu:parsu_local_dev@localhost:5433/parsu_dashboard?schema=public
```

## Vercel + hosted PostgreSQL

1. Push this repository to GitHub.
2. Create a Neon or Vercel Postgres database and copy the connection string (`?sslmode=require`).
3. Import the GitHub repo in Vercel. Set environment variables (never commit `.env`):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Hosted Postgres URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First administrator |
| `NEXT_PUBLIC_SITE_NAME` | Public site name |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` |
| `AUTH_COOKIE_SECURE` | `true` |
| `EXCEL_SOURCE_PATH` | `./Executive-Dashboard.xlsx` |
| `GEMINI_API_KEY` (optional) | Preferred chatbot provider. If omitted, the chatbot still answers from published dashboard figures. |
| `GEMINI_MODEL` (optional) | Defaults to `gemini-3.1-flash-lite`. |
| `OPENAI_API_KEY` (optional) | Used when Gemini is not set. |
| `AI_GATEWAY_API_KEY` (optional) | Alternative to OpenAI. On Vercel, OIDC (`VERCEL_OIDC_TOKEN`) can also reach AI Gateway. |
| `GROQ_API_KEY` (optional) | OpenAI-compatible Groq fallback. |
| `CHAT_MODEL` (optional) | Defaults to `gpt-4o-mini` (OpenAI) or `openai/gpt-4o-mini` (AI Gateway). |

4. From your laptop, create tables and import the workbook **once** against the production URL:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/db?sslmode=require"
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

5. Deploy (or redeploy) on Vercel. The build runs `prisma generate && prisma migrate deploy && next build`.

Admin Excel uploads write to `uploads/` and will not persist on Vercel’s filesystem. Re-import from your laptop, or use the admin UI only after adding cloud storage.

## Production checklist

- Generate a long `AUTH_SECRET`
- Set `AUTH_COOKIE_SECURE=true`
- Change `ADMIN_PASSWORD`
- Serve HTTPS
- Restrict `/uploads` so imported workbooks are not publicly downloadable
- Back up the database
- Confirm the ParSU logo at `public/parsu-logo.png` is the official seal and has not been redrawn

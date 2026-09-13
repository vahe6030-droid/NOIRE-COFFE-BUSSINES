# NOIRÉ — Vercel deployment

The project keeps the existing NOIRÉ design and admin panel. The Express app is deployed as a Vercel Node Function through `api/index.js` and `vercel.json`.

## Required Environment Variables

- `DATABASE_URL` — Neon PostgreSQL connection string.
- `NOIRE_SESSION_SECRET` — long random secret used to sign admin/customer sessions.
- `NOIRE_ADMIN_USER` — admin username (for example `admin`).
- `NOIRE_ADMIN_PASSWORD` — admin password.

Optional:
- `OPENAI_API_KEY` — enables the AI provider.
- `OPENAI_MODEL` — optional model override.

Do not commit `.env` or any secret to GitHub.

## Deploy

1. Push the project root to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables above for the Production environment.
4. Redeploy.
5. Open `/admin` and sign in.

The admin session is stateless and signed, so it does not depend on one Vercel serverless instance staying alive.

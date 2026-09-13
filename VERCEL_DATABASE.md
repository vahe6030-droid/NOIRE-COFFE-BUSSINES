# NOIRÉ — Vercel + Neon production setup

1. Create a Neon PostgreSQL database and put its connection string into Vercel as `DATABASE_URL`.
2. Set `NOIRE_SESSION_SECRET` to a random value of at least 32 characters.
3. Set `NOIRE_ADMIN_USER` and `NOIRE_ADMIN_PASSWORD` in Vercel. Do not put them in source files.
4. Set `NOIRE_TIMEZONE=Asia/Yerevan` unless the business operates in another timezone.
5. Optional: set `NOIRE_RESERVATION_DURATION_MINUTES=90`.
6. Optional password reset: set `RESEND_API_KEY` and `NOIRE_EMAIL_FROM`.

On first production request, the app creates the `noire_data` table plus its auxiliary concurrency/idempotency tables automatically. A new production store is seeded empty; the bundled local JSON fixture is never used as production seed data.

The owner credential is stored as a PBKDF2 hash after the first successful environment-credential login.

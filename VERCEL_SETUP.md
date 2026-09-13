# NOIRÉ — setup

## Local

Create `.env` in the project root:

- `DATABASE_URL=...`
- `NOIRE_SESSION_SECRET=...`
- `NOIRE_ADMIN_USER=admin`
- `NOIRE_ADMIN_PASSWORD=...`
- `PORT=3000`

Then run `npm install` and `npm start`.

## Vercel

Use the same variables in Vercel → Settings → Environment Variables. Do not upload `.env` to GitHub.

The admin panel uses the same existing tabs and design. Menu, orders, reservations, tables, gallery, employees, settings and history are persisted in Neon.

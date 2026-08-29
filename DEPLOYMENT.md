# Deployment Guide — Lomba Nasional Milad 290 Sidogiri

Production-ready Next.js 14 + PostgreSQL full-stack app. Replicates original design, handles registration, scoring, file uploads, admin panel.

## Quick Start (Local Dev)

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Visit `http://localhost:3000`. Admin login: `admin@miladsidogiri.id` / `Sidogiri290!`

## Environment Setup

Copy `.env.example` → `.env` and fill in:

```
DATABASE_URL="postgresql://user:pass@host:5432/milad290?schema=public"
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL="https://yourdomain.com"
RESEND_API_KEY=""  # Optional: for email notifications via Resend
STORAGE_PROVIDER="local"  # or "vercel-blob" / "supabase" for production
```

## Database

- **Local**: PostgreSQL 16+. Run `npx prisma db push` to apply schema.
- **Production**: Use managed PostgreSQL (Supabase, Railway, Render, Neon, etc.).
  - Update `DATABASE_URL` in production env vars.
  - Run migration on first deploy: `npx prisma migrate deploy` (if using migrations) or `npx prisma db push` (schema-driven).

## File Storage

### Local (Development)
Files saved to `./storage/uploads/` (non-public, protected via `/api/berkas`).

### Production
- **Vercel Blob**: Set `STORAGE_PROVIDER=vercel-blob` + `BLOB_READ_WRITE_TOKEN` in env.
- **Supabase Storage**: Set `STORAGE_PROVIDER=supabase` + configure in `src/lib/storage.ts`.
- **AWS S3**: Implement in `src/lib/storage.ts` using `aws-sdk`.

Currently: `STORAGE_PROVIDER=local` (default).

## Deployment

### Vercel

1. Push repo to GitHub.
2. Connect to Vercel → Auto-deploys on push.
3. Set env vars in Vercel dashboard (DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY).
4. On first deploy, Vercel runs `npm run build` which includes `prisma generate && next build`.

For file storage on Vercel, use **Vercel Blob** (set STORAGE_PROVIDER, BLOB_READ_WRITE_TOKEN).

### Railway

1. Connect GitHub repo.
2. Add PostgreSQL plugin (Railway creates DB + DATABASE_URL).
3. Set env vars: AUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY.
4. Deploy: Railway auto-runs `npm run build` and `npm start`.

### Render

1. Create Web Service (GitHub repo).
2. Add PostgreSQL database (Render auto-sets DATABASE_URL).
3. Build command: `npm run build`
4. Start command: `npm start`
5. Set env vars in Render dashboard.

### Self-Hosted VPS

```bash
git clone <repo> && cd <repo>
npm install --production
npx prisma db push
npm run build
npm start
```

Use a process manager (PM2, systemd) to keep app running. Proxy via Nginx/Apache.

## Authentication

- **Admin credentials** seeded: `admin@miladsidogiri.id` / `Sidogiri290!`
- Change in production: Update `prisma/seed.ts` or use admin panel (not yet implemented).
- NextAuth v4 with Credentials provider. Session stored in database (via Prisma adapter planned; currently in-memory for dev).

## Email Notifications

Optional: Set `RESEND_API_KEY` + `RESEND_FROM` to send registration confirmation emails.
- Without these, app functions normally; emails are skipped silently.

## Rate Limiting

Current: In-memory rate limiter (5 req/min per IP on `/api/pendaftar`).

For production multi-instance deployments, use **Upstash Redis**:
- Set up Redis in `src/lib/rate-limit.ts`.
- Update `DATABASE_URL` to Upstash Redis connection string.

## Scripts

- `npm run dev` — Dev server (hot reload).
- `npm run build` — Production build.
- `npm start` — Run production build.
- `npm run lint` — ESLint check.
- `npm run typecheck` — TypeScript check.
- `npx prisma db push` — Sync schema to DB.
- `npx prisma migrate dev` — Create new migration (schema-driven).
- `npx prisma db seed` — Seed initial data.
- `npx prisma studio` — Prisma Studio (DB GUI).

## Key Features

✓ Landing page (countdown, cabang tabs, info)  
✓ Registration form (file upload, validation, auto-token)  
✓ Status check (nomor + token lookup)  
✓ Admin login (NextAuth Credentials)  
✓ Admin pendaftaran (verify/reject, view berkas, set status)  
✓ Admin penilaian (input nilai, auto-rank top-5 finalists)  
✓ Admin kuota (adjust per-cabang limits)  
✓ Admin pengumuman (publish announcements)  
✓ Protected file serving (`/api/berkas` owner+admin)  
✓ Emails (Resend optional)  

## Known Limitations

- Rate limiting in-memory (multi-instance: use Redis).
- Session adapter in-memory (multi-instance: use Prisma adapter).
- Admin password change not implemented in UI (edit `prisma/seed.ts` or use direct DB update).
- Email provider optional (no SMS backup).

## Support

For issues or customizations:
- Check `.env.example` for all available env vars.
- Review `prisma/schema.prisma` for DB structure.
- See `src/lib/data.ts` for event content (cabang, timeline, prizes, contact).

---

**Deployment Status**: Production-ready. Tested on local PostgreSQL + Next.js dev server. Ready for Vercel/Railway/Render.
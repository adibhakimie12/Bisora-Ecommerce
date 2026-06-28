# Backend Environment

Bisora backend uses Laravel with Supabase Postgres and Supabase Storage.

Required services:

- Supabase project with Postgres enabled
- Supabase Storage buckets: `public-storefront-media`, `private-store-documents`
- Redis for queues/cache
- Laravel app URL
- React dashboard URL
- SMTP provider for production email

Use Supabase pooler credentials for `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_PASSWORD`.
Use Supabase S3-compatible storage credentials for upload access.

Never expose service role keys, database passwords, storage secret keys, or gateway secrets in the React frontend.

Production readiness:

- Use `backend/.env.production.example` as the backend environment map.
- Use `exports/dashboard/.env.production.example` as the frontend environment map.
- Set `CORS_ALLOWED_ORIGINS` to the admin dashboard domain.
- Set `BISORA_TRIAL_DAYS` to the free trial length.
- Monitor `GET /api/health`; it reports app, database, queue, and storage readiness.
- Run Horizon or a queue worker continuously in production.

Local Windows note:

- Laravel Horizon requires `pcntl` and `posix`, which are Linux extensions.
- Composer may need `--ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix` on Windows.
- Production workers should run on Linux where Horizon requirements are available.

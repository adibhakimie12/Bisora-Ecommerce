# Backend Environment

Bisora backend uses Laravel with Supabase Postgres and Supabase Storage.

Required services:

- Supabase project with Postgres enabled
- Supabase Storage buckets: `public-storefront-media`, `private-store-documents`
- Redis for queues/cache
- Laravel app URL
- React dashboard URL

Use Supabase pooler credentials for `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_PASSWORD`.
Use Supabase S3-compatible storage credentials for upload access.

Never expose service role keys, database passwords, storage secret keys, or gateway secrets in the React frontend.

Local Windows note:

- Laravel Horizon requires `pcntl` and `posix`, which are Linux extensions.
- Composer may need `--ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix` on Windows.
- Production workers should run on Linux where Horizon requirements are available.

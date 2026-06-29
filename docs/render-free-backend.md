# Render Free Backend Setup

Goal: run the Bisora Laravel API for one test seller using Render Free Web Service, Supabase Postgres, and Supabase Storage.

## Stack

- Admin frontend: Vercel `https://bisora-admin.vercel.app`
- API host: Render Free Web Service
- Database: Supabase Postgres free
- Media storage: Supabase Storage free
- Queue/cache: database-backed, no Redis
- Email/notifications: log mode for test

## Render Service

Create a Render Web Service:

- Runtime: Docker
- Root directory: `backend`
- Dockerfile path: `Dockerfile`
- Instance type: Free
- Health check path: `/api/health`

Render gives a URL like:

```text
https://bisora-api.onrender.com
```

The API base URL for Vercel is:

```text
https://bisora-api.onrender.com/api
```

## Required Environment Variables

Set these in Render > Environment:

```env
APP_NAME=Bisora
APP_ENV=production
APP_KEY=base64:PASTE_GENERATED_APP_KEY
APP_DEBUG=false
APP_URL=https://bisora-api.onrender.com
FRONTEND_URL=https://bisora-admin.vercel.app
CORS_ALLOWED_ORIGINS=https://bisora-admin.vercel.app

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=supabase
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS=hello@bisora.test
MAIL_FROM_NAME=Bisora

SUPABASE_STORAGE_KEY=YOUR_SUPABASE_S3_ACCESS_KEY
SUPABASE_STORAGE_SECRET=YOUR_SUPABASE_S3_SECRET_KEY
SUPABASE_STORAGE_REGION=ap-southeast-1
SUPABASE_STORAGE_BUCKET_PUBLIC=public-storefront-media
SUPABASE_STORAGE_BUCKET_PRIVATE=private-store-documents
SUPABASE_STORAGE_ENDPOINT=https://YOUR_PROJECT_REF.supabase.co/storage/v1/s3
SUPABASE_STORAGE_URL=https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public

BISORA_OWNER_EMAIL=adib.hakimi19@gmail.com
BISORA_DEFAULT_PLAN=premium
BISORA_MAX_UPLOAD_MB=20
BISORA_TRIAL_DAYS=14
BISORA_NOTIFICATION_DELIVERY_MODE=log
BISORA_SEED_ON_BOOT=true
```

Generate `APP_KEY` locally from the backend folder:

```bash
php artisan key:generate --show
```

Copy the printed value into Render.

Keep `BISORA_SEED_ON_BOOT=true` only for the first successful deploy. After owner and demo seller accounts exist, change it to:

```env
BISORA_SEED_ON_BOOT=false
```

This prevents demo seed data from resetting store settings after your sister starts building the real storefront.

## Supabase Setup

Create these Storage buckets:

```text
public-storefront-media
private-store-documents
```

Use Supabase pooler credentials for:

```text
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
```

Use Supabase S3-compatible storage credentials for:

```text
SUPABASE_STORAGE_KEY
SUPABASE_STORAGE_SECRET
SUPABASE_STORAGE_ENDPOINT
SUPABASE_STORAGE_URL
```

## Vercel Environment

After Render is live, set these in Vercel project `bisora-admin`:

```env
VITE_API_URL=https://bisora-api.onrender.com/api
SITE_URL=https://bisora-admin.vercel.app
APP_URL=https://bisora-admin.vercel.app
```

Redeploy Vercel after saving env values.

## Smoke Test

Open:

```text
https://bisora-api.onrender.com/api/health
```

Expected: JSON with `status`.

Then test:

1. Login owner from Vercel.
2. Create or login seller workspace for your sister.
3. Add product.
4. Upload product image.
5. Publish storefront.
6. Open `https://bisora-admin.vercel.app/#/store/bisora-demo`.
7. Place test order.
8. Confirm order appears in seller dashboard.

## Free Plan Limits

Render Free Web Service sleeps after idle time. First request after sleep can be slow. This is acceptable for one test seller, but not for real customer launch.

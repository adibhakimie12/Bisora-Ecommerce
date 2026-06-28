# Bisora Go-Live Checklist

Use this checklist before giving free trials to real customers.

## Required Services

- Laravel API host with PHP 8.3+, HTTPS, and persistent workers.
- Local `php artisan serve` is for development only. For production, run Laravel under a real web server or managed PHP host with a process manager.
- Vercel can host the React admin dashboard before you buy a domain. Use the generated `https://<project>.vercel.app` URL as the temporary admin URL.
- Do not use Vercel as the Laravel API host for this app. The backend needs a PHP host with Composer, migrations, queues, scheduler, and workers.
- Supabase Postgres using pooler credentials.
- Supabase Storage with `public-storefront-media` and `private-store-documents` buckets.
- Redis for cache and queues.
- Frontend static host for the React admin dashboard.
- SMTP provider for customer-facing and seller-facing emails.

## Backend Environment

- Copy `backend/.env.production.example` into the production host environment.
- Generate `APP_KEY` on the production host with `php artisan key:generate --show`.
- Set `APP_DEBUG=false`.
- Set `APP_URL` to the public API domain.
- Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the Vercel admin URL, for example `https://bisora-admin.vercel.app`, until you buy a custom domain.
- Set Supabase DB credentials, Redis credentials, SMTP credentials, and Supabase S3 storage credentials.
- Keep all DB, Redis, Supabase secret, and SMTP values out of the React frontend.

## Frontend Environment

- Copy `exports/dashboard/.env.production.example` into the frontend host environment.
- Set `VITE_API_URL` to the public Laravel API URL ending with `/api`, for example `https://your-api-host.example.com/api`.
- Set `SITE_URL` and `APP_URL` to the Vercel admin URL, for example `https://bisora-admin.vercel.app`, until you buy a custom domain.

## Deployment Commands

Backend release:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan horizon:publish
php artisan horizon
php artisan bisora:notifications:send --limit=100
```

Run `php artisan bisora:notifications:send --limit=100` from a scheduler every minute, or supervise it as a recurring worker task.

Frontend release:

```bash
npm ci
npm run build
```

Vercel release from the `ecommerce - admin` folder:

```bash
vercel --prod
```

The included `vercel.json` builds only `exports/dashboard` and serves `exports/dashboard/dist`.

## Runtime Checks

- During local testing, run `npm run local:watch` from the project root to keep the Laravel API and dashboard alive with auto-restart.
- `GET https://api.your-bisora-domain.com/api/health` returns `status: ok`.
- `POST /api/auth/trial` creates a new trial workspace and returns a token.
- `POST /api/auth/login` works for the platform owner account.
- `GET /api/me` works with the returned bearer token.
- Product image upload intent returns a signed Supabase Storage URL.
- Horizon or the queue worker is running.
- `php artisan bisora:notifications:send --limit=10` can process queued notification logs.

## Trial Controls

- `BISORA_TRIAL_DAYS` controls default trial length.
- Suspended tenants are blocked from tenant APIs.
- Expired trials are blocked unless superadmin grants free access.
- Superadmin can reactivate tenants and grant free access from the owner workspace.

## Production Smoke Test

1. Start a new trial from the login screen.
2. Add a product and upload an image.
3. Save General, Checkout, Domain/Branding, Payment, and Shipping settings.
4. Check Dashboard and Reports load from API data.
5. Login as platform owner and confirm the trial tenant appears in Superadmin.

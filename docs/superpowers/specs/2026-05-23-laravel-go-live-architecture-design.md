# Laravel Go-Live Architecture Design

## Context

Bisora is currently a React and Vite admin prototype under `exports/dashboard`. The admin modules, storefront preview, website builder, SEO tools, reports, settings, and superadmin screens are mostly static seed data or browser `localStorage`. The repository does not yet contain a Laravel backend, real database schema, real auth, storage pipeline, queue workers, realtime events, or production deployment pipeline.

This design turns the prototype into a production SaaS foundation while keeping Laravel as the source of truth. Supabase is used where it helps speed up infrastructure: managed PostgreSQL and S3-compatible object storage. Laravel remains responsible for authentication, tenant authorization, billing rules, API validation, business workflows, queues, and audit logs.

## Architecture Decision

Use a Laravel API monolith with a React admin frontend.

- Backend: Laravel API in `backend/`
- Admin frontend: existing React app in `exports/dashboard`
- Database: Supabase PostgreSQL
- Storage: Supabase Storage through its S3-compatible API, abstracted by Laravel filesystem disks
- Queue/cache/session support: Redis
- Queue dashboard: Laravel Horizon
- Realtime: Laravel Reverb first; Supabase Realtime can be added later for low-risk read-only storefront updates
- Auth: Laravel Sanctum for seller/admin/customer sessions
- Payments/courier/email/WhatsApp integrations: Laravel service classes and queued jobs
- Deployment: frontend static build plus Laravel app hosting, with separate queue and scheduler workers

Supabase Auth is intentionally not used in phase 1. Seller/admin/customer permissions need tenant-aware roles, staff invites, superadmin override, plan gates, audit logging, and future enterprise controls. Laravel policies, gates, Sanctum tokens, and database constraints are a better fit for that core.

## Current Audit Findings

The current frontend builds with Vite, but TypeScript and tests are not clean. `luxuryMuslimahTemplate.test.ts` imports `resolveBuilderView` from `WebsiteBuilderModule.tsx`, but that export no longer exists. Build passes, but `npm --prefix exports/dashboard run lint` and `npm --prefix exports/dashboard test` fail on that missing export.

The docs describe future folders such as `backend/`, `app/`, and `frontend-store/`, but the codebase currently uses `exports/dashboard` and separate export references. The production architecture should update docs and repo structure so the actual code matches the intended system.

Important risks:

- Seller data persists in browser `localStorage`, not a database.
- Superadmin access is checked client-side through Vite env values, not a backend policy.
- API keys and gateway settings are represented in frontend state.
- `SettingsModule.tsx` and `WebsiteBuilderModule.tsx` are very large and should be split as backend integration work touches them.
- No real tenant boundary exists.
- No upload signing, storage rules, image pipeline, or media ownership exists.
- Queue/realtime labels in the UI are currently simulated.

## Production Modules

### Identity And Tenancy

Laravel owns users, tenants, stores, roles, staff invites, customer accounts, and superadmin access. Every tenant-owned table includes `tenant_id`. Every request resolves tenant context from one of these sources:

- admin session and selected store
- custom storefront domain
- managed subdomain
- signed internal worker payload

Core tables:

- `users`
- `tenants`
- `stores`
- `tenant_user`
- `roles`
- `permissions`
- `staff_invites`
- `customer_accounts`
- `customer_addresses`
- `audit_logs`

### Catalog

Products, variants, categories, inventory, media, SEO fields, and publish state move from seed data and `localStorage` into Laravel APIs.

Core tables:

- `products`
- `product_variants`
- `categories`
- `category_product`
- `inventory_movements`
- `media_assets`
- `seo_metadata`

Required indexes:

- `products(tenant_id, status)`
- `products(tenant_id, slug)`
- `product_variants(product_id, sku)`
- `categories(tenant_id, slug)`
- `media_assets(tenant_id, owner_type, owner_id)`

### Website Builder

The builder stores draft state separately from published snapshots. Drafts can be edited often; published snapshots are immutable enough to serve storefront traffic safely.

Core tables:

- `themes`
- `store_theme_installs`
- `builder_pages`
- `builder_page_versions`
- `builder_sections`
- `published_site_snapshots`
- `navigation_menus`
- `blog_posts`
- `metafields`

Recommended page data model:

- structured columns for identity, slug, status, SEO, timestamps
- JSONB for flexible builder content
- version table for rollback and preview

Required indexes:

- `builder_pages(tenant_id, status)`
- `builder_pages(tenant_id, slug)`
- `builder_page_versions(page_id, version_number)`
- `published_site_snapshots(tenant_id, domain_id, published_at)`
- `blog_posts(tenant_id, slug)`

### Orders And Checkout

Checkout must be backend-owned. The frontend may render checkout UI, but totals, discount validation, shipping rates, inventory holds, payment sessions, and order creation happen through Laravel.

Core tables:

- `carts`
- `cart_items`
- `checkouts`
- `orders`
- `order_items`
- `payments`
- `refunds`
- `shipments`
- `fulfillment_events`
- `abandoned_checkouts`

Required indexes:

- `orders(tenant_id, created_at)`
- `orders(tenant_id, status)`
- `orders(tenant_id, customer_id)`
- `payments(order_id, status)`
- `shipments(order_id, tracking_number)`
- `abandoned_checkouts(tenant_id, recovered_at, created_at)`

### Marketing And Automation

Marketing actions become queued workflows. Broadcasts, abandoned cart recovery, discount campaigns, AI blog generation, and webhooks are persisted and processed asynchronously.

Core tables:

- `discounts`
- `funnels`
- `funnel_steps`
- `automation_rules`
- `automation_runs`
- `broadcasts`
- `broadcast_recipients`
- `webhook_endpoints`
- `webhook_deliveries`
- `ai_action_queue`

Queue jobs:

- `SendBroadcastMessage`
- `RunAbandonedCartRecovery`
- `GenerateBlogDraft`
- `RebuildSitemap`
- `DeliverWebhook`
- `SyncCourierTracking`
- `ExportReportCsv`
- `SendOrderNotification`

### Superadmin

Superadmin must be backend-gated and audited. The frontend should only render superadmin navigation after `/api/me` returns platform-owner permissions.

Core tables:

- `plans`
- `subscriptions`
- `tenant_plan_limits`
- `billing_events`
- `feature_flags`
- `platform_gateway_configs`
- `tenant_suspensions`

Rules:

- Never trust frontend env for owner checks.
- Encrypt gateway secrets at rest.
- Log every plan change, suspension, free access grant, gateway update, and tenant impersonation.

## API Surface

Phase 1 endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/stores/current`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{product}`
- `PATCH /api/products/{product}`
- `DELETE /api/products/{product}`
- `GET /api/categories`
- `POST /api/categories`
- `POST /api/media/presign`
- `POST /api/media/complete`
- `GET /api/website/pages`
- `POST /api/website/pages`
- `PATCH /api/website/pages/{page}`
- `POST /api/website/pages/{page}/publish`
- `GET /api/website/published-snapshot`
- `GET /api/settings/store`
- `PATCH /api/settings/store`

Phase 2 endpoints:

- checkout, cart, order, payment webhook, customer account, shipping, reports, marketing automation, integrations, superadmin billing.

## Storage Rules

Use Laravel as the upload authority. Browser asks Laravel for upload permission. Laravel validates tenant, file type, size, plan quota, and target owner before issuing an upload target.

Buckets:

- `public-storefront-media`
- `private-store-documents`
- `product-imports`
- `exports`
- `theme-assets`

Rules:

- Public storefront images can be served publicly through CDN paths.
- Private documents use signed URLs.
- Uploads include `tenant_id`, owner type, checksum, mime type, size, width, height, and moderation status.
- Plan quota is checked before presign and after completion.
- Deleting a product or page detaches media first; physical delete is queued.

## Realtime

Use Laravel Reverb for admin operational events:

- order created
- payment paid or failed
- shipment status changed
- export ready
- builder publish completed
- automation run failed
- notification received

Use private channels:

- `tenant.{tenantId}.orders`
- `tenant.{tenantId}.notifications`
- `tenant.{tenantId}.builder`
- `tenant.{tenantId}.reports`

Supabase Realtime can be considered later for public storefront read-only updates, but phase 1 keeps realtime auth and tenancy inside Laravel.

## Queue And Automation

Use Redis queues with Horizon. Queues:

- `critical`: payment webhooks, order creation, inventory reservation
- `default`: notifications, sitemap rebuilds, integration sync
- `media`: image processing, cleanup
- `reports`: CSV exports and analytics snapshots
- `ai`: AI content generation and insight jobs
- `webhooks`: outbound webhook delivery

Failure rules:

- retries use exponential backoff
- all external calls have timeouts
- failed jobs write a visible admin notification when user action is needed
- webhook deliveries keep request/response status without storing sensitive secrets
- dead jobs stay inspectable in Horizon and `failed_jobs`

## Hosting And Deployment

Recommended simple production setup:

- Laravel app: Laravel Forge, Ploi, Render, Railway, or Fly.io
- Database: Supabase Postgres
- Storage: Supabase Storage S3-compatible endpoint
- Redis: managed Redis from hosting provider or Upstash
- Frontend: Vercel or same Laravel host serving built assets
- Scheduler: `php artisan schedule:run` every minute
- Workers: separate queue worker process supervised by host
- Horizon: protected by superadmin middleware

Environment groups:

- local
- staging
- production

CI pipeline:

- install PHP dependencies
- run Laravel Pint
- run PHPStan or Larastan
- run Laravel tests
- install dashboard dependencies
- run TypeScript lint
- run frontend tests
- run frontend build
- block deploy if any required check fails

## Frontend Migration Plan

Create an API client layer before replacing UI state:

- `exports/dashboard/src/api/http.ts`
- `exports/dashboard/src/api/auth.ts`
- `exports/dashboard/src/api/products.ts`
- `exports/dashboard/src/api/website.ts`
- `exports/dashboard/src/api/media.ts`

Then replace `localStorage` stores one domain at a time:

1. Products and categories
2. Website pages and published snapshots
3. Media uploads
4. Store settings
5. Blog posts
6. Orders and customers

The first slice must keep existing UI behavior while persistence moves to Laravel.

## Testing Strategy

Backend:

- feature tests for every API endpoint
- policy tests for tenant isolation
- queue job tests for side effects
- payment webhook signature tests
- storage presign validation tests
- database migration tests in CI

Frontend:

- TypeScript compile check
- unit tests for API adapters and view models
- integration tests for products and website builder persistence
- Playwright smoke tests for dashboard, products, website builder, and settings

Release gates:

- no TypeScript errors
- no failing frontend tests
- no failing backend tests
- migration rollback tested for new tables
- staging deployment smoke-tested before production

## Implementation Slices

### Slice 0: Repair Current Frontend Health

Fix the missing `resolveBuilderView` export or update the stale test. Confirm lint, tests, and build all pass. This is required before deeper backend integration so regressions are visible.

### Slice 1: Laravel Foundation

Create `backend/`, configure Sanctum, connect Supabase Postgres, add Redis, add tenancy base models, and expose `/api/me`.

### Slice 2: Catalog API

Move products, variants, categories, inventory basics, and product SEO from seed/local storage into Laravel.

### Slice 3: Media Storage

Add Supabase Storage S3 disk, media table, upload presign, completion endpoint, quotas, and public/private URL handling.

### Slice 4: Website Builder Persistence

Persist pages, sections, drafts, versions, publish snapshots, menus, and SEO data. Replace website builder `localStorage` for pages/products bridge.

### Slice 5: Storefront Snapshot Serving

Expose published snapshot APIs by domain/subdomain. Generate sitemap and robots from backend state.

### Slice 6: Orders And Checkout

Add carts, checkout sessions, payment gateway webhooks, orders, inventory reservation, shipment base flow, and customer accounts.

### Slice 7: Automation, Realtime, And Superadmin

Add Horizon jobs, Reverb channels, notifications, plan limits, subscriptions, feature flags, and superadmin controls.

## Open Decisions

The only major decision left before implementation is hosting provider. The architecture works with Forge/Ploi VPS, Render, Railway, or Fly.io. For fastest Malaysian seller SaaS launch, use a managed Laravel host plus Supabase, then move to dedicated infrastructure only after traffic requires it.

## Sources Checked

- Supabase Storage supports S3-compatible access and image/media storage features.
- Supabase Realtime listens to Postgres changes over WebSockets, but phase 1 keeps private operational realtime in Laravel Reverb for tighter tenant authorization.
- Laravel Horizon manages Redis-backed queues.

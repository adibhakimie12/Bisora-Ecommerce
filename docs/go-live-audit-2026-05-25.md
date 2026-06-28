# Bisora Go-Live Audit - 2026-05-25

Goal: make Bisora safe for real free-trial customers, with the seller/admin app, public storefront, Laravel API, database, storage, queues, and production pipeline working as one system.

## Verification Baseline

- Backend tests: `php artisan test` passes 88 tests and 394 assertions.
- Frontend tests: `npm test -- --runInBand` passes 100 tests.
- Frontend build: `npm run build` passes.
- TypeScript: `npm run lint` passes.
- Laravel production cache commands pass: `config:cache`, `route:cache`, `view:cache`, then `optimize:clear`.
- Local owner login API passes for `adib.hakimi19@gmail.com`; CORS allows `http://127.0.0.1:3000`.

## Current Architecture

- Frontend: React/Vite admin dashboard in `exports/dashboard`.
- Backend: Laravel API in `backend`.
- Auth: Laravel Sanctum token auth.
- Tenancy: `X-Tenant-Id` header resolved by `ResolveTenant`; platform owner bypasses tenant limits and tenant access blocks.
- Database: Laravel migrations cover tenants, stores, users, roles, audit logs, categories, products, media assets, packages, gateways, customers, orders, reviews, notification logs, jobs, cache, sessions, and tokens.
- Storage: media presign/complete flow exists; production target is Supabase S3-compatible storage.
- Queue/automation: notification logs, order placed/payment/shipping automations, delivery command, retry/process endpoints.
- Public storefront: public store fetch, public checkout, and order tracking APIs exist.

## Module Mapping

| Area | Backend Status | Frontend Status | Go-Live Status |
| --- | --- | --- | --- |
| Login / signup | Login, logout, trial signup, owner login ready | Login screen connected | Ready for trial launch |
| Superadmin | Overview, tenants, access, free access, packages, gateways ready | Owner console connected | Usable, billing webhooks still missing |
| Dashboard | Metrics, revenue, transactions, activity, onboarding from API | Connected with offline fallback | Ready |
| Products | Product CRUD, category list/create, plan limits, media presign | Product create/update connected; category edit/delete and inventory bulk still mock | Needs hardening before broad seller use |
| Orders | List, show, status update, notification automation | List/detail/status connected; manual order, invoice send, bulk shipment still mock | Core order ops ready, shipping ops incomplete |
| Customers | CRUD, notes, contact, deactivate, reviews export/moderation | Connected with offline fallback | Ready for CRM basics |
| Marketing | Workspace settings, discounts, upsells, recovery, broadcasts, queue actions | Connected for save/queue; export is local | Usable for simple campaigns |
| Reports | Overview and finance summary API | Connected with offline fallback | Ready for basic reporting |
| Settings | Store profile/settings/publish/unpublish, notification logs/process/test | Large settings UI persists many settings to JSON; real courier/payment/domain verification not implemented | Needs provider-specific integrations |
| Website Builder | Pages/blog stored inside store settings JSON; products from catalog API | Builder UI mostly functional; theme/runtime settings partly local | Needs publish snapshot/version API |
| Public Storefront | Store fetch, checkout, order tracking | Runtime connected | MVP ready with manual payment |
| Customer Account | No buyer auth/order account API yet | Theme account screens are preview/mock | Not go-live as real customer account |

## Critical Gaps Before Public Free Trial

1. Production hosting decision and deployment target are not wired yet.
   - Need final choice for Laravel host, frontend host, database, storage, Redis, and domain.
   - Local `php artisan serve` is only development; production needs managed PHP/Nginx plus process manager.

2. Billing/subscription payment is not live.
   - Superadmin packages and gateway configs exist.
   - Missing: subscription checkout, payment webhooks, invoice records, renewals, failed payment handling, and tenant auto-suspend by billing event.

3. Website Builder persistence is not first-class yet.
   - Pages and blog posts are saved inside `stores.settings` JSON.
   - Missing: builder drafts, publish snapshots, theme versioning, menus, sections, reusable blocks, and rollback.

4. Shipping/courier operations are not real provider integrations.
   - Order status/tracking can be saved.
   - Missing: shipment creation, courier rate lookup, label/waybill generation, webhook tracking updates.

5. Payment checkout is manual only.
   - Public checkout creates pending orders.
   - Missing: live payment intent/session, payment callback, payment proof upload, automatic paid status.

6. Product module still has mock subflows.
   - Real product CRUD works.
   - Missing: category edit/delete backend calls, inventory bulk persistence, variant-level persistence, image upload UI wired to media presign.

7. Staff roles are schema-ready but not productized.
   - Roles/permissions tables exist.
   - Missing: staff invite acceptance, role assignment API, permission enforcement per module/action.

8. Customer account is preview only.
   - Missing: buyer registration/login, buyer order history, wishlist, addresses, returns, loyalty.

9. Observability and operations need production wiring.
   - Health endpoint exists.
   - Missing: uptime monitor, error tracker, backup policy, queue failure alerting, log retention, daily DB backup restore test.

10. Realtime is not implemented.
   - Current system works without realtime.
   - Missing: live order notifications, dashboard auto-refresh, storefront stock update push. This is useful after MVP, not required for first free trial.

## Recommended Go-Live Path

### Phase 1 - Trial MVP Lock

- Keep payments manual or owner-granted free trial.
- Use public checkout with manual bank transfer.
- Enable product CRUD, order management, customers, reports, settings, notifications, public storefront.
- Hide or label incomplete subflows: customer account, courier label creation, live payment gateway, billing automation, advanced staff roles.

### Phase 2 - Production Infrastructure

- Deploy Laravel API to Linux PHP hosting with HTTPS.
- Deploy React admin to Vercel or similar static host.
- Use Supabase Postgres and Supabase Storage.
- Use Redis for cache/queue.
- Run queue worker and notification command under Supervisor/systemd.
- Configure SMTP.
- Set `APP_DEBUG=false`, public `APP_URL`, `FRONTEND_URL`, and `CORS_ALLOWED_ORIGINS`.

### Phase 3 - Seller Function Completion

- Finish product categories/variants/inventory/media upload.
- Finish order manual create, invoice send, bulk shipment, courier tracking fields.
- Finish settings provider forms for email, WhatsApp, payment, shipping.
- Add staff invite and permission enforcement.

### Phase 4 - SaaS Billing

- Add subscription checkout.
- Add gateway webhooks.
- Add invoice/payment tables.
- Add renewal and overdue jobs.
- Auto-suspend/restore tenant access from billing state.

### Phase 5 - Website Builder Production Model

- Add builder drafts and publish snapshots.
- Store theme, sections, pages, menus, SEO, blog posts, and publish history in dedicated tables or versioned JSON records.
- Public storefront should render from the latest published snapshot, not admin draft state.

## Next Implementation Plan

Build the next work in this order:

1. Product go-live hardening: category update/delete, variant persistence, inventory bulk persistence, image upload UI to media API.
2. Order go-live hardening: manual order create, invoice notification send, bulk fulfillment persistence, tracking fields.
3. Production deployment files: Dockerfile or host scripts, queue supervisor config, scheduler config, environment validation command.
4. Billing MVP: invoice/subscription tables, package checkout placeholder, webhook receiver structure.
5. Builder publish model: publish snapshots and public storefront read from snapshot.

## Launch Decision

Bisora is not yet ready for a fully automated paid SaaS launch. It is close to a controlled free-trial MVP if trial users are limited and incomplete advanced flows are hidden or clearly disabled.

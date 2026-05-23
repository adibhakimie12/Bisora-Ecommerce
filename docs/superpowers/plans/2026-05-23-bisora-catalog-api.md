# Bisora Catalog API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tenant-scoped Laravel APIs for categories and products so Bisora can start replacing frontend seed data and `localStorage` persistence.

**Architecture:** Laravel resolves tenant context from `X-Tenant-Id`, verifies the authenticated user belongs to that tenant, then scopes catalog queries by `tenant_id`. Products and categories use normal relational tables with JSON fields only for flexible secondary data like tags and variants.

**Tech Stack:** Laravel, Sanctum, SQLite tests, Supabase/PostgreSQL-ready migrations.

---

## File Structure

- Create: `backend/app/Http/Middleware/ResolveTenant.php`
- Modify: `backend/bootstrap/app.php`
- Create: `backend/database/migrations/2026_05_23_010000_create_categories_table.php`
- Create: `backend/database/migrations/2026_05_23_010001_create_products_table.php`
- Create: `backend/app/Models/Category.php`
- Create: `backend/app/Models/Product.php`
- Create: `backend/app/Http/Controllers/Api/CategoryController.php`
- Create: `backend/app/Http/Controllers/Api/ProductController.php`
- Create: `backend/app/Http/Requests/StoreCategoryRequest.php`
- Create: `backend/app/Http/Requests/StoreProductRequest.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/CatalogApiTest.php`

## Task 1: Tenant Context Middleware

- [ ] **Step 1: Create `ResolveTenant` middleware**

Middleware reads `X-Tenant-Id`, confirms membership through `$request->user()->tenants()`, and binds the tenant to request attributes.

- [ ] **Step 2: Register route alias**

Add `'tenant' => \App\Http\Middleware\ResolveTenant::class` in Laravel middleware aliases.

- [ ] **Step 3: Test missing and invalid tenant headers**

Expected: missing header returns 400; unauthorized tenant returns 403.

## Task 2: Catalog Schema

- [ ] **Step 1: Create categories table**

Fields: `tenant_id`, `name`, `slug`, `description`, `status`, `seo_title`, `seo_description`, `cover_url`, timestamps, unique `(tenant_id, slug)`.

- [ ] **Step 2: Create products table**

Fields: `tenant_id`, `category_id`, `title`, `slug`, `sku`, `price`, `compare_at_price`, `stock`, `status`, `thumbnail_url`, `description`, `vendor`, `product_type`, `tags`, `variants`, `seo_title`, `seo_description`, timestamps, unique `(tenant_id, slug)` and `(tenant_id, sku)`.

## Task 3: API Controllers

- [ ] **Step 1: Add category endpoints**

Routes: `GET /api/categories`, `POST /api/categories`.

- [ ] **Step 2: Add product endpoints**

Routes: `GET /api/products`, `POST /api/products`, `GET /api/products/{product}`, `PATCH /api/products/{product}`, `DELETE /api/products/{product}`.

- [ ] **Step 3: Enforce tenant scoping**

Product route model binding must reject records outside the active tenant.

## Task 4: Verification

- [ ] **Step 1: Run Laravel tests**

Run: `php artisan test`

Expected: all backend tests pass.

- [ ] **Step 2: Run frontend checks**

Run lint, tests, and build for `exports/dashboard`.

Expected: all frontend checks pass.

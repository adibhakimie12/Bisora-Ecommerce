# Bisora Laravel Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Bisora for production by repairing the current frontend checks and adding a Laravel API foundation ready for Supabase Postgres, Supabase Storage, Redis queues, tenant auth, and future commerce modules.

**Architecture:** Keep `exports/dashboard` as the React admin frontend and add a new `backend/` Laravel API. Laravel owns auth, tenancy, permissions, business rules, queues, and storage authorization; Supabase provides managed PostgreSQL and S3-compatible storage.

**Tech Stack:** React 19, Vite, TypeScript, Laravel, Sanctum, PostgreSQL/Supabase, Redis, Horizon-ready queues, Supabase S3-compatible storage.

---

## File Structure

- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
  - Restore/export `resolveBuilderView` if compatible with existing tests, or update routing helper in a small isolated way.
- Create: `backend/`
  - Laravel app root.
- Create/Modify: `backend/.env.example`
  - Supabase Postgres, Redis, Sanctum, storage, queue, app URL, frontend URL.
- Create: `backend/config/bisora.php`
  - Central Bisora config for owner email, tenant mode, storage buckets, plan limits.
- Create: `backend/database/migrations/*_create_tenants_table.php`
- Create: `backend/database/migrations/*_create_stores_table.php`
- Create: `backend/database/migrations/*_create_tenant_user_table.php`
- Create: `backend/database/migrations/*_create_roles_and_permissions_tables.php`
- Create: `backend/database/migrations/*_create_audit_logs_table.php`
- Create: `backend/app/Models/Tenant.php`
- Create: `backend/app/Models/Store.php`
- Create: `backend/app/Models/AuditLog.php`
- Modify: `backend/app/Models/User.php`
- Create: `backend/app/Http/Middleware/ResolveTenant.php`
- Create: `backend/app/Http/Controllers/Api/MeController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/MeEndpointTest.php`
- Create: `backend/tests/Feature/TenantIsolationTest.php`
- Modify: root `package.json`
  - Add backend helper scripts only if useful and non-disruptive.
- Create: `docs/backend-environment.md`
  - Explain required Supabase, Redis, storage, queue, and local env values.

## Task 0: Repair Frontend Health Gate

**Files:**
- Modify: `exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx`
- Test: `exports/dashboard/src/modules/websiteBuilder/luxuryMuslimahTemplate.test.ts`

- [ ] **Step 1: Inspect failing test**

Run:

```powershell
Get-Content exports\dashboard\src\modules\websiteBuilder\luxuryMuslimahTemplate.test.ts -TotalCount 220
```

Expected: test imports `resolveBuilderView` and asserts route normalization behavior.

- [ ] **Step 2: Add compatible helper export**

Add a small helper near existing section normalization code:

```ts
export type BuilderView =
  | { section: 'overview' }
  | { section: 'installed-themes' }
  | { section: 'themes' }
  | { section: 'menus' }
  | { section: 'pages' }
  | { section: 'page-seo' }
  | { section: 'blog' }
  | { section: 'preferences' }
  | { section: 'metafields' }
  | { section: 'customize'; themeId?: string };

export function resolveBuilderView(section?: string, themeId?: string): BuilderView {
  const normalized = normalizeWebsiteBuilderSection(section);

  if (normalized === 'customize') {
    return { section: 'customize', themeId };
  }

  return { section: normalized };
}
```

If `BuilderView` already exists with different shape, preserve the local shape and only export the missing function.

- [ ] **Step 3: Run frontend lint**

Run:

```powershell
npm --prefix exports/dashboard run lint
```

Expected: TypeScript exits with code 0.

- [ ] **Step 4: Run frontend tests**

Run:

```powershell
npm --prefix exports/dashboard test
```

Expected: all tests pass.

- [ ] **Step 5: Run frontend build**

Run:

```powershell
npm --prefix exports/dashboard run build
```

Expected: Vite build exits with code 0.

- [ ] **Step 6: Commit frontend health fix**

Run:

```powershell
git add exports/dashboard/src/modules/websiteBuilder/WebsiteBuilderModule.tsx
git commit -m "fix(builder): restore builder route helper export"
```

Expected: commit includes only the route helper fix.

## Task 1: Check Backend Tooling

**Files:**
- No source files changed.

- [ ] **Step 1: Check PHP**

Run:

```powershell
php -v
```

Expected: PHP 8.2 or newer.

- [ ] **Step 2: Check Composer**

Run:

```powershell
composer --version
```

Expected: Composer available.

- [ ] **Step 3: Check Laravel installer fallback**

Run:

```powershell
composer create-project laravel/laravel --help
```

Expected: Composer can scaffold Laravel without requiring global Laravel installer.

## Task 2: Scaffold Laravel Backend

**Files:**
- Create: `backend/`

- [ ] **Step 1: Create Laravel app**

Run:

```powershell
composer create-project laravel/laravel backend
```

Expected: `backend/artisan`, `backend/composer.json`, and `backend/routes` exist.

- [ ] **Step 2: Install Sanctum**

Run:

```powershell
composer require laravel/sanctum
php artisan sanctum:install
```

Workdir: `backend`

Expected: Sanctum package installed and migrations/config published if Laravel version needs it.

- [ ] **Step 3: Install Horizon-ready queue support**

Run:

```powershell
composer require laravel/horizon
php artisan horizon:install
```

Workdir: `backend`

Expected: Horizon config exists and Redis queue support is available.

- [ ] **Step 4: Commit scaffold**

Run:

```powershell
git add backend
git commit -m "chore(backend): scaffold laravel api"
```

Expected: commit contains only generated Laravel backend files.

## Task 3: Configure Supabase And Bisora Environment

**Files:**
- Modify: `backend/.env.example`
- Create: `backend/config/bisora.php`
- Create: `docs/backend-environment.md`

- [ ] **Step 1: Update `.env.example`**

Add or set:

```dotenv
APP_NAME=Bisora
APP_ENV=local
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.YOUR_PROJECT_REF
DB_PASSWORD=

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=database

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

FILESYSTEM_DISK=supabase
SUPABASE_STORAGE_KEY=
SUPABASE_STORAGE_SECRET=
SUPABASE_STORAGE_REGION=ap-southeast-1
SUPABASE_STORAGE_BUCKET_PUBLIC=public-storefront-media
SUPABASE_STORAGE_BUCKET_PRIVATE=private-store-documents
SUPABASE_STORAGE_ENDPOINT=https://YOUR_PROJECT_REF.supabase.co/storage/v1/s3
SUPABASE_STORAGE_URL=https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public

BISORA_OWNER_EMAIL=owner@bisora.my
BISORA_DEFAULT_PLAN=premium
```

- [ ] **Step 2: Add Bisora config**

Create `backend/config/bisora.php`:

```php
<?php

return [
    'owner_email' => env('BISORA_OWNER_EMAIL', 'owner@bisora.my'),
    'default_plan' => env('BISORA_DEFAULT_PLAN', 'premium'),
    'storage' => [
        'public_bucket' => env('SUPABASE_STORAGE_BUCKET_PUBLIC', 'public-storefront-media'),
        'private_bucket' => env('SUPABASE_STORAGE_BUCKET_PRIVATE', 'private-store-documents'),
        'max_upload_mb' => (int) env('BISORA_MAX_UPLOAD_MB', 20),
    ],
    'plans' => [
        'basic' => ['products' => 30, 'storage_mb' => 500, 'pages' => 50],
        'standard' => ['products' => 200, 'storage_mb' => 2000, 'pages' => 250],
        'premium' => ['products' => 1000, 'storage_mb' => 10000, 'pages' => 999],
    ],
];
```

- [ ] **Step 3: Document environment**

Create `docs/backend-environment.md` with:

```md
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

Never expose service role keys or storage secret keys in the React frontend.
```

- [ ] **Step 4: Commit environment docs**

Run:

```powershell
git add backend/.env.example backend/config/bisora.php docs/backend-environment.md
git commit -m "chore(backend): document supabase environment"
```

## Task 4: Add Tenancy Foundation

**Files:**
- Create: `backend/database/migrations/*_create_tenants_table.php`
- Create: `backend/database/migrations/*_create_stores_table.php`
- Create: `backend/database/migrations/*_create_tenant_user_table.php`
- Create: `backend/database/migrations/*_create_roles_and_permissions_tables.php`
- Create: `backend/database/migrations/*_create_audit_logs_table.php`
- Create: `backend/app/Models/Tenant.php`
- Create: `backend/app/Models/Store.php`
- Create: `backend/app/Models/AuditLog.php`
- Modify: `backend/app/Models/User.php`

- [ ] **Step 1: Create migrations**

Run:

```powershell
php artisan make:model Tenant -m
php artisan make:model Store -m
php artisan make:model AuditLog -m
php artisan make:migration create_tenant_user_table
php artisan make:migration create_roles_and_permissions_tables
```

Workdir: `backend`

Expected: migration and model files are created.

- [ ] **Step 2: Implement tenant migration**

Use this schema:

```php
Schema::create('tenants', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('plan')->default(config('bisora.default_plan'));
    $table->string('billing_status')->default('trial');
    $table->string('access_status')->default('active');
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamps();
});
```

- [ ] **Step 3: Implement stores migration**

Use this schema:

```php
Schema::create('stores', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->string('managed_domain')->nullable();
    $table->string('custom_domain')->nullable();
    $table->string('currency', 3)->default('MYR');
    $table->string('timezone')->default('Asia/Kuala_Lumpur');
    $table->json('settings')->nullable();
    $table->timestamps();
    $table->unique(['tenant_id', 'slug']);
    $table->index(['tenant_id', 'custom_domain']);
});
```

- [ ] **Step 4: Implement tenant user migration**

Use this schema:

```php
Schema::create('tenant_user', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('role')->default('owner');
    $table->timestamps();
    $table->unique(['tenant_id', 'user_id']);
    $table->index(['user_id', 'role']);
});
```

- [ ] **Step 5: Implement role and permission migration**

Use this schema:

```php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('scope')->default('tenant');
    $table->timestamps();
    $table->unique(['tenant_id', 'name']);
});

Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->timestamps();
});

Schema::create('permission_role', function (Blueprint $table) {
    $table->id();
    $table->foreignId('role_id')->constrained()->cascadeOnDelete();
    $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->unique(['role_id', 'permission_id']);
});
```

- [ ] **Step 6: Implement audit logs migration**

Use this schema:

```php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action');
    $table->string('subject_type')->nullable();
    $table->unsignedBigInteger('subject_id')->nullable();
    $table->json('metadata')->nullable();
    $table->ipAddress('ip_address')->nullable();
    $table->timestamps();
    $table->index(['tenant_id', 'action']);
    $table->index(['subject_type', 'subject_id']);
});
```

- [ ] **Step 7: Implement model relationships**

`Tenant`:

```php
class Tenant extends Model
{
    protected $fillable = ['name', 'slug', 'plan', 'billing_status', 'access_status', 'trial_ends_at'];

    protected function casts(): array
    {
        return ['trial_ends_at' => 'datetime'];
    }

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }
}
```

`Store`:

```php
class Store extends Model
{
    protected $fillable = ['tenant_id', 'name', 'slug', 'managed_domain', 'custom_domain', 'currency', 'timezone', 'settings'];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
```

`User` additions:

```php
public function tenants(): BelongsToMany
{
    return $this->belongsToMany(Tenant::class)->withPivot('role')->withTimestamps();
}

public function isPlatformOwner(): bool
{
    return strcasecmp($this->email, config('bisora.owner_email')) === 0;
}
```

- [ ] **Step 8: Commit tenancy foundation**

Run:

```powershell
git add backend/app backend/database/migrations
git commit -m "feat(backend): add tenant foundation"
```

## Task 5: Add `/api/me`

**Files:**
- Create: `backend/app/Http/Controllers/Api/MeController.php`
- Modify: `backend/routes/api.php`
- Create: `backend/tests/Feature/MeEndpointTest.php`

- [ ] **Step 1: Create controller**

Run:

```powershell
php artisan make:controller Api/MeController
```

Workdir: `backend`

- [ ] **Step 2: Implement controller**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_owner' => $user->isPlatformOwner(),
            ],
            'tenants' => $user->tenants()
                ->select('tenants.id', 'tenants.name', 'tenants.slug', 'tenants.plan', 'tenants.access_status')
                ->get(),
        ]);
    }
}
```

- [ ] **Step 3: Add route**

```php
use App\Http\Controllers\Api\MeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', MeController::class);
});
```

- [ ] **Step 4: Write feature test**

```php
use App\Models\Tenant;
use App\Models\User;

it('returns the authenticated user and tenant list', function () {
    $user = User::factory()->create(['email' => 'owner@bisora.my']);
    $tenant = Tenant::create([
        'name' => 'Demo Store',
        'slug' => 'demo-store',
        'plan' => 'premium',
        'billing_status' => 'trial',
        'access_status' => 'active',
    ]);
    $tenant->users()->attach($user, ['role' => 'owner']);

    $this->actingAs($user)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.email', 'owner@bisora.my')
        ->assertJsonPath('user.is_platform_owner', true)
        ->assertJsonPath('tenants.0.slug', 'demo-store');
});
```

- [ ] **Step 5: Run backend tests**

Run:

```powershell
php artisan test
```

Workdir: `backend`

Expected: all backend tests pass.

- [ ] **Step 6: Commit `/api/me`**

Run:

```powershell
git add backend/app/Http/Controllers/Api/MeController.php backend/routes/api.php backend/tests/Feature/MeEndpointTest.php
git commit -m "feat(backend): add authenticated me endpoint"
```

## Task 6: Final Verification

**Files:**
- No source files changed unless previous tasks reveal fixes.

- [ ] **Step 1: Run frontend lint**

Run:

```powershell
npm --prefix exports/dashboard run lint
```

Expected: exit 0.

- [ ] **Step 2: Run frontend tests**

Run:

```powershell
npm --prefix exports/dashboard test
```

Expected: exit 0.

- [ ] **Step 3: Run frontend build**

Run:

```powershell
npm --prefix exports/dashboard run build
```

Expected: exit 0.

- [ ] **Step 4: Run backend tests**

Run:

```powershell
php artisan test
```

Workdir: `backend`

Expected: exit 0.

- [ ] **Step 5: Report status**

Report:

- commit hashes created
- commands run and whether they passed
- any missing local services such as Redis or Supabase credentials
- next implementation slice: Catalog API

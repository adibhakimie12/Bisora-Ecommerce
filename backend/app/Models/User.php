<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class)->withPivot('role')->withTimestamps();
    }

    public function isPlatformOwner(): bool
    {
        return strcasecmp($this->email, (string) config('bisora.owner_email')) === 0;
    }

    public function sessionTenants(): Collection
    {
        if ($this->isPlatformOwner()) {
            return Tenant::query()
                ->select('id', 'name', 'slug', 'plan', 'billing_status', 'access_status')
                ->orderBy('name')
                ->get()
                ->map(fn (Tenant $tenant): array => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'plan' => $tenant->plan,
                    'billing_status' => $tenant->billing_status,
                    'access_status' => $tenant->access_status,
                    'role' => 'platform_owner',
                ]);
        }

        return $this->tenants()
            ->select('tenants.id', 'tenants.name', 'tenants.slug', 'tenants.plan', 'tenants.billing_status', 'tenants.access_status')
            ->orderBy('tenants.name')
            ->get()
            ->map(fn (Tenant $tenant): array => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'plan' => $tenant->plan,
                'billing_status' => $tenant->billing_status,
                'access_status' => $tenant->access_status,
                'role' => $tenant->pivot->role,
            ]);
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('owner_name')->nullable()->after('slug');
            $table->string('owner_email')->nullable()->after('owner_name');
            $table->unsignedInteger('monthly_fee')->default(0)->after('access_status');
            $table->unsignedSmallInteger('days_overdue')->default(0)->after('monthly_fee');
            $table->boolean('free_access')->default(false)->after('days_overdue');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'owner_name',
                'owner_email',
                'monthly_fee',
                'days_overdue',
                'free_access',
            ]);
        });
    }
};

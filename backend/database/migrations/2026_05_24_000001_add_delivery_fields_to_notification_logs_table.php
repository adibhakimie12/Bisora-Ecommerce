<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_logs', function (Blueprint $table): void {
            if (!Schema::hasColumn('notification_logs', 'attempts')) {
                $table->unsignedSmallInteger('attempts')->default(0)->after('status');
            }

            if (!Schema::hasColumn('notification_logs', 'last_error')) {
                $table->text('last_error')->nullable()->after('attempts');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notification_logs', function (Blueprint $table): void {
            if (Schema::hasColumn('notification_logs', 'last_error')) {
                $table->dropColumn('last_error');
            }

            if (Schema::hasColumn('notification_logs', 'attempts')) {
                $table->dropColumn('attempts');
            }
        });
    }
};

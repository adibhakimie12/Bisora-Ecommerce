<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table): void {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};

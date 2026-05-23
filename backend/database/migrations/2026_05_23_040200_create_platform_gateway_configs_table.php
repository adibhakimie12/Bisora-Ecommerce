<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_gateway_configs', function (Blueprint $table): void {
            $table->id();
            $table->string('provider')->unique();
            $table->string('mode')->default('Test');
            $table->boolean('enabled')->default(false);
            $table->string('merchant_id')->nullable();
            $table->text('api_key')->nullable();
            $table->text('secret_key')->nullable();
            $table->string('webhook_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_gateway_configs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('avatar_url')->nullable();
            $table->string('status')->default('new');
            $table->unsignedInteger('orders_count')->default(0);
            $table->unsignedInteger('total_spent')->default(0);
            $table->date('last_order_at')->nullable();
            $table->date('member_since')->nullable();
            $table->json('shipping_address')->nullable();
            $table->json('notes')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};

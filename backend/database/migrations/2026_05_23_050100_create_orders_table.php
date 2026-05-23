<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number');
            $table->unsignedInteger('total')->default(0);
            $table->string('payment_status')->default('pending');
            $table->string('settlement_status')->nullable();
            $table->string('fulfillment_status')->default('unfulfilled');
            $table->date('ordered_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->json('items')->nullable();
            $table->json('shipping_address')->nullable();
            $table->json('shipment')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

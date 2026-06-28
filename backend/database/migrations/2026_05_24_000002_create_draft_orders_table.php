<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draft_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('number');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('source')->nullable();
            $table->json('items')->nullable();
            $table->unsignedInteger('total')->default(0);
            $table->string('status')->default('draft');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'number']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draft_orders');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event');
            $table->string('channel');
            $table->string('recipient');
            $table->string('subject')->nullable();
            $table->text('message');
            $table->string('status')->default('queued');
            $table->json('payload')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'event', 'status']);
            $table->index(['order_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};

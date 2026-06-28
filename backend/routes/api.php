<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DraftOrderController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MarketingController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationLogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PlatformGatewayController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\PublicStorefrontController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SubscriptionPackageController;
use App\Http\Controllers\Api\SuperadminController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/trial', [AuthController::class, 'trial']);
Route::get('/health', HealthController::class);
Route::get('/storefront/{store}', [PublicStorefrontController::class, 'show']);
Route::post('/storefront/{store}/checkout', [PublicStorefrontController::class, 'checkout']);
Route::get('/storefront/{store}/orders/{number}', [PublicStorefrontController::class, 'order']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', MeController::class);

    Route::middleware('platform-owner')->prefix('superadmin')->group(function (): void {
        Route::get('/overview', [SuperadminController::class, 'overview']);
        Route::get('/tenants', [SuperadminController::class, 'tenants']);
        Route::patch('/tenants/{tenant}/access', [SuperadminController::class, 'updateTenantAccess']);
        Route::post('/tenants/{tenant}/free-access', [SuperadminController::class, 'grantFreeAccess']);
        Route::apiResource('packages', SubscriptionPackageController::class)->except(['show', 'destroy']);
        Route::get('/gateways', [PlatformGatewayController::class, 'index']);
        Route::patch('/gateways/{provider}', [PlatformGatewayController::class, 'update']);
    });

    Route::middleware('tenant')->group(function (): void {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::patch('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        Route::post('/media/presign', [MediaController::class, 'presign']);
        Route::post('/media/complete', [MediaController::class, 'complete']);
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/reports/overview', [AnalyticsController::class, 'reportsOverview']);
        Route::get('/settings/store', [SettingsController::class, 'show']);
        Route::patch('/settings/store', [SettingsController::class, 'update']);
        Route::post('/settings/store/publish', [SettingsController::class, 'publish']);
        Route::post('/settings/store/unpublish', [SettingsController::class, 'unpublish']);
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::patch('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::post('/customers/{customer}/notes', [CustomerController::class, 'addNote']);
        Route::post('/customers/{customer}/contact', [CustomerController::class, 'contact']);
        Route::post('/customers/{customer}/deactivate', [CustomerController::class, 'deactivate']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
        Route::post('/draft-orders/{draftOrder}/convert', [DraftOrderController::class, 'convert']);
        Route::post('/draft-orders/{draftOrder}/send-invoice', [DraftOrderController::class, 'sendInvoice']);
        Route::apiResource('draft-orders', DraftOrderController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/notifications/logs', [NotificationLogController::class, 'index']);
        Route::post('/notifications/process', [NotificationLogController::class, 'process']);
        Route::post('/notifications/test-send', [NotificationLogController::class, 'testSend']);
        Route::post('/notifications/logs/{log}/retry', [NotificationLogController::class, 'retry']);
        Route::patch('/notifications/logs/{log}', [NotificationLogController::class, 'update']);
        Route::get('/reviews', [ProductReviewController::class, 'index']);
        Route::get('/reviews/export', [ProductReviewController::class, 'export']);
        Route::patch('/reviews/{review}', [ProductReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ProductReviewController::class, 'destroy']);
        Route::get('/marketing', [MarketingController::class, 'show']);
        Route::post('/marketing/broadcasts/{broadcastId}/queue', [MarketingController::class, 'queueBroadcast']);
        Route::post('/marketing/recovery/{checkoutId}/remind', [MarketingController::class, 'remindRecovery']);
        Route::patch('/marketing/{collection}', [MarketingController::class, 'updateCollection']);
        Route::apiResource('products', ProductController::class);
    });
});

Route::put('/media/local-upload-placeholder/{mediaAsset}', [MediaController::class, 'localUploadPlaceholder'])
    ->name('media.local-upload-placeholder');

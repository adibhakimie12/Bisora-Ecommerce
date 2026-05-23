<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PlatformGatewayController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\SubscriptionPackageController;
use App\Http\Controllers\Api\SuperadminController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

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
        Route::post('/media/presign', [MediaController::class, 'presign']);
        Route::post('/media/complete', [MediaController::class, 'complete']);
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::get('/reviews', [ProductReviewController::class, 'index']);
        Route::patch('/reviews/{review}', [ProductReviewController::class, 'update']);
        Route::apiResource('products', ProductController::class);
    });
});

Route::put('/media/local-upload-placeholder/{mediaAsset}', [MediaController::class, 'localUploadPlaceholder'])
    ->name('media.local-upload-placeholder');

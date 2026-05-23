<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', MeController::class);

    Route::middleware('tenant')->group(function (): void {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/media/presign', [MediaController::class, 'presign']);
        Route::post('/media/complete', [MediaController::class, 'complete']);
        Route::apiResource('products', ProductController::class);
    });
});

Route::put('/media/local-upload-placeholder/{mediaAsset}', [MediaController::class, 'localUploadPlaceholder'])
    ->name('media.local-upload-placeholder');

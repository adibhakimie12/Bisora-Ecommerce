<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', MeController::class);

    Route::middleware('tenant')->group(function (): void {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::apiResource('products', ProductController::class);
    });
});

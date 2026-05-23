<?php

use App\Http\Controllers\Api\MeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', MeController::class);
});

<?php

use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'index']);

// JSON API untuk frontend. Memakai sesi + token CSRF (header X-CSRF-TOKEN).
Route::prefix('api')->group(function () {
    Route::get('bootstrap', [ApiController::class, 'bootstrap']);

    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('auth/staff', [AuthController::class, 'staff'])->middleware('throttle:10,1');
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Pelanggan
    Route::post('wishlist/{produk}', [ApiController::class, 'wishlist']);
    Route::post('janji', [ApiController::class, 'janjiBuat']);
    Route::post('janji/{janji}/status', [ApiController::class, 'janjiStatus']);
    Route::post('trade-in', [ApiController::class, 'tradeBuat']);

    // Staff / owner
    Route::prefix('staff')->group(function () {
        Route::post('produk', [StaffController::class, 'produkBuat']);
        Route::patch('produk/{produk}', [StaffController::class, 'produkUbah']);
        Route::delete('produk/{produk}', [StaffController::class, 'produkHapus']);
        Route::put('parameter', [StaffController::class, 'parameter']);
        Route::post('trade-in/{trade}/proses', [StaffController::class, 'tradeProses']);
        Route::post('trade-in/{trade}/selesai', [StaffController::class, 'tradeSelesai']);
        Route::post('transaksi', [StaffController::class, 'transaksiBuat']);
    });
});

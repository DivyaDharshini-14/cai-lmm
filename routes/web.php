<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadOptionController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->middleware('throttle:10,1');
});

Route::middleware(['auth', 'cache.headers:private;no_store'])->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');
    Route::get('/', [DashboardController::class, 'create'])->name('leads.create');
    Route::get('/leads', [DashboardController::class, 'index'])->name('leads.index');
    Route::get('/leads/{lead}/edit', [DashboardController::class, 'edit'])->name('leads.edit');

    // These same-origin JSON routes use the web session and CSRF middleware.
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/lead-options', LeadOptionController::class)->name('lead-options');
        Route::apiResource('leads', LeadController::class)->except('update');
        Route::put('/leads/{lead}', [LeadController::class, 'update'])->name('leads.update');
    });
});

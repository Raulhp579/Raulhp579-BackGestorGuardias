<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DutyController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\ImportExcelsController;

// ✅ Preflight CORS para /api/*
Route::options('/{any}', function (Request $request) {
    $origin = $request->header('Origin');
    $allowed = ['https://proyecto4.arenadaw.com.es', 'http://localhost:5173'];

    return response('', 204)
        ->header('Access-Control-Allow-Origin', in_array($origin, $allowed) ? $origin : $allowed[0])
        ->header('Vary', 'Origin')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
        ->header('Access-Control-Max-Age', '86400');
})->where('any', '.*');

Route::get('/userInfo', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, "register"]);
Route::post('/login', [AuthController::class, "login"]);
Route::get('/logout', [AuthController::class, "logout"])->middleware('auth:sanctum');

Route::post('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDuties', [ImportExcelsController::class, "importDuties"])->name('import.duties');

Route::apiResource('/speciality', SpecialityController::class);
Route::get('/assingChiefs', [DutyController::class, "assignChief"]);

// Duties
Route::get('/duties', [DutyController::class, 'index']);
Route::post('/duties', [DutyController::class, 'store']);
Route::get('/duties/{id}', [DutyController::class, 'show']);
Route::put('/duties/{id}', [DutyController::class, 'update']);
Route::delete('/duties/{id}', [DutyController::class, 'destroy']);
Route::get('/duties/day/{date}', [DutyController::class, 'day']);

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\ImportExcelsController;

Route::get('/userInfo', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, "register"]);
Route::post("/login",[AuthController::class,"login"]);
Route::get("/logout",[AuthController::class, "logout"])->middleware('auth:sanctum');

Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDutys',[ImportExcelsController::class, "importDutys"])->name('import.dutys');

Route::apiResource("/speciality",SpecialityController::class);
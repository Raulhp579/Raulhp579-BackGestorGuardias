<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DutyController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\ImportExcelsController;

Route::get('/userInfo', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, "register"]);
Route::post("/login",[AuthController::class,"login"]);
Route::get("/logout",[AuthController::class, "logout"])->middleware('auth:sanctum');

Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDuties',[ImportExcelsController::class, "importDuties"])->name('import.duties');

Route::apiResource("/speciality",SpecialityController::class);



 
//---------------------Duties routes-----------------------------


// List all duties
Route::get('/duties', [DutyController::class, 'index']);

// Create a new duty
Route::post('/duties', [DutyController::class, 'store']);

// Show one duty by id
Route::get('/duties/{id}', [DutyController::class, 'show']);

// Update a duty by id
Route::put('/duties/{id}', [DutyController::class, 'update']);

// Delete a duty by id
Route::delete('/duties/{id}', [DutyController::class, 'destroy']);

// Daily view
Route::get('/duties/day/{date}', [DutyController::class, 'day']);
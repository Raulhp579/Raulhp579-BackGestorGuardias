<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ImportExcelsController;
use App\Http\Controllers\SpecialityController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');




Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDutys',[ImportExcelsController::class, "importDutys"])->name('import.dutys');

Route::apiResource("/speciality",SpecialityController::class);
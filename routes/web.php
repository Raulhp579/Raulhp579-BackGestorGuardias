<?php

use App\Http\Controllers\ImportExcelsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDutys',[ImportExcelsController::class, "importDutys"])->name('import.dutys');
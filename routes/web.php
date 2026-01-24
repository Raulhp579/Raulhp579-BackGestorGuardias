<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/app', fn() => redirect('/app/'));

Route::get('/app/{any?}', function () {
    return File::get(public_path('app/index.html'));
})->where('any', '.*');

Route::get('/', fn() => redirect('/app/'));



/* Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDutys',[ImportExcelsController::class, "importDutys"])->name('import.dutys'); */
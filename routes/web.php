<?php

use App\Http\Controllers\PdfController;
use App\Models\Duty;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/app', fn() => redirect('/app/'));

Route::get('/app/{any?}', function () {
    return File::get(public_path('app/index.html'));
})->where('any', '.*');

Route::get('/', fn() => redirect('/app/'));

// Ruta para ver la plantilla del PDF de guardias
Route::get('/plantilla-dia-pdf', [PdfController::class,'generarPdfDia']);

// Catch-all para rutas del frontend SPA (login, dashboard, etc.)
Route::get('/{any}', function () {
    return File::get(public_path('app/index.html'));
})->where('any', '^(?!api).*$');



/* Route::get('/importUsers', [ImportExcelsController::class, "importWorkers"])->name('import.users');
Route::post('/importDutys',[ImportExcelsController::class, "importDutys"])->name('import.dutys'); */
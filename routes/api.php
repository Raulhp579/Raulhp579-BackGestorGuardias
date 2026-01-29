<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DutyController;
use App\Http\Controllers\ImportExcelsController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkerController;
use App\Http\Middleware\isAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfController;

// Preflight CORS para /api/*
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

/* Route::post('/register', [AuthController::class, "register"]); */

Route::get('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ---------------------User routes-----------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'update']);
    Route::post('/change-password', [UserController::class, 'changePassword']);
    Route::delete('/profile', [UserController::class, 'destroy']);
});

// Admin routes (requiere autenticación y rol de admin)
Route::middleware(['auth:sanctum', isAdmin::class])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    //para javi en el frontend esta es la ruta del boton de editar
    Route::put('/users/{id}', [UserController::class, 'edit']);
    Route::post('/importUsers', [ImportExcelsController::class, 'importWorkers'])->name('import.users');
    Route::post('/importDuties', [ImportExcelsController::class, 'importDuties'])->name('import.duties');
    Route::apiResource('/speciality', SpecialityController::class);
    // CRUD Routes for workers
    Route::apiResource('/workers', WorkerController::class);

    // Additional filter routes for workers
    Route::get('/workers/active/list', [WorkerController::class, 'getActive']);
    Route::get('/workers/speciality/{idSpeciality}', [WorkerController::class, 'getBySpeciality']);

    Route::post('/duties', [DutyController::class, 'store']);
    Route::put('/duties/{id}', [DutyController::class, 'update']);
    Route::delete('/duties/{id}', [DutyController::class, 'destroy']);

    Route::get('/assingChiefs', [DutyController::class, 'assignChief']);

    Route::get('/plantilla-dia-pdf', [PdfController::class,'generarPdfDia']); 
});

// ---------------------Duties routes-----------------------------

// List all duties
Route::get('/duties', [DutyController::class, 'index']);
Route::get('/duties/{id}', [DutyController::class, 'show']);
Route::get('/duties/day/{date}', [DutyController::class, 'day']);
Route::post('/login', [AuthController::class, 'login']);

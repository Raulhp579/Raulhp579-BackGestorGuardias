<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DutyController;
use App\Http\Controllers\DutyMetaController;
use App\Http\Controllers\FichajeController;
use App\Http\Controllers\GoogleCalendarController;
use App\Http\Controllers\ImportExcelsController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\SpecialityController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkerController;
use App\Http\Middleware\isAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

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
    Route::post('/profile', [UserController::class, 'update']); // POST para FormData con archivos importante
    Route::post('/change-password', [UserController::class, 'changePassword']);
    Route::delete('/profile', [UserController::class, 'destroy']);
    // este hay que crear por tipos y los get deberian verse para los autenticados lo demas va para admin
    Route::apiResource('/speciality', SpecialityController::class);
});

Route::middleware('auth:sanctum')->get('/workers/{id}/duties', [WorkerController::class, 'getDuties']);
Route::middleware('auth:sanctum')->get('/workers/speciality/{idSpeciality}', [WorkerController::class, 'getBySpeciality']);

// Admin routes (requiere autenticación y rol de admin)
Route::middleware(['auth:sanctum', isAdmin::class])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'edit']);
    Route::delete('/users/{id}', [UserController::class, 'destroyAdmin']);
    Route::post('/importUsers', [ImportExcelsController::class, 'importWorkers'])->name('import.users');
    Route::post('/importDuties', [ImportExcelsController::class, 'importDuties'])->name('import.duties');

    // CRUD Routes for workers
    Route::apiResource('/workers', WorkerController::class);

    // Additional filter routes for workers
    Route::get('/workers/active/list', [WorkerController::class, 'getActive']);

    Route::post('/duties', [DutyController::class, 'store']);
    Route::put('/duties/{id}', [DutyController::class, 'update']);
    Route::delete('/duties/{id}', [DutyController::class, 'destroy']);

    Route::get('/assingChiefs', [DutyController::class, 'assignChief']);

    Route::get('/plantilla-dia-pdf', [PdfController::class, 'generarPdfDia']);

    Route::prefix('admin')->group(function () {
        Route::apiResource('/fichajes', FichajeController::class);
    });
});

// ---------------------Duties routes-----------------------------
Route::get('/duties/last-update', [DutyMetaController::class, 'lastUpdate']);
// List all duties
Route::get('/duties', [DutyController::class, 'index']);
// Paginated duties per worker (Authenticated users)
Route::middleware('auth:sanctum')->get('/duties/worker/{id}', [DutyController::class, 'getWorkerDutiesPaginated']);

Route::get('/duties/{id}', [DutyController::class, 'show']);
Route::get('/duties/{id}', [DutyController::class, 'show']);
    Route::get('/duties/day/{date}', [DutyController::class, 'day']);

    // ---------------------Duty Swaps routes-----------------------------
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/duty-swaps', [App\Http\Controllers\DutySwapController::class, 'index']);
        Route::post('/duty-swaps', [App\Http\Controllers\DutySwapController::class, 'store']);
        Route::put('/duty-swaps/{dutySwap}/accept', [App\Http\Controllers\DutySwapController::class, 'accept']);
        Route::put('/duty-swaps/{dutySwap}/reject', [App\Http\Controllers\DutySwapController::class, 'reject']);
        Route::put('/duty-swaps/{dutySwap}/approve', [App\Http\Controllers\DutySwapController::class, 'approve']);
        Route::put('/duty-swaps/{dutySwap}/decline', [App\Http\Controllers\DutySwapController::class, 'decline']);

        Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    });

    // Broadcasting auth con Sanctum para el SPA React
Route::middleware('auth:sanctum')->post('/broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
});

Route::post('/login', [AuthController::class, 'login']);
Route::get('/login', function () {
    return response()->json(['error' => 'Unauthenticated.'], 401);
})->name('login');

// ////////////RUTAS DE GOOGLE NO SE DONDE PONERLO ///////////////////////

Route::get('/google/redirect', [GoogleCalendarController::class, 'redirectToGoogle']);
Route::get('/google/callback', [GoogleCalendarController::class, 'handleGoogleCallback']);

//ruta de usuario de fichajes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/fichajes', [FichajeController::class, 'fichar']);
    Route::get('/fichajes/mis-ultimos-tres', [FichajeController::class, 'misUltimosTresFicahjes']);
});
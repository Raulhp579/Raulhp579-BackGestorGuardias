<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Http\Request;
class GoogleCalendarController extends Controller
{
    private function getGoogleClient()
    {
        $client = new Client();
        $client->setAuthConfig(storage_path('app/google/client_secret_1084350902397-a38r7fa52dd47gckha50ltv8a7hgdd94.apps.googleusercontent.com.json'));
        $client->addScope(Calendar::CALENDAR_EVENTS);   
        
        // Usar la URL de la aplicación si está definida, sino la hardcoded
        $baseUrl = rtrim(config('app.url'), '/');
        // Si el host es 'daw11.arenadaw.com.es', usamos la ruta específica del usuario
        if (str_contains($baseUrl, 'backgestorguardias.test') || str_contains($baseUrl, 'localhost')) {
            $client->setRedirectUri($baseUrl . '/api/google/callback');
        } else {
            $client->setRedirectUri('https://daw11.arenadaw.com.es/api/google/callback');
        }

        $client->setAccessType('offline');
        $client->setPrompt('consent');
        return $client;
    }

    // Redirección a la pantalla de Google
    // El frontend debe llamar a: /api/google/redirect?duty_id=X
    // Redirección a la pantalla de Google
    // El frontend debe llamar a: /api/google/redirect?duty_id=X
    // O para todas las guardias: /api/google/redirect?duty_id=all&worker_id=Y
    public function redirectToGoogle(Request $request)
    {
        $dutyId = $request->query('duty_id');
        $workerId = $request->query('worker_id');

        if (!$dutyId) {
            return response()->json(['error' => 'duty_id es requerido'], 400);
        }

        if ($dutyId !== 'all') {
            $duty = Duty::find($dutyId);
            if (!$duty) {
                return response()->json(['error' => 'El turno no existe'], 404);
            }
            $state = $dutyId;
        } else {
            if (!$workerId) {
                return response()->json(['error' => 'worker_id es requerido para exportación masiva'], 400);
            }
            // Formato all:{worker_id}
            $state = "all:{$workerId}";
        }

        $client = $this->getGoogleClient();

        if ($client instanceof \Illuminate\Http\JsonResponse) {
            return $client; 
        }
        // Pasamos la info en el state de OAuth
        $client->setState($state);
        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    public function handleGoogleCallback(Request $request)
    {
        if (!$request->has('code')) {
            return response()->json(['error' => 'No se recibió el código de autorización'], 400);
        }

        $state = $request->query('state');
        if (!$state) {
            return response()->json(['error' => 'No se recibió el ID del turno o estado'], 400);
        }

        $client = $this->getGoogleClient();
        $token = $client->fetchAccessTokenWithAuthCode($request->code);

        // URL de redirección final
        $frontendUrl = 'https://daw11.arenadaw.com.es';
        if (str_contains(config('app.url'), 'backgestorguardias.test') || str_contains(config('app.url'), 'localhost')) {
            $frontendUrl = 'http://localhost:5173'; // Asumiendo Vite local
        }

        if (isset($token['error'])) {
            return redirect($frontendUrl . '/?status=error&message=' . urlencode($token['error']));
        }

        $client->setAccessToken($token);
        $service = new Calendar($client);

        if (str_starts_with($state, 'all:')) {
            // Exportación masiva
            $workerId = str_replace('all:', '', $state);
            // Exportamos desde hoy en adelante
            $duties = Duty::with(['worker', 'speciality', 'chief'])
                ->where('id_worker', $workerId)
                ->where('date', '>=', now()->toDateString())
                ->get();

            foreach ($duties as $duty) {
                $this->insertEvent($service, $duty);
            }
        } else {
            // Exportación individual
            $duty = Duty::with(['worker', 'speciality', 'chief'])->find($state);
            if (!$duty) {
                return response()->json(['error' => 'El turno no existe'], 404);
            }
            $this->insertEvent($service, $duty);
        }

        return redirect($frontendUrl . '/mis-guardias?status=success');
    }

    private function insertEvent($service, $duty)
    {
        $workerName = $duty->worker?->name ?? 'Trabajador';
        $specialityName = $duty->speciality?->name ?? 'Especialidad';
        $dutyType = $duty->duty_type instanceof \App\Enums\DutyType
            ? $duty->duty_type->value
            : $duty->duty_type;
        $chiefName = $duty->chief?->name ?? null;

        $description = "Tipo de guardia: {$dutyType}\nEspecialidad: {$specialityName}";
        if ($chiefName) {
            $description .= "\nJefe de guardia: {$chiefName}";
        }

        $event = new Event([
            'summary' => "Guardia - {$workerName} ({$dutyType})",
            'description' => $description,
            'start' => [
                'date' => $duty->date,
                'timeZone' => 'Europe/Madrid',
            ],
            'end' => [
                'date' => $duty->date,
                'timeZone' => 'Europe/Madrid',
            ],
        ]);

        $service->events->insert('primary', $event);
    }
}

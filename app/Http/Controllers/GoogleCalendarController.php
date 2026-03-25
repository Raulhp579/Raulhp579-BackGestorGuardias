<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Illuminate\Http\Request;

class GoogleCalendarController extends Controller
{
    private function getGoogleClient()
    {
        $client = new Client();
        $client->setAuthConfig(storage_path('app/google/client_secret_1084350902397-a38r7fa52dd47gckha50ltv8a7hgdd94.apps.googleusercontent.com.json'));
        $client->addScope(Calendar::CALENDAR_EVENTS);
        $client->setRedirectUri('https://daw11.arenadaw.com.es/api/google/callback');
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        return $client;
    }

    private function getFrontendUrl()
    {
        return 'https://daw11.arenadaw.com.es';
    }

    // El frontend debe llamar a: /api/google/redirect?duty_id=all&worker_id=Y
    // O para una guardia individual: /api/google/redirect?duty_id=X
    public function redirectToGoogle(Request $request)
    {
        try {
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
                $state = "all-{$workerId}"; // usamos guión en vez de dos puntos para evitar problemas de URL
            }

            $client = $this->getGoogleClient();
            $client->setState($state);
            $authUrl = $client->createAuthUrl();

            return redirect()->away($authUrl);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function handleGoogleCallback(Request $request)
    {
        $frontendUrl = $this->getFrontendUrl();

        try {
            if (!$request->has('code')) {
                return redirect($frontendUrl . '/mis-guardias?status=error&message=' . urlencode('No se recibió el código de autorización'));
            }

            $state = $request->query('state');
            if (!$state) {
                return redirect($frontendUrl . '/mis-guardias?status=error&message=' . urlencode('Estado inválido'));
            }

            $client = $this->getGoogleClient();
            $token = $client->fetchAccessTokenWithAuthCode($request->code);

            if (isset($token['error'])) {
                return redirect($frontendUrl . '/mis-guardias?status=error&message=' . urlencode($token['error_description'] ?? $token['error']));
            }

            $client->setAccessToken($token);
            $service = new Calendar($client);

            if (str_starts_with($state, 'all-')) {
                // Exportación masiva: state = "all-{workerId}"
                $workerId = substr($state, 4);
                $duties = Duty::with(['worker', 'speciality', 'chief'])
                    ->where('id_worker', $workerId)
                    ->get();

                foreach ($duties as $duty) {
                    $this->insertEvent($service, $duty);
                }
            } else {
                // Exportación individual
                $duty = Duty::with(['worker', 'speciality', 'chief'])->find($state);
                if (!$duty) {
                    return redirect($frontendUrl . '/mis-guardias?status=error&message=' . urlencode('El turno no existe'));
                }
                $this->insertEvent($service, $duty);
            }

            return redirect($frontendUrl . '/mis-guardias?status=success');

        } catch (\Exception $e) {
            return redirect($frontendUrl . '/mis-guardias?status=error&message=' . urlencode($e->getMessage()));
        }
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

        // Evento de día completo: solo 'date', sin 'timeZone'
        $event = new Event([
            'summary'     => "Guardia - {$workerName} ({$dutyType})",
            'description' => $description,
            'start'       => ['date' => $duty->date],
            'end'         => ['date' => $duty->date],
        ]);

        $service->events->insert('primary', $event);
    }
}

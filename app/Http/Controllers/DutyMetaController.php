<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DutyMetaController extends Controller
{
    public function lastUpdate(Request $request)
    {
        // opcional: rango, para que sea "pro" y coincida con el mes visible
        $start = $request->query('start'); // YYYY-MM-DD
        $end = $request->query('end');   // YYYY-MM-DD
        $name = $request->query('name');  // búsqueda por nombre

        $q = Duty::query();

        // Filtrado por rango visible (lo más pro)
        if ($start) {
            $q->whereDate('date', '>=', $start);
        }
        if ($end) {
            $q->whereDate('date', '<', $end);
        }

        // Filtrado por nombre (similar a tu index, pero eficiente)
        if ($name) {
            $workerIds = Worker::where('name', 'LIKE', "%{$name}%")->pluck('id');
            $q->whereIn('id_worker', $workerIds);
        }

        // OJO: esto devuelve un string o null
        $last = $q->max('updated_at');

        return response()->json([
            'last_update' => $last ? Carbon::parse($last)->toISOString() : null,
        ]);
    }
}

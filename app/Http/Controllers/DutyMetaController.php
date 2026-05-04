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
        $start = $request->query('start');
        $end = $request->query('end');
        $name = $request->query('name');

        $q = Duty::query();

        if ($start) {
            $q->whereDate('date', '>=', $start);
        }
        if ($end) {
            $q->whereDate('date', '<', $end);
        }

        if ($name) {
            $workerIds = Worker::where('name', 'LIKE', "%{$name}%")->pluck('id');
            $q->whereIn('id_worker', $workerIds);
        }

        $last = $q->max('updated_at');

        return response()->json([
            'last_update' => $last ? Carbon::parse($last)->toISOString() : null,
        ]);
    }
}

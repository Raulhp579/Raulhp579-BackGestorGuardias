<?php

namespace App\Http\Controllers;

use App\Enums\DutyType;
use App\Models\Duty;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DutyController extends Controller
{
    /**
     * GET /duties
     * Filters:
     * - date=YYYY-MM-DD
     * - month=YYYY-MM
     * - id_speciality=#
     * - worker_id=#
     * - duty_type=CA|PF|LOC
     * - per_page=#
     */
    public function index(Request $request)
    {
        $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'month' => ['nullable', 'regex:/^\d{4}\-(0[1-9]|1[0-2])$/'],
            'id_speciality' => ['nullable', 'integer', 'exists:speciality,id'],
            'worker_id' => ['nullable', 'integer', 'exists:worker,id'],
            'duty_type' => [
                'nullable',
                Rule::in(array_column(DutyType::cases(), 'value')),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $q = Duty::query()
            ->with(['workers', 'chiefWorker'])
            ->select('duties.*');

        // Filter by exact date
        if ($request->filled('date')) {
            $q->whereDate('date', $request->string('date'));
        }

        // Filter by month YYYY-MM
        if ($request->filled('month')) {
            [$y, $m] = explode('-', $request->string('month'));
            $q->whereYear('date', (int)$y)->whereMonth('date', (int)$m);
        }

        if ($request->filled('id_speciality')) {
            $q->where('id_speciality', (int)$request->input('id_speciality'));
        }

        if ($request->filled('duty_type')) {
            $q->where('duty_type', $request->string('duty_type'));
        }

        // Filter by worker assigned (pivot)
        if ($request->filled('worker_id')) {
            $workerId = (int)$request->input('worker_id');
            $q->whereHas('workers', fn($w) => $w->where('worker.id', $workerId));
        }

        $perPage = (int)($request->input('per_page', 50));

        $duties = $q->orderBy('date')->paginate($perPage);

        // Add computed hours + friendly label for UI
        $duties->getCollection()->transform(function (Duty $d) {
            return [
                'id' => $d->id,
                'date' => $d->date?->format('Y-m-d'),
                'duty_type' => $d->duty_type->value,
                'duty_type_label' => $d->duty_type->label(),
                'hours' => $d->hours(),
                'id_speciality' => $d->id_speciality,
                'chief_worker' => $d->chiefWorker ? [
                    'id' => $d->chiefWorker->id,
                    'name' => $d->chiefWorker->name,
                ] : null,
                'workers' => $d->workers->map(fn($w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                ])->values(),
            ];
        });

        return response()->json($duties);
    }

    /**
     * GET /duties/day/{date}
     * Returns a daily aggregated view:
     * - date
     * - chief worker (global)
     * - duties grouped by speciality
     */
    public function day(string $date)
    {
        // 1) Validate route param
        validator(['date' => $date], [
            'date' => ['required', 'date_format:Y-m-d'],
        ])->validate();

        // 2) Fetch duties for the day
        $duties = Duty::query()
            ->with(['workers', 'chiefWorker'])
            ->whereDate('date', $date)
            ->orderBy('id_speciality')
            ->get();

        if ($duties->isEmpty()) {
            return response()->json([
                'date' => $date,
                'chief_worker' => null,
                'chief_inconsistent' => false,
                'by_speciality' => [],
                'message' => 'No duties found for this date.',
            ], 200);
        }

        // 3) Chief consistency check (because chief is stored per row)
        $distinctChiefIds = $duties->pluck('id_chief_worker')
            ->filter()      // remove nulls
            ->unique()
            ->values();

        $chiefInconsistent = $distinctChiefIds->count() > 1;

        // Choose chief:
        // - if consistent => the only one
        // - if inconsistent => pick the most frequent one (best effort)
        $chiefId = null;

        if ($distinctChiefIds->count() === 1) {
            $chiefId = (int)$distinctChiefIds->first();
        } elseif ($distinctChiefIds->count() > 1) {
            $chiefId = (int)$duties->pluck('id_chief_worker')
                ->filter()
                ->countBy()
                ->sortDesc()
                ->keys()
                ->first();
        }

        $chiefWorker = null;
        if ($chiefId) {
            $chiefWorker = Worker::query()->find($chiefId);
        }

        // 4) Load speciality names without requiring Speciality model
        $specialityIds = $duties->pluck('id_speciality')->unique()->values();

        $specialityNames = DB::table('speciality')
            ->whereIn('id', $specialityIds)
            ->pluck('nombre', 'id'); // [id => nombre]

        // 5) Group duties by speciality
        $bySpeciality = $duties->groupBy('id_speciality')->map(function ($items, $specialityId) use ($specialityNames) {

            return [
                'speciality_id' => (int)$specialityId,
                'speciality_name' => $specialityNames[$specialityId] ?? null,

                'duties' => $items->map(function (Duty $d) {
                    return [
                        'id' => $d->id,
                        'duty_type' => $d->duty_type->value,
                        'duty_type_label' => $d->duty_type->label(),
                        'hours' => $d->hours(),

                        'workers' => $d->workers->map(fn($w) => [
                            'id' => $w->id,
                            'name' => $w->name,
                        ])->values(),
                    ];
                })->values(),
            ];
        })->values();

        // 6) Return daily view payload
        return response()->json([
            'date' => $date,
            'chief_worker' => $chiefWorker ? [
                'id' => $chiefWorker->id,
                'name' => $chiefWorker->name,
                'registration_date' => optional($chiefWorker->registration_date)->format('Y-m-d'),
            ] : null,
            'chief_inconsistent' => $chiefInconsistent,
            'by_speciality' => $bySpeciality,
        ]);
    }

    public function autoAssignChief(string $date)
    {
        validator(['date' => $date], [
            'date' => ['required', 'date_format:Y-m-d'],
        ])->validate();

        // Ensure there are duties that day
        $duties = Duty::query()
            ->with('workers')
            ->whereDate('date', $date)
            ->get();

        if ($duties->isEmpty()) {
            return response()->json(['message' => 'No duties found for this date.'], 404);
        }

        // Candidates = unique workers assigned that day
        $candidateIds = $duties->flatMap(fn($d) => $d->workers->pluck('id'))->unique()->values();

        if ($candidateIds->isEmpty()) {
            return response()->json(['message' => 'No workers assigned for this date.'], 422);
        }

        // Month boundaries for the 3-per-month rule
        $dt = \Carbon\Carbon::createFromFormat('Y-m-d', $date);
        $start = $dt->copy()->startOfMonth()->toDateString();
        $end = $dt->copy()->endOfMonth()->toDateString();

        // Fetch candidates ordered by seniority (oldest registration_date first)
        $candidates = Worker::query()
            ->whereIn('id', $candidateIds)
            ->orderBy('registration_date', 'asc')
            ->get(['id', 'name', 'registration_date']);

        // Count how many times each worker is already chief in that month
        // IMPORTANT: because chief is stored per-row, we count DISTINCT dates to avoid overcounting.
        $chiefCounts = Duty::query()
            ->whereBetween('date', [$start, $end])
            ->whereNotNull('id_chief_worker')
            ->select('id_chief_worker', DB::raw('COUNT(DISTINCT date) as cnt'))
            ->groupBy('id_chief_worker')
            ->pluck('cnt', 'id_chief_worker'); // [chief_worker_id => cnt]

        $selected = null;

        foreach ($candidates as $w) {
            $cnt = (int)($chiefCounts[$w->id] ?? 0);
            if ($cnt < 3) {
                $selected = $w;
                break;
            }
        }

        if (!$selected) {
            // Pending review - no one fits the monthly limit
            return response()->json([
                'date' => $date,
                'status' => 'pending_review',
                'message' => 'No eligible candidate (monthly chief limit reached for all).',
            ], 422);
        }

        // Assign to ALL duties of that date
        Duty::query()
            ->whereDate('date', $date)
            ->update(['id_chief_worker' => $selected->id]);

        return response()->json([
            'date' => $date,
            'status' => 'assigned',
            'chief_worker' => [
                'id' => $selected->id,
                'name' => $selected->name,
                'registration_date' => $selected->registration_date,
            ],
        ]);
    }

    /**
     * POST /duties/chief
     * Manual chief assignment for a given date (RF-22).
     * Body: { date: "YYYY-MM-DD", chief_worker_id: 123, reason?: "..." }
     *
     * Note: with your current schema, we set id_chief_worker on ALL duties of that date.
     */
    public function setChief(Request $request)
    {
        $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'chief_worker_id' => ['required', 'integer', 'exists:worker,id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $date = $request->string('date');
        $chiefId = (int)$request->input('chief_worker_id');

        // Must be a worker who is on duty that day (business rule)
        $isCandidate = Duty::query()
            ->whereDate('date', $date)
            ->whereHas('workers', fn($q) => $q->where('worker.id', $chiefId))
            ->exists();

        if (!$isCandidate) {
            return response()->json([
                'message' => 'Chief must be a worker assigned to a duty on that date.',
            ], 422);
        }


        $updated = Duty::query()
            ->whereDate('date', $date)
            ->update(['id_chief_worker' => $chiefId]);

        // Optional: store audit log if you have an audits table (RF-44)
        // DB::table('audits')->insert([...]);

        return response()->json([
            'message' => 'Chief assigned successfully.',
            'date' => $date,
            'chief_worker_id' => $chiefId,
            'updated_rows' => $updated,
        ]);
    }

    /**
     * GET /duties/types
     * Returns enum values for frontend dropdowns (no DB table needed).
     */
    public function types()
    {
        $types = array_map(fn($c) => [
            'value' => $c->value,
            'label' => $c->label(),
            'hours' => $c->hours(),
        ], DutyType::cases());

        return response()->json($types);
    }

    /**
     * GET /duties/workers/search?q=...
     * Simple search for workers by name (RF-27).
     */
    public function searchWorkers(Request $request)
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $q = $request->string('q');
        $limit = (int)($request->input('limit', 20));

        $workers = Worker::query()
            ->where('name', 'like', '%' . $q . '%')
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'rank', 'registration_date', 'id_speciality']);

        return response()->json($workers);
    }
}

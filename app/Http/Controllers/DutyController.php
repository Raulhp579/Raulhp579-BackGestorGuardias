<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Worker;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DutyController extends Controller
{
    /**
     * Validation rules + messages 
     */
    public function validateDuty()
    {
        $rules = [
            "date" => "required|date",
            "duty_type" => "required|in:CA,PF,LOC",
            "id_speciality" => "required|exists:speciality,id",
            "id_chief_worker" => "nullable|exists:worker,id"
        ];

        $messages = [
            "date.required" => "the date is required",
            "date.date" => "the date must be valid",

            "duty_type.required" => "the duty type is required",
            "duty_type.in" => "the duty type must be CA, PF or LOC",

            "id_speciality.required" => "the speciality is required",
            "id_speciality.exists" => "the speciality does not exists",

            "id_chief_worker.exists" => "the chief worker does not exists"
        ];

        return [$rules, $messages];
    }

    /**
     * GET: return all duties (optionally filtered by date or month)
     * Example:
     * /duties?date=2026-01-12
     * /duties?month=2026-01
     */
    public function index(Request $request)
    {
        try {
            $query = Duty::query();

            // Simple optional filters 
            if ($request->date) {
                $query->whereDate("date", $request->date);
            }

            if ($request->month) {
                // month format: YYYY-MM
                $parts = explode("-", $request->month);
                if (count($parts) == 2) {
                    $query->whereYear("date", $parts[0])->whereMonth("date", $parts[1]);
                }
            }

            if ($request->id_speciality) {
                $query->where("id_speciality", $request->id_speciality);
            }

            if ($request->duty_type) {
                $query->where("duty_type", $request->duty_type);
            }

            $duties = $query->orderBy("date", "asc")->get();

            return response()->json($duties);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem to show the duties",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * POST: create a new duty
     */
    public function store(Request $request)
    {
        try {
            $validate = Validator::make($request->all(), $this->validateDuty()[0], $this->validateDuty()[1]);

            if ($validate->fails()) {
                return response()->json([
                    "error" => $validate->errors()->first()
                ]);
            }

            // Avoid duplicates (same date + speciality + duty_type)
            $exists = Duty::whereDate("date", $request->date)
                ->where("id_speciality", $request->id_speciality)
                ->where("duty_type", $request->duty_type)
                ->first();

            if ($exists) {
                return response()->json([
                    "error" => "this duty already exists for that date, speciality and type"
                ]);
            }

            $duty = new Duty();
            $duty->date = $request->date;
            $duty->duty_type = $request->duty_type;
            $duty->id_speciality = $request->id_speciality;
            $duty->id_chief_worker = $request->id_chief_worker; // can be null
            $duty->save();

            return response()->json([
                "success" => "the duty has been created",
                "duty_id" => $duty->id
            ]);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem creating the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * GET: show one duty by id
     */
    public function show(string $id)
    {
        try {
            $duty = Duty::where("id", $id)->first();

            if (!$duty) {
                return response()->json([
                    "error" => "the duty does not exists"
                ]);
            }

            return response()->json($duty);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem to show the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * PUT/PATCH: update duty by id
     */
    public function update(Request $request, string $id)
    {
        try {
            $validate = Validator::make($request->all(), $this->validateDuty()[0], $this->validateDuty()[1]);

            if ($validate->fails()) {
                return response()->json([
                    "error" => $validate->errors()->first()
                ]);
            }

            $duty = Duty::where("id", $id)->first();

            if (!$duty) {
                return response()->json([
                    "error" => "the duty does not exists"
                ]);
            }

            // Check duplicates excluding this duty
            $exists = Duty::whereDate("date", $request->date)
                ->where("id_speciality", $request->id_speciality)
                ->where("duty_type", $request->duty_type)
                ->where("id", "!=", $id)
                ->first();

            if ($exists) {
                return response()->json([
                    "error" => "another duty already exists for that date, speciality and type"
                ]);
            }

            $duty->date = $request->date;
            $duty->duty_type = $request->duty_type;
            $duty->id_speciality = $request->id_speciality;
            $duty->id_chief_worker = $request->id_chief_worker;
            $duty->save();

            return response()->json([
                "success" => "the duty has been updated"
            ]);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem updating the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * DELETE: remove duty by id
     */
    public function destroy(string $id)
    {
        try {
            $duty = Duty::where("id", $id)->first();

            if (!$duty) {
                return response()->json([
                    "error" => "the duty does not exists"
                ]);
            }

            // Remove pivot relations first (to be safe)
            DB::table("duty_worker")->where("duty_id", $duty->id)->delete();

            $duty->delete();

            return response()->json([
                "success" => "the duty has been deleted"
            ]);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem deleting the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * GET: daily view (simple)
     * /duties/day/2026-01-12
     */
    public function day(string $date)
    {
        try {
            // Simple validation
            $validate = Validator::make(["date" => $date], [
                "date" => "required|date"
            ], [
                "date.required" => "the date is required",
                "date.date" => "the date must be valid"
            ]);

            if ($validate->fails()) {
                return response()->json([
                    "error" => $validate->errors()->first()
                ]);
            }

            $duties = Duty::whereDate("date", $date)->get();

            if ($duties->isEmpty()) {
                return response()->json([
                    "date" => $date,
                    "chief_worker" => null,
                    "duties" => []
                ]);
            }

            // Chief worker (best effort: first row)
            $chiefId = $duties->first()->id_chief_worker;
            $chief = null;

            if ($chiefId) {
                $chief = Worker::where("id", $chiefId)->first();
            }

            // Add speciality name to each duty (simple join by query)
            $specialityNames = DB::table("speciality")->pluck("nombre", "id");

            $result = $duties->map(function ($d) use ($specialityNames) {
                return [
                    "id" => $d->id,
                    "date" => $d->date,
                    "duty_type" => $d->duty_type,
                    "id_speciality" => $d->id_speciality,
                    "speciality_name" => $specialityNames[$d->id_speciality] ?? null,
                    "id_chief_worker" => $d->id_chief_worker
                ];
            });

            return response()->json([
                "date" => $date,
                "chief_worker" => $chief ? [
                    "id" => $chief->id,
                    "name" => $chief->name
                ] : null,
                "duties" => $result
            ]);

        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem to show the day view",
                "mistake" => $e->getMessage()
            ]);
        }
    }
}
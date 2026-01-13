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
     * Validation rules for Duty
     */
    public function validateDuty()
    {
        $rules = [
            "date" => "required|date",
            "duty_type" => "required|in:CA,PF,LOC",
            "id_speciality" => "required|exists:speciality,id",
            "id_chief_worker" => "nullable|exists:worker,id",
            "id_worker" => "required|exists:worker,id",
        ];

        $messages = [
            "date.required" => "the date is required",
            "date.date" => "the date must be valid",

            "duty_type.required" => "the duty type is required",
            "duty_type.in" => "the duty type must be CA, PF or LOC",

            "id_speciality.required" => "the speciality is required",
            "id_speciality.exists" => "the speciality does not exist",

            "id_chief_worker.exists" => "the chief worker does not exist",

            "id_worker.required" => "the worker is required",
            "id_worker.exists" => "the worker does not exist",
        ];

        return [$rules, $messages];
    }

    /**
     * Return all duties
     */
    public function index()
    {
        try {
            $duties = Duty::all();
            return response()->json($duties);
        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem showing the duties",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new duty
     */
    public function store(Request $request)
    {
        try {
            $validate = Validator::make(
                $request->all(),
                $this->validateDuty()[0],
                $this->validateDuty()[1]
            );

            if ($validate->fails()) {
                return response()->json([
                    "error" => $validate->errors()->first()
                ]);
            }

            // Avoid duplicates
            $exists = Duty::where("date", $request->date)
                ->where("id_speciality", $request->id_speciality)
                ->where("duty_type", $request->duty_type)
                ->where("id_worker", $request->id_worker)
                ->first();

            if ($exists) {
                return response()->json([
                    "error" => "this duty already exists"
                ]);
            }

            $duty = new Duty();
            $duty->date = $request->date;
            $duty->duty_type = $request->duty_type;
            $duty->id_speciality = $request->id_speciality;
            $duty->id_chief_worker = $request->id_chief_worker;
            $duty->id_worker = $request->id_worker;
            $duty->save();

            return response()->json([
                "success" => "the duty has been created"
            ]);
        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem creating the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * Show one duty by id
     */
    public function show(string $id)
    {
        try {
            $duty = Duty::where("id", $id)->first();

            if (!$duty) {
                return response()->json([
                    "error" => "the duty does not exist"
                ]);
            }

            return response()->json($duty);
        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem showing the duty",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /**
     * Update a duty
     */
    public function update(Request $request, string $id)
{
    try {
        // Validate data
        $validate = Validator::make(
            $request->all(),
            $this->validateDuty()[0],
            $this->validateDuty()[1]
        );

        if ($validate->fails()) {
            return response()->json([
                "error" => $validate->errors()->first()
            ]);
        }

        //  Find duty
        $duty = Duty::where("id", $id)->first();

        if (!$duty) {
            return response()->json([
                "error" => "the duty does not exist"
            ]);
        }

        //  CHECK DUPLICATE 
        $exists = Duty::where("date", $request->date)
            ->where("id_speciality", $request->id_speciality)
            ->where("duty_type", $request->duty_type)
            ->where("id_worker", $request->id_worker)
            ->where("id", "!=", $id)
            ->first();

        if ($exists) {
            return response()->json([
                "error" => "this duty already exists"
            ]);
        }

        //  Update data
        $duty->date = $request->date;
        $duty->duty_type = $request->duty_type;
        $duty->id_speciality = $request->id_speciality;
        $duty->id_worker = $request->id_worker;
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
     * Delete a duty
     */
    public function destroy(string $id)
    {
        try {
            $duty = Duty::where("id", $id)->first();

            if (!$duty) {
                return response()->json([
                    "error" => "the duty does not exist"
                ]);
            }

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
     * Daily view of duties
     */
    public function day(string $date)
    {
        try {
            $validate = Validator::make(
                ["date" => $date],
                ["date" => "required|date"]
            );

            if ($validate->fails()) {
                return response()->json([
                    "error" => $validate->errors()->first()
                ]);
            }

            $duties = Duty::whereDate("date", $date)->get();

            return response()->json([
                "date" => $date,
                "duties" => $duties
            ]);
        } catch (Exception $e) {
            return response()->json([
                "error" => "there is a problem showing the daily duties",
                "mistake" => $e->getMessage()
            ]);
        }
    }

    /* HAY QUE PROBAR ASIGNAR JEFE U OTRO METODO 
  


    public function assignChief(string $date)
{
    try {
        // 1) Validate date
        $validate = Validator::make(
            ["date" => $date],
            ["date" => "required|date"],
            ["date.required" => "the date is required", "date.date" => "the date must be valid"]
        );

        if ($validate->fails()) {
            return response()->json([
                "error" => $validate->errors()->first()
            ]);
        }

        // 2) Get all duties of that day
        $duties = Duty::where("date", $date)->get();

        if ($duties->isEmpty()) {
            return response()->json([
                "error" => "there are no duties for that date"
            ]);
        }

        // 3) Get worker candidates that are working that day (pivot duty_worker)
        $workerIds = DB::table("duty_worker")
            ->join("duties", "duty_worker.duty_id", "=", "duties.id")
            ->where("duties.date", $date)
            ->select("duty_worker.worker_id")
            ->distinct()
            ->pluck("worker_id");

        if ($workerIds->isEmpty()) {
            return response()->json([
                "error" => "there are no workers assigned for that date"
            ]);
        }

        // 4) Order candidates by seniority (oldest registration_date first)
        $candidates = Worker::whereIn("id", $workerIds)
            ->orderBy("registration_date", "asc")
            ->get();

        // 5) Calculate month (YYYY-MM) to apply the 3 chiefs limit
        $month = date("Y-m", strtotime($date));

        // 6) Build counts of chiefs per worker in that month (count DISTINCT days)
        $monthDuties = Duty::where("date", "like", $month . "%")
            ->whereNotNull("id_chief_worker")
            ->get(["date", "id_chief_worker"]);

        $chiefDaysPerWorker = []; // [worker_id => [date1=>true, date2=>true...]]

        foreach ($monthDuties as $md) {
            $wid = $md->id_chief_worker;
            if (!$wid) continue;

            if (!isset($chiefDaysPerWorker[$wid])) {
                $chiefDaysPerWorker[$wid] = [];
            }

            // store unique day
            $chiefDaysPerWorker[$wid][$md->date] = true;
        }

        // 7) Pick first candidate with < 3 chief days this month
        $selectedChief = null;

        foreach ($candidates as $w) {
            $countDays = 0;

            if (isset($chiefDaysPerWorker[$w->id])) {
                $countDays = count($chiefDaysPerWorker[$w->id]);
            }

            if ($countDays < 3) {
                $selectedChief = $w;
                break;
            }
        }

        if (!$selectedChief) {
            return response()->json([
                "error" => "no eligible chief (all candidates already have 3 chiefs this month)"
            ]);
        }

        // 8) Assign chief to ALL duties of that day
        Duty::where("date", $date)->update([
            "id_chief_worker" => $selectedChief->id
        ]);

        return response()->json([
            "success" => "chief assigned successfully",
            "date" => $date,
            "chief_worker" => [
                "id" => $selectedChief->id,
                "name" => $selectedChief->name,
                "registration_date" => $selectedChief->registration_date
            ]
        ]);

    } catch (Exception $e) {
        return response()->json([
            "error" => "there is a problem assigning the chief",
            "mistake" => $e->getMessage()
        ]);
    }
}
     */
}

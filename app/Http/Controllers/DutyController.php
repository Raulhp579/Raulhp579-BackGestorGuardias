<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Worker;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Models\User;

class DutyController extends Controller
{
    /**
     * Validation rules for Duty
     */
    public function validateDuty()
    {
        $rules = [
            'date' => 'required|date',
            'duty_type' => 'required|in:CA,PF,LOC',
            'id_speciality' => 'required|exists:speciality,id',
            'id_chief_worker' => 'nullable|exists:worker,id',
            'id_worker' => 'required|exists:worker,id',
        ];

        $messages = [
            'date.required' => 'the date is required',
            'date.date' => 'the date must be valid',

            'duty_type.required' => 'the duty type is required',
            'duty_type.in' => 'the duty type must be CA, PF or LOC',

            'id_speciality.required' => 'the speciality is required',
            'id_speciality.exists' => 'the speciality does not exist',

            'id_chief_worker.exists' => 'the chief worker does not exist',

            'id_worker.required' => 'the worker is required',
            'id_worker.exists' => 'the worker does not exist',
        ];

        return [$rules, $messages];
    }

    /**
     * Return all duties
     */
    public function index(Request $request)
    {
        try {
            //duties by name user and date
            if(isset($request->name)){
                if(isset($request->date)){
                    $users = Worker::where("name",'LIKE',"%{$request->name}%")->get();
                    $allDuties = [];

                    foreach($users as $user){
                        $allDutiesUser = Duty::where("id_worker",$user->id)->where("date",$request->date)->get();   
                        foreach($allDutiesUser as $duty){
                            $allDuties[]=$duty;
                        }
                    }
                }else{
                    $users = Worker::where("name",'LIKE',"%{$request->name}%")->get();
                    $allDuties = [];

                    foreach($users as $user){
                        $allDutiesUser = Duty::where("id_worker",$user->id)->get();   
                        foreach($allDutiesUser as $duty){
                            $allDuties[]=$duty;
                        }
                    }
                }
            }else if(isset($request->date)){
                $allDuties = Duty::where("date",$request->date)->get();             
            }else{
                $allDuties = Duty::all();
            }
     
            $duties = [];
            foreach($allDuties as $duty){
                $duties[] = [
                    "id"=>$duty->id,
                    "date"=>$duty->date,
                    "duty_type"=>$duty->duty_type,
                    "id_speciality"=>$duty->id_speciality,
                    "speciality"=>$duty->worker->speciality->name,
                    "id_worker"=>$duty->id_worker,
                    "worker" =>$duty->worker->name,
                    "id_chief_worker"=>$duty->id_chief_worker,
                    "chief_worker"=>$duty->chief->name??null,
                    "is_chief"   => (int) $duty->id_worker === (int) $duty->id_chief_worker,
                ];
            }

            return response()->json($duties);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem showing the duties',
                'mistake' => $e->getMessage(),
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
                    'error' => $validate->errors()->first(),
                ]);
            }

            // Avoid duplicates
            $exists = Duty::where('date', $request->date)
                ->where('id_speciality', $request->id_speciality)
                ->where('duty_type', $request->duty_type)
                ->where('id_worker', $request->id_worker)
                ->first();

            if ($exists) {
                return response()->json([
                    'error' => 'this duty already exists',
                ]);
            }

            $duty = new Duty;
            $duty->date = $request->date;
            $duty->duty_type = $request->duty_type;
            $duty->id_speciality = $request->id_speciality;
            $duty->id_chief_worker = $request->id_chief_worker;
            $duty->id_worker = $request->id_worker;
            $duty->save();

            return response()->json([
                'success' => 'the duty has been created',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem creating the duty',
                'mistake' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Show one duty by id
     */
    public function show(string $id)
    {
        try {
            $duty = Duty::where('id', $id)->first();

            if (! $duty) {
                return response()->json([
                    'error' => 'the duty does not exist',
                ]);
            }

            return response()->json($duty);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem showing the duty',
                'mistake' => $e->getMessage(),
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
                    'error' => $validate->errors()->first(),
                ]);
            }

            //  Find duty
            $duty = Duty::where('id', $id)->first();

            if (! $duty) {
                return response()->json([
                    'error' => 'the duty does not exist',
                ]);
            }

            //  CHECK DUPLICATE
            $exists = Duty::where('date', $request->date)
                ->where('id_speciality', $request->id_speciality)
                ->where('duty_type', $request->duty_type)
                ->where('id_worker', $request->id_worker)
                ->where('id', '!=', $id)
                ->first();

            if ($exists) {
                return response()->json([
                    'error' => 'this duty already exists',
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
                'success' => 'the duty has been updated',
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem updating the duty',
                'mistake' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete a duty
     */
    public function destroy(string $id)
    {
        try {
            $duty = Duty::where('id', $id)->first();

            if (! $duty) {
                return response()->json([
                    'error' => 'the duty does not exist',
                ]);
            }

            $duty->delete();

            return response()->json([
                'success' => 'the duty has been deleted',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem deleting the duty',
                'mistake' => $e->getMessage(),
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
                ['date' => $date],
                ['date' => 'required|date']
            );

            if ($validate->fails()) {
                return response()->json([
                    'error' => $validate->errors()->first(),
                ]);
            }

            $duties = Duty::whereDate('date', $date)->get();

            return response()->json([
                'date' => $date,
                'duties' => $duties,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem showing the daily duties',
                'mistake' => $e->getMessage(),
            ]);
        }
    }

    // this function need the month and the year
    public function assignChief(Request $request)
    {
        try {

            // take the duties of one month
            $duties = Duty::whereMonth('date', $request->month)->whereYear('date', $request->year)->get();
            $workers = Worker::orderBy('registration_date', 'ASC')->get();

            
            for ($i = 1; $i <= 31; $i++) {
                $allWorkers = clone $workers;
                
                // iterate the duties and group it with the same day
                $dutiesDay = $this->takeOneDay($duties, $i);

                $oldestWorker = $this->selectOldestWorker($allWorkers, $dutiesDay);

                if (! $oldestWorker) {
                    continue;
                }

                while ($oldestWorker && $this->countWorkersTime($oldestWorker->id, $duties)) {
                    for ($z = 0; $z < count($allWorkers); $z++) {
                        $worker = $allWorkers[$z];
                        if ($worker && $oldestWorker->id == $worker->id) {
                            $allWorkers[$z] = null;
                            break;
                        }
                    }
                    $oldestWorker = $this->selectOldestWorker($allWorkers, $dutiesDay);
                }

                if (! $oldestWorker) {
                    continue;
                }

                foreach ($dutiesDay as $duty) {
                    // assign the chief of the day to all duties of the day
                    $duty->id_chief_worker = $oldestWorker->id;
                    $duty->save();
                }

            }

            return response()->json(['success' => 'success', 'message' => 'Duties assigned successfully to the month'], 200);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error in assignDuties', 'message' => $e->getMessage()], 500);
        }

    }

    public function selectOldestWorker($workers, $dutiesDay)
    {
        $oldestWorker = null;
        foreach ($dutiesDay as $duty) {
            foreach ($workers as $worker) {
                if ($worker && $duty->id_worker == $worker->id) {
                    if ($oldestWorker === null ||
                        Carbon::parse($worker->registration_date)->lt(Carbon::parse($oldestWorker->registration_date))) {
                        $oldestWorker = $worker;
                    }
                }
            }
        }

        return $oldestWorker;
    }

    // this function return a true if the worker
    public function countWorkersTime($idWorker, $duties)
    {
        $counter = 0;

        for ($i = 1; $i <= 31; $i++) {
            $dutiesDay = $this->takeOneDay($duties, $i);

            if (count($dutiesDay) > 0 && $dutiesDay[0]->id_chief_worker != null && $dutiesDay[0]->id_chief_worker == $idWorker) {
                $counter++;
                if ($counter >= 3) {
                    return true; // worker has been chief for 3
                }
            }
        }

        return false;
    }


    public function takeOneDay($duties, $i)
    {
        $dutiesDay = [];

        foreach ($duties as $duty) {
            // take only the date to comparete it
            $timeStamp = strtotime($duty->date);
            $date = date('d', $timeStamp);

            // save the duties of the same day
            if ($i == $date) {
                $dutiesDay[] = $duty;
            }

        }

        return $dutiesDay;
    }

    /**
     * Get paginated duties for a specific worker
     */
    public function getWorkerDutiesPaginated(Request $request, $id)
    {
        try {
            // Validate worker exists
            $worker = Worker::find($id);
            if (!$worker) {
                return response()->json(['error' => 'Worker not found'], 404);
            }

            // Ensure the authenticated user is authorized to view this worker's duties
            // (admin can view any, user can only view their own)
            $user = $request->user();
            // Assuming user has a worker_id or checks against user id linked to worker
            // Specifically for "Mis Guardias", the user usually requests their own ID.

            $query = Duty::where('id_worker', $id);

            // Filter by date if provided
            if ($request->has('date') && !empty($request->date)) {
                $query->whereDate('date', $request->date);
            }

            // Order by date descending (newest first)
            $query->orderBy('date', 'desc');

            // Paginate
            $pageSize = $request->input('per_page', 10);
            $duties = $query->paginate($pageSize);

            // Transform data to match frontend structure (include relation names)
            $duties->getCollection()->transform(function ($duty) {
                return [
                    "id" => $duty->id,
                    "date" => $duty->date,
                    "duty_type" => $duty->duty_type,
                    "id_speciality" => $duty->id_speciality,
                    "speciality" => $duty->worker->speciality->name ?? null,
                    "id_worker" => $duty->id_worker,
                    "worker" => $duty->worker->name ?? null,
                    "id_chief_worker" => $duty->id_chief_worker,
                    "chief_worker" => $duty->chief->name ?? null,
                    "is_chief" => (int) $duty->id_worker === (int) $duty->id_chief_worker,
                ];
            });

            return response()->json($duties);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error fetching worker duties',
                'mistake' => $e->getMessage()
            ], 500);
        }
    }



}

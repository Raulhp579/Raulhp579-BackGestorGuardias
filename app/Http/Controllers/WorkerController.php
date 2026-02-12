<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Models\Speciality;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class WorkerController extends Controller
{
    /**
     * Validation rules for Worker
     */
    public function validateWorker()
    {
        $rules = [
            'name' => 'required|string|max:255',
            'rank' => 'nullable|string|max:100',
            'registration_date' => 'required|date',
            'discharge_date' => 'nullable|date|after:registration_date',
            'id_speciality' => 'nullable|exists:speciality,id',
        ];

        $messages = [
            'name.required' => 'El nombre es requerido',
            'name.string' => 'El nombre debe ser texto',
            'name.max' => 'El nombre no debe exceder 255 caracteres',

            'rank.string' => 'El rango debe ser texto',
            'rank.max' => 'El rango no debe exceder 100 caracteres',

            'registration_date.required' => 'La fecha de registro es requerida',
            'registration_date.date' => 'La fecha de registro debe ser una fecha válida',

            'discharge_date.date' => 'La fecha de baja debe ser una fecha válida',
            'discharge_date.after' => 'La fecha de baja debe ser posterior a la fecha de registro',

            'id_speciality.exists' => 'La especialidad no existe',
        ];

        return [$rules, $messages];
    }

    /**
     * Get all workers
     */
    public function index(Request $request)
    {
        try {
            // Traer trabajadores con su especialidad relacionada
            if(isset($request->name)){
                $workersAll = Worker::where("name",'LIKE',"%$request->name%")->get();
            }else{
                $workersAll = Worker::with('speciality')->get();
            }
            
            $workers = [];
            foreach($workersAll as $worker){
                $workers[]=[
                    "id"=>$worker->id,
                    "name"=>$worker->name,
                    "rank"=>$worker->rank,
                    "registration_date"=>$worker->registration_date,
                    "discharge_date"=>$worker->discharge_date,
                    "id_speciality"=>$worker->id_speciality,
                    "speciality"=>$worker->speciality ? $worker->speciality->name : null
                ];
            }

            return response()->json($workers);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al mostrar los trabajadores',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single worker by id
     */
    public function show(string $id)
    {
        try {
            // Traer un trabajador específico con su especialidad
            $worker = Worker::with('speciality', 'duties')->find($id);

            if (!$worker) {
                return response()->json([
                    'error' => 'El trabajador no existe',
                ], 404);
            }

            return response()->json($worker);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al mostrar el trabajador',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new worker
     */
    public function store(Request $request)
    {
        try {
            // Validar los datos
            $validate = Validator::make(
                $request->all(),
                $this->validateWorker()[0],
                $this->validateWorker()[1]
            );

            if ($validate->fails()) {
                return response()->json([
                    'error' => $validate->errors()->first(),
                ], 422);
            }

            // Crear nuevo trabajador
            $worker = new Worker();
            $worker->name = $request->name;
            $worker->rank = $request->rank;
            $worker->registration_date = $request->registration_date;
            $worker->discharge_date = $request->discharge_date;
            $worker->id_speciality = $request->id_speciality;
            $worker->save();

            // Create User automatically
            $user = new User;
            $user->name = $request->name;
            // Generate email: name.surname@alu.medac.es (simplified logic based on ImportExcelsController)
            // ImportExcelsController uses: strtolower(str_replace(' ', '', $persons[$i])).'@alu.medac.es';
            $user->email = strtolower(str_replace(' ', '', $request->name)).'@alu.medac.es';
            $password = $request->password ? $request->password : "password";
            $user->password = Hash::make($password);
            $user->worker_id = $worker->id;
            $user->save();

            return response()->json([
                'success' => 'El trabajador ha sido creado correctamente',
                'worker' => $worker,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al crear el trabajador',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a worker
     */
    public function update(Request $request, string $id)
    {
        try {
            // Buscar el trabajador
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'error' => 'El trabajador no existe',
                ], 404);
            }

            // Validar los datos
            $validate = Validator::make(
                $request->all(),
                $this->validateWorker()[0],
                $this->validateWorker()[1]
            );

            if ($validate->fails()) {
                return response()->json([
                    'error' => $validate->errors()->first(),
                ], 422);
            }

            // Actualizar los datos
            $worker->name = $request->name;
            $worker->rank = $request->rank;
            $worker->registration_date = $request->registration_date;
            $worker->discharge_date = $request->discharge_date;
            $worker->id_speciality = $request->id_speciality;
            $worker->save();

            return response()->json([
                'success' => 'El trabajador ha sido actualizado correctamente',
                'worker' => $worker,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al actualizar el trabajador',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a worker
     */
    public function destroy(string $id)
    {
        try {
            // Buscar el trabajador
            $worker = Worker::find($id);

            if (!$worker) {
                return response()->json([
                    'error' => 'El trabajador no existe',
                ], 404);
            }

            // Verificar si tiene turnos asignados
            $dutyCount = $worker->duties()->count();
            if ($dutyCount > 0) {
                return response()->json([
                    'error' => 'No se puede eliminar un trabajador que tiene turnos asignados',
                    'duties_count' => $dutyCount,
                ], 409);
            }

            // Eliminar el trabajador
            $worker->delete();

            return response()->json([
                'success' => 'El trabajador ha sido eliminado correctamente',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al eliminar el trabajador',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get workers by speciality
     */
    public function getBySpeciality(string $idSpeciality)
    {
        try {
            // Verificar que la especialidad existe
            $speciality = Speciality::find($idSpeciality);
            if (!$speciality) {
                return response()->json([
                    'error' => 'La especialidad no existe',
                ], 404);
            }

            // Traer trabajadores activos de esa especialidad
            $workers = Worker::where('id_speciality', $idSpeciality)
                ->where(function ($query) {
                    // Si no tiene discharge_date, está activo
                    // Si tiene discharge_date y es posterior a hoy, está activo
                    $query->whereNull('discharge_date')
                        ->orWhere('discharge_date', '>=', Carbon::now());
                })
                ->get();

            return response()->json($workers);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al obtener los trabajadores',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active workers (not discharged)
     */
    public function getActive()
    {
        try {
            // Traer solo trabajadores activos (sin fecha de baja o con fecha futura)
            $workers = Worker::where(function ($query) {
                $query->whereNull('discharge_date')
                    ->orWhere('discharge_date', '>=', Carbon::now());
            })
            ->with('speciality')
            ->get();

            return response()->json($workers);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Hay un problema al obtener los trabajadores activos',
                'mistake' => $e->getMessage(),
            ], 500);
        }
    }
}

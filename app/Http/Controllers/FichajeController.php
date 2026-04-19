<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Fichaje;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FichajeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            // Se cargan relaciones: worker (con user para el nombre) y duty
            $fichajes = Fichaje::with(['worker.user', 'duty'])->get();
            return response()->json($fichajes);
        } catch (Exception $e) {
            return response()->json([
                "message" => "Error al obtener los fichajes",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try{
            $fichaje = new Fichaje();
            $fichaje->date_time = $request->date_time;
            $fichaje->type = $request->type;
            $fichaje->worker_id = $request->worker_id;
            $fichaje->id_duty = $request->id_duty;
            $fichaje->save();
            return response()->json($fichaje);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al crear el fichaje",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try{
            $fichaje = Fichaje::find($id);
            return response()->json($fichaje);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al obtener el fichaje",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try{
            $fichaje = Fichaje::find($id);
            if(!$fichaje){
                return response()->json([
                    "message" => "El fichaje no existe",
                ], 404);
            }
            
            $fichaje->date_time = $request->date_time;
            $fichaje->type = $request->type;
            $fichaje->worker_id = $request->worker_id;
            $fichaje->id_duty = $request->id_duty;
            $fichaje->save();
            return response()->json($fichaje);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al actualizar el fichaje",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try{
            $fichaje = Fichaje::find($id);
            if(!$fichaje){
                return response()->json([
                    "message" => "El fichaje no existe",
                ], 404);
            }
            $fichaje->delete();
            return response()->json([
                "message" => "Fichaje eliminado correctamente",
            ]);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al eliminar el fichaje",
                "error" => $e->getMessage()
            ], 500);
        }
    }


    public function obtenerFichajesPorGuardia(string $id_duty){
        try{
            $fichajes = Fichaje::where('id_duty', $id_duty)->get();
            return response()->json($fichajes);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al obtener los fichajes",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function obtenerFichajesPorTrabajador(string $worker_id){
        try{
            $fichajes = Fichaje::where('worker_id', $worker_id)->get();
            return response()->json($fichajes);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al obtener los fichajes",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function fichar(Request $request){
        try{
            $worker = Auth::user()->worker;
            if(!$worker){
                return response()->json([
                    "message" => "El trabajador no existe",
                ], 404);
            }
            $duty = Duty::where('id_worker', $worker->id)->where('date', date('Y-m-d'))->first();
            if(!$duty){
                // Crear automáticamente la guardia predeterminada (CA = Continuity of Care) para hoy
                $duty = new Duty();
                $duty->date = date('Y-m-d');
                $duty->duty_type = \App\Enums\DutyType::CA; 
                $duty->id_worker = $worker->id;
                $duty->id_speciality = $worker->id_speciality;
                $duty->save();
            }

            // Validación de Ubicación (Medac Arena Córdoba: 37.876, -4.814)
            $medacLat = 37.876;
            $medacLng = -4.814;
            $userLat = $request->latitude;
            $userLng = $request->longitude;

            if(!$userLat || !$userLng){
                return response()->json([
                    "message" => "Es necesario proporcionar tu ubicación GPS para fichar.",
                ], 422);
            }

            $earthRadius = 6371000; // Radio de la tierra en metros
            $latFrom = deg2rad($medacLat);
            $lonFrom = deg2rad($medacLng);
            $latTo = deg2rad($userLat);
            $lonTo = deg2rad($userLng);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
            $distance = $angle * $earthRadius;

            if ($distance > 200) {
                return response()->json([
                    "message" => "Estás demasiado lejos del Medac Arena para fichar. Distancia aproximada: " . round($distance) . " metros.",
                ], 422);
            }

            $ultimoFichaje = Fichaje::where('worker_id', $worker->id)->where('id_duty', $duty->id)->latest()->first();

            $fichaje = new Fichaje();
            $fichaje->date_time = date('Y-m-d H:i:s');
            if(!$ultimoFichaje || $ultimoFichaje->type == 1){
                $fichaje->type = 0; //entrada
            }else{
                $fichaje->type = 1; //salida
            }
            $fichaje->worker_id = $worker->id;
            $fichaje->id_duty = $duty->id;
            $fichaje->latitude = $userLat;
            $fichaje->longitude = $userLng;
            $fichaje->save();
            return response()->json($fichaje);

        }catch(Exception $e){
            return response()->json([
                "message" => "Error al fichar",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    public function misUltimosTresFicahjes(){
        try{
            $worker = Auth::user()->worker;
            if(!$worker){
                return response()->json([
                    "message" => "El trabajador no existe",
                ], 404);
            }
            $fichajes = Fichaje::where('worker_id', $worker->id)->latest()->take(3)->get();
            return response()->json($fichajes);
        }catch(Exception $e){
            return response()->json([
                "message" => "Error al obtener los fichajes",
                "error" => $e->getMessage()
            ], 500);
        }
    }
}

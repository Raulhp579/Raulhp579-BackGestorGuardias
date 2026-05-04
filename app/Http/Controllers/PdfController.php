<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Speciality;
use App\Models\Worker;
use Barryvdh\DomPDF\Facade\Pdf as FacadePdf;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    // its need a request with day, month and year
    public function generarPdfDia(Request $request)
    {
        try {
            $day = $request->query('day');
            $month = $request->query('month');
            $year = $request->query('year');

            if (!$day || !$month || !$year) {
                return response()->json(['error' => 'Faltan parámetros: day, month, year'], 400);
            }

            $specialities = Speciality::all();
            $duties = Duty::whereDay('date', $day)
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->get();

            if ($duties->isEmpty()) {
                return response()->json(['error' => 'No hay guardias para esta fecha'], 404);
            }

            $workers = Worker::all();
            $chiefWorker = isset($duties[0]) && $duties[0]->chiefWorker 
                ? $duties[0]->chiefWorker->name 
                : 'Sin asignar';
            $date = $duties[0]->date ?? null;

            $pdf = FacadePdf::loadView('PlantillaDiaPdf', [
                'specialities' => $specialities, 
                'duties' => $duties, 
                'workers' => $workers, 
                'chiefWorker' => $chiefWorker, 
                'date' => $date
            ]);

            return $pdf->download('PlantillaDiaPdf.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}

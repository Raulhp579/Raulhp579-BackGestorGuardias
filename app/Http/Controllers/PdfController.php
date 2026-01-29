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
        $specialities = Speciality::all();
        $duties = Duty::whereDay('date', $request->day)->whereMonth('date', $request->month)->whereYear('date', $request->year)->get();

        $workers = Worker::all();
        $chiefWorker = $duties[0]->chiefWorker->name;
        $date = $duties[0]->date;
        $pdf = FacadePdf::loadView('PlantillaDiaPdf', ['specialities' => $specialities, 'duties' => $duties, 'workers' => $workers, 'chiefWorker' => $chiefWorker, 'date' => $date]);

        return $pdf->download('PlantillaDiaPdf.pdf');
    }
}

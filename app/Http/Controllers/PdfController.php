<?php

namespace App\Http\Controllers;

use App\Mail\MailableConfig;
use App\Models\Duty;
use App\Models\Speciality;
use App\Models\Worker;
use Barryvdh\DomPDF\Facade\Pdf as FacadePdf;
use Barryvdh\DomPDF\PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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

    public function sendPdfByEmail(Request $request)
    {
        try {
            $day   = $request->input('day');
            $month = $request->input('month');
            $year  = $request->input('year');
            $email = $request->input('email');

            if (!$day || !$month || !$year) {
                return response()->json(['error' => 'Faltan parámetros: day, month, year'], 400);
            }
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json(['error' => 'El correo electrónico no es válido'], 400);
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
                'duties'       => $duties,
                'workers'      => $workers,
                'chiefWorker'  => $chiefWorker,
                'date'         => $date,
            ]);

            $pdfContent = $pdf->output();
            $fileName   = "guardias-{$year}-{$month}-{$day}.pdf";

            Mail::to($email)->send(new MailableConfig(
                'GuardiApp',
                "Plantilla de guardias del {$day}/{$month}/{$year}",
                "Adjunto encontrarás la plantilla de guardias correspondiente al {$day}/{$month}/{$year}.",
                $pdfContent,
                $fileName
            ));

            return response()->json(['success' => 'PDF enviado correctamente a ' . $email]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al enviar el correo: ' . $e->getMessage()], 500);
        }
    }
}

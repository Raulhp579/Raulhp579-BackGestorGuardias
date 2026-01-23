<?php

namespace App\Http\Controllers;

use App\Models\Duty;
use App\Models\Speciality;
use App\Models\User;
use App\Models\Worker;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportExcelsController extends Controller
{
    // function to convert a string(date) to a date to export it to db
    public static function convertDate($date)
    {
        $date = str_replace('/', '-', $date);
        $timestamp = strtotime($date); //converts a date string into timestamp
        $convertDate = date('Y-m-d', $timestamp);

        return $convertDate;
    }

    public function associateSpeciality($rank){
        $specialities = Speciality::all();
        foreach($specialities as $speciality){
            if(str_contains($rank, $speciality->name)){
                return $speciality->id;
            }
        }
        return null;
    }

    // function to export the excel of workers to db
    public function importWorkers(Request $request)
    {
        try {
            $file = $request->file('file'); //the fetch mut contain the name file
            $tmpFile = IOFactory::load($file->getPathname());
            /* $tmpFile = IOFactory::load('excels/LISTADO_FACULTATIVOS_FICTICIO.xlsx'); */
            $sheet = $tmpFile->getSheet(0);
            $data = $sheet->toArray(null, true, true, true);
            $persons = [];
            $charges = [];
            $registrationsDate = [];

            foreach ($data as $person) {
                if ($person['B'] != null && ! str_contains($person['A'], 'NOMBRE')) {
                    if (str_contains($person['A'], '.')) {// to separate the rank and the name if the charge exists
                        $pieces = explode('.', $person['A']);
                        $persons[] = $pieces[0];
                        $charges[] = $pieces[1];
                        $registrationsDate[] = $this->convertDate($person['B']);
                        
                        
                    } else {
                        $pieces = explode('.', $person['A']);
                        $persons[] = $pieces[0];
                        $charges[] = null;
                        $registrationsDate[] = $this->convertDate($person['B']);
                        
                    }

                }
            }

            for ($i = 0; $i < count($persons); $i++) {
                $worker = new Worker;
                $worker->name = $persons[$i];
                $worker->rank = $charges[$i];
                $worker->id_speciality = $this->associateSpeciality($charges[$i]);
                $worker->registration_date = $registrationsDate[$i];
                $worker->save();
            }

            return response()->json(['success' => 'The workers has been exported']);

        } catch (Exception $e) {
            return response()->json(['error' => 'there is a problem to import the duties of the excel',
                'mistake' => $e->getMessage()]);
        }

    }



    // function to import the Duties
    // it need the month ,the year and the idSpeciality id of the front
    public function importDuties(Request $request)
    {
        try {
            $file = $request->file("file");
            $tmpFile = IOFactory::load($file->getPathname());
            /* $tmpFile = IOFactory::load('excels/DICIEMBRE2025_URGENCIAS.xlsx'); */
            $sheet = $tmpFile->getSheet(0);
            $data = $sheet->toArray(null, true, true, true);

            // dates to assoc the column of excel with the date
            $dates = [
                'D' => 1,
                'E' => 2,
                'F' => 3,
                'G' => 4,
                'H' => 5,
                'I' => 6,
                'J' => 7,
                'K' => 8,
                'L' => 9,
                'M' => 10,
                'N' => 11,
                'O' => 12,
                'P' => 13,
                'Q' => 14,
                'R' => 15,
                'S' => 16,
                'T' => 17,
                'U' => 18,
                'V' => 19,
                'W' => 20,
                'X' => 21,
                'Y' => 22,
                'Z' => 23,
                'AA' => 24,
                'AB' => 25,
                'AC' => 26,
                'AD' => 27,
                'AE' => 28,
                'AF' => 29,
                'AG' => 30,
                'AH' => 31,
            ];

            $Duties = [];

            $name = null;
            $type = null;
            foreach ($data as $value) {

                // Depurate the excel
                if (! str_contains($value['B'], 'GUARDIAS') && ! str_contains($value['B'], 'FACULTATIVO')) {
                    foreach ($value as $key => $v) {

                        if ($key == 'B' && $v != null) {
                            $name = $v;
                        }

                        if ($key == 'C') {
                            $type = $v;
                            $types[] = $v;
                        }

                        if ($key != 'B' && $v != null && $v == 'X') {
                            foreach ($dates as $k => $val) {
                                if ($key == $k) {
                                    $Duties[] = "$name . $type . $val ";
                                }
                            }
                        }
                    }
                }
            }
            $workers = [];
            $errors = [];
            foreach ($Duties as $duty) {
                $pieces = explode('.', $duty);


                if (str_contains($pieces[0], 'Dra')) {
                    $nameWithDra = explode(' ', $pieces[0]);

                    $name = $pieces[1];

                    /* for ($i = 1; $i < count($nameWithDra); $i++) {
                        $name = $name.' '.$nameWithDra[$i];
                    } */
                    

                    $type = $pieces[2];

                    // date
                    $day = trim($pieces[3], ' ');
                    

                } else {
                    
                    $name = $pieces[1];
                    
                    $type = $pieces[2];
                    // date
                    $day = trim($pieces[3], ' ');

                    
                }

                
                $dateWithoutFormat = $request->year.'-'.$request->month.'-'.$day;
                $date = Carbon::parse($dateWithoutFormat);

                /* $time = $this->calculateTime($type); */
                $idWorker = $this->associateIdUser($name);

                /* $workers[] = [
                    'idWorker' => $idWorker,
                    'type' => $type,
                    'speciality' => $request->speciality,//id
                    'date' => $date,
                    'time' => $time,
                ]; */

                if(!Duty::where("id",$request->idSpeciality)){
                    return response()->json(["error"=>"the speciality does not exists"]);
                }

                if(!is_int($idWorker)){
                    $errors[] = [
                        'Worker' => $idWorker,
                        'type' => trim($type),
                        'speciality' => $request->idSpeciality,
                        'date' => $date
                     ];
                }else{

                    $duty = new Duty();
                    $duty->date = $date;
                    $duty->duty_type = trim($type);
                    $duty->id_speciality = $request->idSpeciality;
                    $duty->id_worker = $idWorker;
                    //$duty->id_chief_worker = null;para despues
                    $duty->save();
                }
            }
            return response()->json([
                "success"=>"Duties has been exported",
                "Duties not exported"=>$errors
            ]);
           /*  return response()->json($workers); */
        } catch (Exception $e) {
            return response()->json(['error' => 'there is a problem to import the Duties of the excel',
                'mistake' => $e->getMessage()]);
        }
    }

    public function calculateTime($type)
    {
        if (str_contains($type, 'CA')) {
            return 5;
        } elseif (str_contains($type, 'PF')) {
            return 24;
        } elseif (str_contains($type, 'LOC')) {
            return 24;
        }
    }

    public function associateIdUser($name){
        /* $workers = Worker::where('id',23)->first();
        return strtoupper($workers->name); */
        $workers = Worker::all();
        $nameWithOutSpace = trim($name);
        
        
        foreach( $workers as $worker){
            if(str_contains(Str::upper($worker->name),Str::upper($nameWithOutSpace))){
                return $worker->id;
            }
        }

        
        return Str::upper($nameWithOutSpace);
        
    }



    
}

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
use Illuminate\Support\Facades\Validator;
use App\Enums\DutyType;

class ImportExcelsController extends Controller
{
    // function to convert a string(date) to a date to export it to db
    public static function convertDate($date)
    {
        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function validateWorkersImport(Request $request)
    {
        $rules = [
            'file' => 'required|file|mimes:xlsx,xls,ods'
        ];

        $messages = [
            'file.required' => 'the file is required',
            'file.file' => 'the file must be a valid file',
            'file.mimes' => 'the file must be an Excel file (xlsx, xls or ods)'
        ];

        return [$rules, $messages];
    }

    private function validateDutiesImport(Request $request)
    {
        $rules = [
            'file' => 'required|file|mimes:xlsx,xls,ods',
            'year' => 'required|digits:4|between:2000,3000',
            'month' => 'required|integer|min:1|max:12',
            'idSpeciality' => 'required|exists:speciality,id',
        ];

        $messages = [
            'file.required' => 'the file is required',
            'file.file' => 'the file must be a valid file',
            'file.mimes' => 'the file must be an Excel file (xlsx, xls or ods)',

            'year.required' => 'the year is required',
            'year.digits' => 'the year must have 4 digits',
            'year.between' => 'the year must be between 2000 and 3000',

            'month.required' => 'the month is required',
            'month.integer' => 'the month must be a number',
            'month.min' => 'the month must be between 1 and 12',
            'month.max' => 'the month must be between 1 and 12',

            'idSpeciality.required' => 'the speciality is required',
            'idSpeciality.exists' => 'the speciality does not exist',
        ];

        return [$rules, $messages];
    }

    public function associateSpeciality($rank)
    {
        if ($rank === null) {
            return null;
        }
        $specialities = Speciality::all();
        foreach ($specialities as $speciality) {
            if (str_contains($rank, $speciality->name)) {
                return $speciality->id;
            }
        }
        return null;
    }

    // function to export the excel of workers to db
    public function importWorkers(Request $request)
    {
        try {
            $validate = Validator::make($request->all(), $this->validateWorkersImport($request)[0], $this->validateWorkersImport($request)[1]);

            if ($validate->fails()) {
                return response()->json([
                    'error' => $validate->errors()->first(),
                ]);
            }

            $file = $request->file('file'); //the fetch mut contain the name file. COMENTAR ESTO PARA PROBAR
            $tmpFile = IOFactory::load($file->getPathname());
            /*             $tmpFile = IOFactory::load('excels/LISTADO DE FACULTATIVOS JEFATURAS DE GUARDIA.xlsx'); */
            $sheet = $tmpFile->getSheet(0);
            $data = $sheet->toArray(null, true, true, true);
            $persons = [];
            $charges = [];
            $registrationsDate = [];

            foreach ($data as $person) {
                if ($person['B'] != null && ! str_contains($person['A'], 'NOMBRE')) {
                    if (str_contains($person['A'], '.')) { // to separate the rank and the name if the charge exists
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
                $exists = Worker::where('name', $persons[$i])->first();
                if ($exists) {
                    continue;
                }
                $worker = new Worker;
                $worker->name = $persons[$i];
                $worker->rank = $charges[$i];
                $worker->id_speciality = $this->associateSpeciality($charges[$i]);
                $worker->registration_date = $registrationsDate[$i];
                $worker->save();
            }

            return response()->json(['success' => 'The workers has been exported']);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem to import the dutys of the excel',
                'mistake' => $e->getMessage()
            ]);
        }
    }



    // function to import the dutys
    // it need the month ,the year and the idspeciality id of the front
    public function importDutys(Request $request)
    {
        try {
            $validate = Validator::make($request->all(), $this->validateDutiesImport($request)[0], $this->validateDutiesImport($request)[1]);

            if ($validate->fails()) {
                return response()->json([
                    'error' => $validate->errors()->first(),
                ]);
            }

            // Ensure month is 2 digits for building dates
            $request->merge([
                'month' => str_pad((string) $request->month, 2, '0', STR_PAD_LEFT)
            ]);

            $file = $request->file("file");
            $tmpFile = IOFactory::load($file->getPathname());
            /* $tmpFile = IOFactory::load('excels/DICIEMBRE2025 ANESTESIA.ods'); */
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

            $dutys = [];

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
                                    $dutys[] = "$name . $type . $val ";
                                }
                            }
                        }
                    }
                }
            }
            $workers = [];
            $errors = [];

            foreach ($dutys as $duty) {
                $pieces = explode('.', $duty);

                if (str_contains($pieces[0], 'Dra')) {
                    $nameWithDra = explode(' ', $pieces[0]);

                    $name = '';

                    for ($i = 1; $i < count($nameWithDra); $i++) {
                        $name = $name . ' ' . $nameWithDra[$i];
                    }

                    $type = $pieces[1];
                    // date
                    $day = trim($pieces[2], ' ');
                } else {
                    $name = $pieces[1];
                    $type = $pieces[2];
                    // date
                    $day = trim($pieces[3], ' ');
                }

                $dateWithoutFormat = $request->year . '-' . $request->month . '-' . $day;

                try {
                    $date = Carbon::createStrict(
                        (int)$request->year,
                        (int)$request->month,
                        (int)$day,
                        0,
                        0,
                        0
                    );
                } catch (\Exception $e) {
                    $errors[] = [
                        'Worker' => $name ?? 'Unknown',
                        'type' => trim($type ?? ''),
                        'speciality' => $request->idSpeciality,
                        'date' => $dateWithoutFormat,
                        'error' => 'invalid date'
                    ];
                    continue;
                }

                /* $time = $this->calculateTime($type); */
                $idWorker = $this->associateIdUser($name);

                /* $workers[] = [
                    'idWorker' => $idWorker,
                    'type' => $type,
                    'speciality' => $request->speciality,//id
                    'date' => $date,
                    'time' => $time,
                ]; */

                if (!is_int($idWorker)) {
                    $errors[] = [
                        'Worker' => $idWorker,
                        'type' => trim($type),
                        'speciality' => $request->idSpeciality,
                        'date' => $date
                    ];
                } else {

                    $cleanType = trim($type);

                    // Validate duty type using enum values
                    if (
                        $cleanType != DutyType::CA->value &&
                        $cleanType != DutyType::PF->value &&
                        $cleanType != DutyType::LOC->value
                    ) {
                        $errors[] = [
                            'Worker' => $idWorker,
                            'type' => $cleanType,
                            'speciality' => $request->idSpeciality,
                            'date' => $date,
                            'error' => 'invalid duty type'
                        ];
                        continue;
                    }

                    // Avoid duplicates (same worker, date, speciality, duty type)
                    $exists = Duty::whereDate('date', $date)
                        ->where('id_speciality', $request->idSpeciality)
                        ->where('duty_type', $cleanType)
                        ->where('id_worker', $idWorker)
                        ->first();

                    if ($exists) {
                        continue;
                    }

                    $duty = new Duty();
                    $duty->date = $date;
                    $duty->duty_type = $cleanType;
                    $duty->id_speciality = $request->idSpeciality;
                    $duty->id_worker = $idWorker;
                    //$duty->id_chief_worker = null;para despues
                    $duty->save();
                }
            }
            return response()->json([
                "success" => "dutys has been exported",
                "dutys not exported" => $errors
            ]);
            /*  return response()->json($workers); */
        } catch (Exception $e) {
            return response()->json([
                'error' => 'there is a problem to import the dutys of the excel',
                'mistake' => $e->getMessage()
            ]);
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
        return 0;
    }
    //mirar falla en algunos nombres
    public function associateIdUser($name)
    {
        /* $workers = Worker::where('id',23)->first();
        return strtoupper($workers->name); */
        $workers = Worker::all();
        $nameWithOutSpace = trim($name);


        foreach ($workers as $worker) {
            if (str_contains(Str::upper($worker->name), Str::upper($nameWithOutSpace))) {
                return $worker->id;
            }
        }


        return Str::upper($nameWithOutSpace);
    }
}

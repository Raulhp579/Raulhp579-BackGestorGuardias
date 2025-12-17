<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportExcelsController extends Controller
{
    public function importWorkers(){
        try{
            $file = IOFactory::load('excels/LISTADO DE FACULTATIVOS JEFATURAS DE GUARDIA.xlsx');
            $sheet = $file->getSheet(0);
            $data = $sheet->toArray(null,true,true,true);
            $persons = [];
            $registrationsDate = [];
            
            foreach ($data as $person){    
                if($person['B']!=null && !str_contains($person['A'], "NOMBRE")){
                    $persons[] = $person['A'];
                    $registrationsDate[] = $person['B'];
                }
            }

            return response()->json(['persons'=>$persons,
                                        "registrationDate" => $registrationsDate]);

            

        }catch(Exception $e){
            return response()->json(['error'=> 'there is a problem to import the dutys of the excel',
                                        'mistake'=> $e->getMessage()]);
        }
        
    }


}

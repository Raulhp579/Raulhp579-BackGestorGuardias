<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportExcelsController extends Controller
{
    //function to convert a string(date) to a date to export it to db
    public static function convertDate($date){
        $timestamp = strtotime($date);
        $convertDate = date('Y-m-d', $timestamp);
        
        return $convertDate;
    }

    //function to export the excel of workers to db
    public function importWorkers(){
        try{
            $file = IOFactory::load('excels/LISTADO DE FACULTATIVOS JEFATURAS DE GUARDIA.xlsx');
            $sheet = $file->getSheet(0);
            $data = $sheet->toArray(null,true,true,true);
            $persons = [];
            $charges = [];
            $registrationsDate = [];
            
            foreach ($data as $person){    
                if($person['B']!=null && !str_contains($person['A'], "NOMBRE")){
                    if(str_contains($person["A"],".")){//to separate the rank and the name if the name exists
                        $pieces = explode(".", $person["A"]);
                        $persons[] = $pieces[0];
                        $charges[] = $pieces[1];
                        $registrationsDate[] = $this->convertDate($person['B']);
                    }else{
                        $pieces = explode(".", $person["A"]);
                        $persons[] = $pieces[0];
                        $charges[] = null;
                        $registrationsDate[] = $this->convertDate($person['B']);
                    }
                    
                    
                }
            }
            

            for($i =0 ; $i<count($persons); $i++){
                $worker = new Worker();
                $worker->name = $persons[$i];
                $worker->rank = $charges[$i];
                $worker->registration_date = $registrationsDate[$i];
                $worker->save();
            }

            return response()->json(["success"=>"The workers has been exported"]);
            

        }catch(Exception $e){
            return response()->json(['error'=> 'there is a problem to import the dutys of the excel',
                                        'mistake'=> $e->getMessage()]);
        }
        
    }


}

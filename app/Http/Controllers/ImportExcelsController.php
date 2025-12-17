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

    public function importDutys(){
        try{
            $file = IOFactory::load('excels/DICIEMBRE2025 ANESTESIA.ods');
            $sheet = $file->getSheet(0);
            $data = $sheet->toArray(null,true,true,true);
            $dates = [
                'D'=>1,
                'E'=>2,
                'F'=>3,
                'G'=>4,
                'H'=>5,
                'I'=>6,
                'J'=>7,
                'K'=>8,
                'L'=>9,
                'M'=>10,
                'N'=>11,
                'O'=>12,
                'P'=>13,
                'Q'=>14,
                'R'=>15,
                'S'=>16,
                'T'=>17,
                'U'=>18,
                'V'=>19,
                'W'=>20,
                'X'=>21,
                'Y'=>22,
                'Z'=>23,
                'AA'=>24,
                'AB'=>25,
                'AC'=>26,
                'AD'=>27,
                'AE'=>28,
                'AF'=>29,
                'AG'=>30,
                'AH'=>31
            ];

            /* $dutys = ["persona"=>[
                "CA"=>["dias"],
                "PF"=>["dias"],
                "LOC"=>["dias"]
            ]]; */

            $dutys = [];

            $contador =0;
            $nombre = null;

            foreach($data as $value){
                if($value['B']!=null && !str_contains($value['B'],'GUARDIAS') && !str_contains($value['B'],'FACULTATIVO')){
                    foreach($value as $key => $v){
                        /* if($contador == 2){
                            $contador = 0;
                        } */

                        if($key == 'B' && $contador==0){
                            $dutys[] = $v;
                            $nombre = $v;
                            
                        }
                        
                        if($key !='B' && $v!=null){
                            foreach($dates as $k => $val){
                                if($key == $k){
                                    $dutys[$nombre] = $val;
                                }
                            }
                        }

                        
                    }
                    /* $contador++; */
                    
                }
                
                
                
            }
return response()->json($dutys);    
        }catch(Exception $e){
            return response()->json(["error"=>"there is a problem to import the dutys of the excel",
                                        "mistake"=>$e->getMessage()]);
        }
    }


}

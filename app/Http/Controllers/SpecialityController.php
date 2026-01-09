<?php

namespace App\Http\Controllers;

use App\Models\Speciality;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SpecialityController extends Controller
{
    public function validate(){

        $rules = [
            "name"=>"required|min:3|max:20|string",
            "active"=>"boolean"
        ];

        $messages = [
            "name.required"=>"the name is required",
            "name.min"=>"the name must have minimun 3 characters",
            "name.max"=>"the name must have maximun 20 characters",
            "name.string"=>"the name must be a string",
            "active.boolean"=>"the name must be a boolean"
        ];

        return [$rules, $messages];
    }
    /**
     * return of all specialities.
     */
    public function index()
    {
        try{

            $specialities = Speciality::all();

            return response()->json($specialities);

        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem to show the specialities",
                "mistake"=>$e->getMessage()
            ]);
        }
    }

    /**
     * creation of a new speciality
     */
    public function store(Request $request)
    {
        try{
            $validate = Validator::make($request->all(),$this->validate()[0],$this->validate()[1]);

            if($validate->fails()){
                return response()->json([
                    "error"=>$validate->errors()->first()
                ]);
            }

            $speciality = new Speciality();
            $speciality->name = $request->name;
            $speciality->active = true;
            $speciality->save();

            return response()->json([
                "success"=>"the speciality has been created"
            ]);

        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem creating the specialitie",
                "mistake"=>$e->getMessage()
            ]);
        }
    }

    /**
     * show one speciality by id
     */
    public function show(string $id)
    {
        try{

            $speciality = Speciality::where("id",$id)->first();

            if(!$speciality){
                return response()->json([
                    "error"=>"the speciality does not exists"
                ]);
            }

            return response()->json($speciality);

        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem to show the specialitie",
                "mistake"=>$e->getMessage()
            ]);
        }
    }

    /**
     * Update the specified speciality by id.
     */
    public function update(Request $request, string $id)
    {
        try{

            $validate = Validator::make($request->all(),$this->validate()[0],$this->validate()[1]);

            if($validate->fails()){
                return response()->json([
                    "error"=>$validate->errors()->first()
                ]);
            }
            
           $speciality = Speciality::where("id",$id)->first();

            if(!$speciality){
                return response()->json([
                    "error"=>"the speciality does not exists"
                ]);
            }

            $speciality = new Speciality();
            $speciality->name = $request->name;
            $speciality->active = $request->active;
            $speciality->save();

            return response()->json([
                "success"=> "the speciality has been updated"
            ]);
        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem updating the specialities",
                "mistake"=>$e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified speciality by id.
     */
    public function destroy(string $id)
    {
        try{

            $speciality = Speciality::where("id",$id)->first();

            if(!$speciality){
                return response()->json([
                    "error"=>"the speciality does not exists"
                ]);
            }

            $speciality->delete();

            return response()->json([
                "success"=>"the speciality has been deleted"
            ]);

        }catch(Exception $e){
            return response()->json([
                "error"=>"there is a problem deleting the specialities",
                "mistake"=>$e->getMessage()
            ]);
        }   
    }
}

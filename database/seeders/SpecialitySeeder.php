<?php

namespace Database\Seeders;

use App\Models\Speciality;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SpecialitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ginecologia = new Speciality();
        $ginecologia->name = "GINECOLOGÍA";
        $ginecologia->active = true;
        $ginecologia->save();

        $urgencias = new Speciality();
        $urgencias->name = "URGENCIAS";
        $urgencias->active = true;
        $urgencias->save();

        $anestesia = new Speciality();
        $anestesia->name = "ANESTESIOLOGÍA";
        $anestesia->active = true;
        $anestesia->save();

        $interna = new Speciality();
        $interna->name = "MEDICINA INTERNA";
        $interna->active = true;
        $interna->save();

        $pediatria = new Speciality();
        $pediatria->name = "PEDIATRÍA";
        $pediatria->active = true;
        $pediatria->save();

        $radiologia = new Speciality();
        $radiologia->name = "RADIOLOGÍA";
        $radiologia->active = true;
        $radiologia->save();

        $cirugia = new Speciality();
        $cirugia->name = "CIRUGÍA GENERAL";
        $cirugia->active = true;
        $cirugia->save();

        $neumologia = new Speciality();
        $neumologia->name = "NEUMOLOGIA";
        $neumologia->active = true;
        $neumologia->save();

        $intensivos = new Speciality();
        $intensivos->name = "CUIDADOS INTENSIVOS";
        $intensivos->active = true;
        $intensivos->save();
        
    }
}

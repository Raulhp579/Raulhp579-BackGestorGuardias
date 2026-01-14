<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('duties', function (Blueprint $table) {
            $table->id();

            // Date of the duty
            $table->date('date');

            // Duty type 
            $table->string('duty_type'); // CA, PF, LOC

            // Speciality
            $table->unsignedBigInteger('id_speciality');
            $table->foreign('id_speciality')
                  ->references('id')
                  ->on('speciality');

            // Worker assigned to the duty (N:1)
            $table->unsignedBigInteger('id_worker');
            $table->foreign('id_worker')
                  ->references('id')
                  ->on('worker');
/*
             -------PARA DESPUES-------

            // Chief worker of the day (optional)
            $table->unsignedBigInteger('id_chief_worker')->nullable();
            $table->foreign('id_chief_worker')
                  ->references('id')
                  ->on('worker');

            
            
*/
        $table->timestamps();

            // Avoid duplicated duties for the same worker
            $table->unique([
                'date',
                'id_speciality',
                'duty_type',
                'id_worker'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duties');
    }
};
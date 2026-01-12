<?php

use App\Enums\DutyType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
 public function up(): void
{
    Schema::create('duties', function (Blueprint $table) {
        $table->id();

        $table->date('date');

        $table->string('duty_type'); // will store: CA / PF / LOC

        $table->unsignedBigInteger('id_speciality');
        $table->unsignedBigInteger('id_chief_worker')->nullable();

        $table->timestamps();

        // FKs
        $table->foreign('id_speciality')->references('id')->on('speciality');
        $table->foreign('id_chief_worker')->references('id')->on('worker');

        // Avoid duplicates per day + speciality + duty type
        $table->unique(['date', 'id_speciality', 'duty_type'], 'uq_duties_date_speciality_type');
    });
}
};
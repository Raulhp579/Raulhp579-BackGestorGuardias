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
        Schema::create('worker', function (Blueprint $table) {
            $table->id();
            $table->string("name");
            $table->string("rank")->nullable();
            $table->date("registration_date");
            $table->date("discharge_date")->nullable();
            $table->unsignedBigInteger("id_speciality")->nullable();
            $table->timestamps();

            $table->foreign("id_speciality")->on('speciality')->references("id");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker');
    }
};

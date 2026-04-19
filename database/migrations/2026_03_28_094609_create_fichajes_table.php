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
        Schema::create('fichajes', function (Blueprint $table) {
            $table->id();
            $table->dateTime("date_time");
            $table->boolean("type");
            $table->unsignedBigInteger("worker_id");
            $table->unsignedBigInteger("id_duty");
            $table->timestamps();

            $table->foreign('worker_id')->references('id')->on('worker')->onDelete('cascade');
            $table->foreign('id_duty')->references('id')->on('duties')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fichajes');
    }
};

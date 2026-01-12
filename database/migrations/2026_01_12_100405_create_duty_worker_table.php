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
    Schema::create('duty_worker', function (Blueprint $table) {
        $table->unsignedBigInteger('duty_id');
        $table->unsignedBigInteger('worker_id');

        $table->primary(['duty_id', 'worker_id']);

        $table->foreign('duty_id')->references('id')->on('duties')->onDelete('cascade');
        $table->foreign('worker_id')->references('id')->on('worker')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
{
    Schema::dropIfExists('duty_worker');
}
};

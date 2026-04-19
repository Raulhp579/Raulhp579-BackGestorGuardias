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
        Schema::create('duty_swaps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_duty_from');
            $table->unsignedBigInteger('id_duty_to');
            $table->unsignedBigInteger('id_worker_requester');
            $table->unsignedBigInteger('id_worker_target');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'approved', 'declined'])->default('pending');
            $table->unsignedBigInteger('id_chief_approver')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->foreign('id_duty_from')->references('id')->on('duties')->onDelete('cascade');
            $table->foreign('id_duty_to')->references('id')->on('duties')->onDelete('cascade');
            $table->foreign('id_worker_requester')->references('id')->on('worker')->onDelete('cascade');
            $table->foreign('id_worker_target')->references('id')->on('worker')->onDelete('cascade');
            $table->foreign('id_chief_approver')->references('id')->on('worker')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('duty_swaps');
    }
};

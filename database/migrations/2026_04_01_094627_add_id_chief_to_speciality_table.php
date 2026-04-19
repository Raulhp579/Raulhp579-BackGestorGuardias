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
        Schema::table('speciality', function (Blueprint $table) {
            $table->unsignedBigInteger('id_chief')->nullable()->after('active');
            $table->foreign('id_chief')->references('id')->on('worker')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('speciality', function (Blueprint $table) {
            $table->dropForeign(['id_chief']);
            $table->dropColumn('id_chief');
        });
    }
};

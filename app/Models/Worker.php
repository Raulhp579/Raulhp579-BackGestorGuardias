<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $table = "worker";
    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'rank',
        'registration_date',
        'discharge_date',
        'id_speciality'
    ];

    public function duties()
    {
        return $this->belongsToMany(
            \App\Models\Duty::class,
            'duty_worker',
            'worker_id',
            'duty_id'
        );
    }
}

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
       return $this->hasMany(Duty::class, 'id_worker');
    }
}

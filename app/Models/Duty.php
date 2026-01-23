<?php

namespace App\Models;

use App\Enums\DutyType;
use Illuminate\Database\Eloquent\Model;

class Duty extends Model
{
    protected $table = 'duties';
    protected $primaryKey = 'id';

    protected $fillable = [
        'date',
        'duty_type',
        'id_speciality',
        'id_worker',
        'id_chief_worker',
    ];

    protected $casts = [
        'duty_type' => DutyType::class,
    ];


    // Each duty row belongs to ONE worker
    public function worker()
    {
        return $this->belongsTo(Worker::class, 'id_worker');
    }

    // Chief worker (optional)
    public function chiefWorker()
    {
        return $this->belongsTo(Worker::class, 'id_chief_worker');
    }
}

<?php

namespace App\Models;

use App\Enums\DutyType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Duty extends Model
{
    protected $table = 'duties';

    protected $fillable = [
        'date',
        'duty_type',
        'id_speciality',
        'id_chief_worker',
    ];

    protected $casts = [
        'date' => 'date',
        'duty_type' => DutyType::class,
    ];

    //FALTA MODELO SPECIALITY!!!!!!!!!!!<----------------------------------------

    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class, 'id_speciality');
    }

    public function chiefWorker(): BelongsTo
    {
        return $this->belongsTo(Worker::class, 'id_chief_worker');
    }

    // We will create the pivot table in the next step
    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(Worker::class, 'duty_worker', 'duty_id', 'worker_id');
    }

    public function hours(): int
    {
        return $this->duty_type->hours();
    }
}
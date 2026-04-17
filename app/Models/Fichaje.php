<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fichaje extends Model
{
    protected $table = "fichajes";
    protected $primaryKey = "id";
    protected $fillable = [
        "date_time",
        "type",
        "worker_id",
        "id_duty",
        "latitude",
        "longitude",
    ];

    public function worker()
    {
        return $this->belongsTo(Worker::class, 'worker_id');
    }

    public function duty()
    {
        return $this->belongsTo(Duty::class, 'id_duty');
    }
}

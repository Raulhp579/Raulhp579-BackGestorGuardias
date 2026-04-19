<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DutySwap extends Model
{
    use HasFactory;

    protected $fillable = [
        'id_duty_from',
        'id_duty_to',
        'id_worker_requester',
        'id_worker_target',
        'status',
        'id_chief_approver',
        'comments',
    ];

    public function dutyFrom()
    {
        return $this->belongsTo(Duty::class, 'id_duty_from');
    }

    public function dutyTo()
    {
        return $this->belongsTo(Duty::class, 'id_duty_to');
    }

    public function requester()
    {
        return $this->belongsTo(Worker::class, 'id_worker_requester');
    }

    public function target()
    {
        return $this->belongsTo(Worker::class, 'id_worker_target');
    }

    public function chiefApprover()
    {
        return $this->belongsTo(Worker::class, 'id_chief_approver');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Speciality extends Model
{
    use HasFactory;
    protected $table = "speciality";
    protected $primaryKey = 'id';
    protected $fillable = [
        "name",
        "active",
        "id_chief"
    ]; 

    public function workers()
    {
        return $this->hasMany(Worker::class, 'id_speciality');
    }

    public function chief()
    {
        return $this->belongsTo(Worker::class, 'id_chief');
    }

    protected function casts(): array
    {
        return [
            'name' => 'string',
            'active' => 'boolean',
        ];
    }
}

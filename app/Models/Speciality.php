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
        "active"
    ]; 

    protected function casts(): array
    {
        return [
            'name' => 'string',
            'active' => 'boolean',
        ];
    }
}

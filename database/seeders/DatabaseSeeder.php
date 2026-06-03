<?php

namespace Database\Seeders;

use App\Models\Duty;
use App\Models\User;
use App\Enums\DutyType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Ejecutar seeder de especialidades primero
        $this->call(SpecialitySeeder::class);
        $direccionMedica = \App\Models\Speciality::where('name', 'DIRECCIÓN MÉDICA')->first();
        $dirId = $direccionMedica ? $direccionMedica->id : 1;

        // 2. Crear roles
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'empleado']);

        // 3. Crear usuarios con sus respectivos trabajadores vinculados (Todos en Dirección Médica)
        
        // ADMIN 1
        $w1 = \App\Models\Worker::create([
            'name' => 'Santo Tomás',
            'rank' => 'Director',
            'registration_date' => now(),
            'id_speciality' => $dirId
        ]);
        User::factory()->create([
            'name' => $w1->name,
            'email' => 'santotomas@alu.medac.es',
            'password' => Hash::make('12345'),
            'worker_id' => $w1->id,
        ])->assignRole('admin');

        // ADMIN 2
        $w2 = \App\Models\Worker::create([
            'name' => 'Javier Ruiz',
            'rank' => 'Coordinador',
            'registration_date' => now(),
            'id_speciality' => $dirId
        ]);
        User::factory()->create([
            'name' => $w2->name,
            'email' => 'javier.ruiz@doc.medac.es',
            'password' => Hash::make('password'),
            'worker_id' => $w2->id,
        ])->assignRole('admin');

        // EMPLEADO 1
        $w3 = \App\Models\Worker::create([
            'name' => 'Usuario1',
            'rank' => 'Gestor',
            'registration_date' => now(),
            'id_speciality' => $dirId
        ]);
        User::factory()->create([
            'name' => $w3->name,
            'email' => 'usuario1@alu.medac.es',
            'password' => Hash::make('password'),
            'worker_id' => $w3->id,
        ])->assignRole('empleado');

        // EMPLEADO 2
        $w4 = \App\Models\Worker::create([
            'name' => 'Usuario2',
            'rank' => 'Administrativo',
            'registration_date' => now(),
            'id_speciality' => $dirId
        ]);
        User::factory()->create([
            'name' => $w4->name,
            'email' => 'usuario2@alu.medac.es',
            'password' => Hash::make('password'),
            'worker_id' => $w4->id,
        ])->assignRole('empleado');

        // 4. Crear 2 guardias por cada trabajador, con días distintos
        $workers = [
            ['worker' => $w1, 'dates' => ['2026-06-05', '2026-06-12'], 'types' => [DutyType::CA,  DutyType::PF]],
            ['worker' => $w2, 'dates' => ['2026-06-06', '2026-06-13'], 'types' => [DutyType::PF,  DutyType::LOC]],
            ['worker' => $w3, 'dates' => ['2026-06-07', '2026-06-14'], 'types' => [DutyType::LOC, DutyType::CA]],
            ['worker' => $w4, 'dates' => ['2026-06-08', '2026-06-15'], 'types' => [DutyType::CA,  DutyType::LOC]],
        ];

        foreach ($workers as $entry) {
            foreach ([0, 1] as $i) {
                Duty::create([
                    'date'            => $entry['dates'][$i],
                    'duty_type'       => $entry['types'][$i],
                    'id_speciality'   => $dirId,
                    'id_worker'       => $entry['worker']->id,
                    'id_chief_worker' => $w1->id,
                ]);
            }
        }
    }
}

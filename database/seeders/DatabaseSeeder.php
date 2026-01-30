<?php

namespace Database\Seeders;

use App\Models\User;
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
        // User::factory(10)->create();

        /* User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);  */
        Role::create(["name"=>"admin"]);
        Role::create(["name"=>"empleado"]);
        User::factory()->create([
            'name' => 'Santo Tomás',
            'email' => 'santotomas@alu.medac.es',
            'password'=>Hash::make('12345')
        ])->assignRole('admin');

        User::factory()->create([
            'name' => 'Javier Ruiz',
            'email' => 'javier.ruiz@doc.medac.es',
            'password'=>Hash::make('password')
        ])->assignRole('admin');

        User::factory()->create([
            'name' => 'Usuario1',
            'email' => 'usuario1@alu.medac.es',
            'password'=>Hash::make('password')
        ])->assignRole('empleado');

        User::factory()->create([
            'name' => 'Usuario2',
            'email' => 'usuario2@alu.medac.es',
            'password'=>Hash::make('password')
        ])->assignRole('empleado');

        User::factory()->create([
            'name' => 'Beatriz Ortega Ortega',
            'email' => 'beatriz.ortega@alu.medac.es',
            'worker_id'=>null,
            'avatarUrl'=>'assets/imgs/150.jpg',
            'password'=>Hash::make('password')
        ])->assignRole('empleado');
        

        $this->call(SpecialitySeeder::class); 
        
    }
}

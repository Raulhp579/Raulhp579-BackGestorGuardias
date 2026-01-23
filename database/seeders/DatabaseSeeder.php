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
        ]); */
        /* Role::create(["name"=>"admin"]);
        User::factory()->create([
            'name' => 'Santo Tomás',
            'email' => 'santotomas@gmail.com',
            'password'=>Hash::make('12345')
        ])->assignRole('admin');
        $this->call(SpecialitySeeder::class); */
        
    }
}

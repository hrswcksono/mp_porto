<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdminRole = Role::where('slug', 'super_admin')->first();
        $adminRole = Role::where('slug', 'admin')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $memberRole = Role::where('slug', 'member')->first();
        $clientRole = Role::where('slug', 'client')->first();

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+62812345678',
                'bio' => 'System Super Administrator',
                'timezone' => 'Asia/Jakarta',
                'language' => 'id',
                'role_id' => $superAdminRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+62812345679',
                'bio' => 'System Administrator',
                'timezone' => 'Asia/Jakarta',
                'language' => 'id',
                'role_id' => $adminRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Project Manager',
                'email' => 'manager@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+62812345680',
                'bio' => 'Project Manager',
                'timezone' => 'Asia/Jakarta',
                'language' => 'id',
                'role_id' => $managerRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Team Member',
                'email' => 'member@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+62812345681',
                'bio' => 'Team Member',
                'timezone' => 'Asia/Jakarta',
                'language' => 'id',
                'role_id' => $memberRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Client User',
                'email' => 'client@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+62812345682',
                'bio' => 'External Client',
                'timezone' => 'Asia/Jakarta',
                'language' => 'id',
                'role_id' => $clientRole?->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}

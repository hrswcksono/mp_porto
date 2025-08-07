<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'Full system access with all permissions',
                'permissions' => [
                    'users.create', 'users.read', 'users.update', 'users.delete',
                    'projects.create', 'projects.read', 'projects.update', 'projects.delete',
                    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
                    'teams.create', 'teams.read', 'teams.update', 'teams.delete',
                    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
                    'system.settings', 'system.reports'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Administrative access with most permissions',
                'permissions' => [
                    'users.create', 'users.read', 'users.update',
                    'projects.create', 'projects.read', 'projects.update', 'projects.delete',
                    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
                    'teams.create', 'teams.read', 'teams.update', 'teams.delete',
                    'system.reports'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Project and team management permissions',
                'permissions' => [
                    'projects.create', 'projects.read', 'projects.update',
                    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
                    'teams.read', 'teams.update',
                    'users.read'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Member',
                'slug' => 'member',
                'description' => 'Standard user with basic permissions',
                'permissions' => [
                    'projects.read',
                    'tasks.create', 'tasks.read', 'tasks.update',
                    'teams.read',
                    'users.read'
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Client',
                'slug' => 'client',
                'description' => 'Limited access for external clients',
                'permissions' => [
                    'projects.read',
                    'tasks.read',
                    'comments.create', 'comments.read'
                ],
                'is_active' => true,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }
}

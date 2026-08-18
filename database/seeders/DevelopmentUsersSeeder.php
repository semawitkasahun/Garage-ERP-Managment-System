<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\UserRole;

class DevelopmentUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPassword = 'password123';
        $branchId = 1;

        // Define users with their roles
        $users = [
            [
                'username' => 'owner',
                'email' => 'owner@garage.com',
                'role' => 'Owner',
                'employee_id' => null,
            ],
            [
                'username' => 'admin',
                'email' => 'admin@garage.com',
                'role' => 'Admin',
                'employee_id' => null,
            ],
            [
                'username' => 'supervisor',
                'email' => 'supervisor@garage.com',
                'role' => 'Supervisor',
                'employee_id' => null,
            ],
            [
                'username' => 'finance',
                'email' => 'finance@garage.com',
                'role' => 'Finance',
                'employee_id' => null,
            ],
            [
                'username' => 'hrmanager',
                'email' => 'hrmanager@garage.com',
                'role' => 'HR Manager',
                'employee_id' => null,
            ],
            [
                'username' => 'technician',
                'email' => 'technician@garage.com',
                'role' => 'Technician',
                'employee_id' => null,
            ],
            [
                'username' => 'customer',
                'email' => 'customer@garage.com',
                'role' => 'Customer',
                'employee_id' => null,
            ],
        ];

        foreach ($users as $userData) {
            // Check if user exists by username
            $existingUser = User::where('username', $userData['username'])->first();
            
            if ($existingUser) {
                // Update existing user
                $existingUser->update([
                    'email' => $userData['email'],
                    'password_hash' => bcrypt($defaultPassword),
                    'branch_id' => $branchId,
                    'is_active' => true,
                ]);
                $user = $existingUser;
            } else {
                // Create new user
                $user = User::create([
                    'username' => $userData['username'],
                    'email' => $userData['email'],
                    'password_hash' => bcrypt($defaultPassword),
                    'branch_id' => $branchId,
                    'is_active' => true,
                ]);
            }

            // Get or create role
            $role = Role::firstOrCreate(
                ['name' => $userData['role']],
                ['description' => $userData['role'] . ' role']
            );

            // Assign role to user
            UserRole::updateOrCreate(
                ['user_id' => $user->user_id],
                ['role_id' => $role->role_id]
            );

            $this->command->info("Created/Updated user: {$userData['username']} ({$userData['role']})");
        }

        $this->command->info('Development users created successfully.');
        $this->command->info('Default password for all users: password123');
    }
}

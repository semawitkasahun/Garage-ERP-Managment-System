<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Get or create branch
        $branch = $this->getBranch();

        // Create 4 Core Users with phone numbers
        $this->createUser($branch, 'Owner', 'owner@garage.com', 'Owner@123', 'System', 'Owner', '0911-111-111');
        $this->createUser($branch, 'Admin', 'admin@garage.com', 'Admin@123', 'System', 'Administrator', '0911-222-222');
        $this->createUser($branch, 'Supervisor', 'supervisor@garage.com', 'Supervisor@123', 'HR', 'Supervisor', '0911-333-333');
        $this->createUser($branch, 'Technician', 'technician@garage.com', 'Technician@123', 'Bob', 'Technician', '0911-444-444');

        $this->command->info('✅ 4 Core users created successfully!');
        $this->command->info('📋 Login credentials:');
        $this->command->info('  👑 Owner: owner@garage.com / Owner@123');
        $this->command->info('  🔧 Admin: admin@garage.com / Admin@123');
        $this->command->info('  📋 Supervisor: supervisor@garage.com / Supervisor@123');
        $this->command->info('  🔩 Technician: technician@garage.com / Technician@123');
    }

    private function getBranch()
    {
        $branch = Branch::first();
        if (!$branch) {
            $branch = Branch::create([
                'name' => 'Main Garage',
                'code' => 'MG001',
                'address' => '123 Main Street, City',
                'phone' => '123-456-7890',
                'email' => 'info@garage.com',
                'is_active' => true,
            ]);
        }
        return $branch;
    }

    private function createUser($branch, $roleName, $email, $password, $firstName, $lastName, $phone)
    {
        // Get or create role
        $role = Role::where('name', $roleName)->first();
        if (!$role) {
            $role = Role::create([
                'name' => $roleName,
                'description' => $roleName . ' role',
            ]);
        }

        // Delete existing user with same email
        User::where('email', $email)->delete();

        // Create employee with ALL required fields
        $employee = Employee::create([
            'branch_id' => $branch->branch_id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'job_title' => $roleName,
            'employment_status' => 'active',
            'phone' => $phone, // ✅ Required field - provide a value
            'email' => $email,
            'hire_date' => now()->toDateString(),
        ]);

        // Create user
        $user = User::create([
            'username' => strtolower($roleName),
            'email' => $email,
            'password_hash' => Hash::make($password),
            'employee_id' => $employee->employee_id,
            'branch_id' => $branch->branch_id,
            'is_active' => true,
        ]);

        // Assign role
        $user->roles()->attach($role->role_id);

        return $user;
    }
}
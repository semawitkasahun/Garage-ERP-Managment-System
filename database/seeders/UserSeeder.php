<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Get or create branch
        $branch = $this->getBranch();

        // Create Core Staff Users
        $this->createUser($branch, 'Owner',      'owner@garage.com',      'Owner@123',      'System', 'Owner',      '0911-111-111');
        $this->createUser($branch, 'Admin',      'admin@garage.com',      'Admin@123',      'System', 'Administrator', '0911-222-222');
        $this->createUser($branch, 'Supervisor', 'supervisor@garage.com', 'Supervisor@123', 'HR',     'Supervisor', '0911-333-333');
        $this->createUser($branch, 'Finance',    'finance@garage.com',    'Finance@123',    'Sara',   'Finance',    '0911-555-555');
        $this->createUser($branch, 'HR Manager', 'hrmanager@garage.com',  'HRManager@123',  'John',   'HRManager',  '0911-666-666');
        $this->createUser($branch, 'Technician', 'technician@garage.com', 'Technician@123', 'Bob',    'Technician', '0911-444-444');
        $this->createCustomerUser($branch);

        $this->command->info('✅ 7 Core users created successfully!');
        $this->command->info('📋 Login credentials:');
        $this->command->info('  👑 Owner:      owner@garage.com      / Owner@123');
        $this->command->info('  🔧 Admin:      admin@garage.com      / Admin@123');
        $this->command->info('  📋 Supervisor: supervisor@garage.com / Supervisor@123');
        $this->command->info('  💰 Finance:    finance@garage.com    / Finance@123');
        $this->command->info('  🧑‍💼 HR Manager: hrmanager@garage.com  / HRManager@123');
        $this->command->info('  🔩 Technician: technician@garage.com / Technician@123');
        $this->command->info('  🧑 Customer:   customer@garage.com   / Customer@123');
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

        // If the user already exists, just update their password and role
        // (do NOT delete — could violate FK constraints on tables like appointments)
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $existingUser->update([
                'password_hash' => Hash::make($password),
                'is_active'     => true,
            ]);
            $existingUser->roles()->syncWithoutDetaching([$role->role_id]);
            return $existingUser;
        }

        // Create employee with ALL required fields
        $employee = Employee::create([
            'branch_id'         => $branch->branch_id,
            'first_name'        => $firstName,
            'last_name'         => $lastName,
            'job_title'         => $roleName,
            'employment_status' => 'active',
            'phone'             => $phone,
            'email'             => $email,
            'hire_date'         => now()->toDateString(),
        ]);

        // Create user
        $user = User::create([
            'username'      => strtolower($roleName),
            'email'         => $email,
            'password_hash' => Hash::make($password),
            'employee_id'   => $employee->employee_id,
            'branch_id'     => $branch->branch_id,
            'is_active'     => true,
        ]);

        // Assign role
        $user->roles()->attach($role->role_id);

        return $user;
    }

    private function createCustomerUser($branch)
    {
        $email    = 'customer@garage.com';
        $password = 'Customer@123';

        // Get or create the Customer role
        $role = Role::where('name', 'Customer')->first();
        if (!$role) {
            $role = Role::create([
                'name'        => 'Customer',
                'description' => 'Customer portal access',
            ]);
        }

        // If user already exists just update password
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $existingUser->update([
                'password_hash' => Hash::make($password),
                'is_active'     => true,
            ]);
            $existingUser->roles()->syncWithoutDetaching([$role->role_id]);
            return $existingUser;
        }

        // Create the customer record
        $customer = Customer::create([
            'first_name'    => 'Demo',
            'last_name'     => 'Customer',
            'email'         => $email,
            'phone'         => '0911-555-555',
            'customer_type' => 'individual',
            'segment'       => 'regular',
            'branch_id'     => $branch->branch_id,
            'opt_in_email'  => true,
            'opt_in_sms'    => false,
        ]);

        // Create the linked user account
        $user = User::create([
            'username'      => 'customer',
            'email'         => $email,
            'password_hash' => Hash::make($password),
            'branch_id'     => $branch->branch_id,
            'is_active'     => true,
            // employee_id is nullable — customers are not employees
        ]);

        $user->roles()->attach($role->role_id);

        return $user;
    }
}
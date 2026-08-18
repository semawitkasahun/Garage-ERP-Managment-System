<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\UserRole;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'username' => 'admin',
            'email' => 'admin@garage-erp.com',
            'password_hash' => bcrypt('admin123'),
            'branch_id' => 1,
            'is_active' => true,
        ]);

        // Get or create Admin role
        $adminRole = Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'System Administrator']
        );

        // Assign admin role to user
        UserRole::create([
            'user_id' => $admin->user_id,
            'role_id' => $adminRole->role_id,
        ]);

        $this->command->info('Admin user created successfully.');
        $this->command->info('Username: admin');
        $this->command->info('Password: admin123');
    }
}

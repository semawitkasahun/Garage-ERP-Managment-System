<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Create permissions
        $permissions = [
            // Super Admin / Owner - Full access
            ['module' => 'Owner', 'action' => 'full'],
            
            // Admin
            ['module' => 'Admin', 'action' => 'full'],
            
            // HR / Supervisor
            ['module' => 'HR', 'action' => 'view'],
            ['module' => 'HR', 'action' => 'create'],
            ['module' => 'HR', 'action' => 'edit'],
            ['module' => 'HR', 'action' => 'delete'],
            
            // CRM
            ['module' => 'CRM', 'action' => 'view'],
            ['module' => 'CRM', 'action' => 'create'],
            ['module' => 'CRM', 'action' => 'edit'],
            ['module' => 'CRM', 'action' => 'delete'],
            
            // Service
            ['module' => 'Service', 'action' => 'view'],
            ['module' => 'Service', 'action' => 'create'],
            ['module' => 'Service', 'action' => 'edit'],
            ['module' => 'Service', 'action' => 'delete'],
            ['module' => 'Service', 'action' => 'approve'],
            
            // Inventory
            ['module' => 'Inventory', 'action' => 'view'],
            ['module' => 'Inventory', 'action' => 'create'],
            ['module' => 'Inventory', 'action' => 'edit'],
            ['module' => 'Inventory', 'action' => 'delete'],
            ['module' => 'Inventory', 'action' => 'adjust'],
            
            // Billing
            ['module' => 'Billing', 'action' => 'view'],
            ['module' => 'Billing', 'action' => 'create'],
            ['module' => 'Billing', 'action' => 'edit'],
            ['module' => 'Billing', 'action' => 'delete'],
            ['module' => 'Billing', 'action' => 'approve'],
            
            // Reports
            ['module' => 'Reports', 'action' => 'view'],
            ['module' => 'Reports', 'action' => 'generate'],
            ['module' => 'Reports', 'action' => 'export'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate($permission);
        }

        // Create roles
        $roles = [
            [
                'name' => 'Owner',
                'description' => 'Full system ownership and control',
                'level' => 1, // Highest level
            ],
            [
                'name' => 'Admin',
                'description' => 'System administrator',
                'level' => 2,
            ],
            [
                'name' => 'Supervisor',
                'description' => 'HR and operations supervisor',
                'level' => 3,
            ],
            [
                'name' => 'Manager',
                'description' => 'Department manager',
                'level' => 4,
            ],
            [
                'name' => 'Technician',
                'description' => 'Perform repairs and service',
                'level' => 5,
            ],
            [
                'name' => 'Service Advisor',
                'description' => 'Handle customers and appointments',
                'level' => 5,
            ],
            [
                'name' => 'Accountant',
                'description' => 'Financial management',
                'level' => 4,
            ],
            [
                'name' => 'Parts Manager',
                'description' => 'Parts inventory management',
                'level' => 4,
            ],
            [
                'name' => 'Employee',
                'description' => 'Regular staff',
                'level' => 5,
            ],
            [
                'name' => 'Viewer',
                'description' => 'Read-only access',
                'level' => 6,
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                [
                    'description' => $roleData['description'],
                    'level' => $roleData['level'],
                ]
            );
        }

        // Assign permissions to roles
        $this->assignPermissions();
    }

    private function assignPermissions()
    {
        // Owner - All permissions
        $owner = Role::where('name', 'Owner')->first();
        $allPermissions = Permission::all();
        $owner->permissions()->sync($allPermissions->pluck('permission_id'));

        // Admin - Almost all except Owner
        $admin = Role::where('name', 'Admin')->first();
        $adminPermissions = Permission::where('module', '!=', 'Owner')->get();
        $admin->permissions()->sync($adminPermissions->pluck('permission_id'));

        // Supervisor - HR + view permissions
        $supervisor = Role::where('name', 'Supervisor')->first();
        $supervisorPermissions = Permission::whereIn('module', ['HR', 'CRM', 'Reports'])
            ->whereNotIn('action', ['delete'])
            ->get();
        $supervisor->permissions()->sync($supervisorPermissions->pluck('permission_id'));

        // Manager - Department management
        $manager = Role::where('name', 'Manager')->first();
        $managerPermissions = Permission::whereIn('module', ['Service', 'Inventory', 'CRM'])
            ->whereNotIn('action', ['delete', 'approve'])
            ->get();
        $manager->permissions()->sync($managerPermissions->pluck('permission_id'));

        // Technician - Service + Inventory view
        $technician = Role::where('name', 'Technician')->first();
        $techPermissions = Permission::whereIn('module', ['Service', 'Inventory'])
            ->whereIn('action', ['view', 'create', 'edit'])
            ->get();
        $technician->permissions()->sync($techPermissions->pluck('permission_id'));

        // Service Advisor - CRM + Service
        $sa = Role::where('name', 'Service Advisor')->first();
        $saPermissions = Permission::whereIn('module', ['CRM', 'Service', 'Billing'])
            ->whereIn('action', ['view', 'create', 'edit'])
            ->get();
        $sa->permissions()->sync($saPermissions->pluck('permission_id'));

        // Employee - Basic access
        $employee = Role::where('name', 'Employee')->first();
        $employeePermissions = Permission::whereIn('module', ['Service', 'CRM'])
            ->where('action', 'view')
            ->get();
        $employee->permissions()->sync($employeePermissions->pluck('permission_id'));

        // Viewer - Read-only
        $viewer = Role::where('name', 'Viewer')->first();
        $viewerPermissions = Permission::whereIn('action', ['view'])
            ->whereNotIn('module', ['Owner'])
            ->get();
        $viewer->permissions()->sync($viewerPermissions->pluck('permission_id'));
    }
}
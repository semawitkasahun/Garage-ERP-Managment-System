<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bay;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AppointmentTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Branch
        $branch = Branch::first();
        if (!$branch) {
            $branch = Branch::create([
                'name' => 'Main Garage',
                'code' => 'MG001',
                'address' => '123 Main Street, City',
                'phone' => '0911-000-000',
                'email' => 'info@garage.com',
                'is_active' => true,
            ]);
        }

        // 2. Bays
        $bay1 = Bay::firstOrCreate(['branch_id' => $branch->branch_id, 'name' => 'Bay 1'], ['bay_type' => 'Standard', 'is_active' => true]);
        $bay2 = Bay::firstOrCreate(['branch_id' => $branch->branch_id, 'name' => 'Bay 2'], ['bay_type' => 'Standard', 'is_active' => true]);
        $bay3 = Bay::firstOrCreate(['branch_id' => $branch->branch_id, 'name' => 'Bay 3'], ['bay_type' => 'Lifting', 'is_active' => true]);
        $bay4 = Bay::firstOrCreate(['branch_id' => $branch->branch_id, 'name' => 'Bay 4'], ['bay_type' => 'Diagnostic', 'is_active' => true]);

        // 3. Role
        $role = Role::firstOrCreate(['name' => 'Technician'], ['description' => 'Technician role']);

        // 4. Technicians
        $techs = [
            ['first' => 'Samuel', 'last' => 'Alemu', 'email' => 'samuel.alemu@garage.com', 'username' => 'samuel_alemu', 'phone' => '0911-201-101'],
            ['first' => 'Kaleb', 'last' => 'Yonas', 'email' => 'kaleb.yonas@garage.com', 'username' => 'kaleb_yonas', 'phone' => '0911-202-202'],
            ['first' => 'Bob', 'last' => 'Technician', 'email' => 'technician@garage.com', 'username' => 'technician', 'phone' => '0911-444-444'],
        ];

        $techUsers = [];
        foreach ($techs as $t) {
            $user = User::where('email', $t['email'])->first();
            if (!$user) {
                $employee = Employee::create([
                    'branch_id' => $branch->branch_id,
                    'first_name' => $t['first'],
                    'last_name' => $t['last'],
                    'job_title' => 'Technician',
                    'employment_status' => 'active',
                    'phone' => $t['phone'],
                    'email' => $t['email'],
                    'hire_date' => now()->toDateString(),
                ]);

                $user = User::create([
                    'username' => $t['username'],
                    'email' => $t['email'],
                    'password_hash' => Hash::make('Technician@123'),
                    'employee_id' => $employee->employee_id,
                    'branch_id' => $branch->branch_id,
                    'is_active' => true,
                ]);

                $user->roles()->attach($role->role_id);
            }
            $techUsers[$t['first']] = $user;
        }

        // 5. Customers
        $customerData = [
            ['first_name' => 'Dawit', 'last_name' => 'Bekele', 'email' => 'dawit@example.com', 'phone' => '0911-123-456'],
            ['first_name' => 'Hanna', 'last_name' => 'Girma', 'email' => 'hanna@example.com', 'phone' => '0911-987-654'],
            ['first_name' => 'Mulugeta', 'last_name' => 'Tesfaye', 'email' => 'mulugeta@example.com', 'phone' => '0911-456-789'],
            ['first_name' => 'Fanuel', 'last_name' => 'Mekonnen', 'email' => 'fanuel@example.com', 'phone' => '0911-111-222'],
        ];

        $customers = [];
        foreach ($customerData as $c) {
            $customer = Customer::firstOrCreate(
                ['email' => $c['email']],
                [
                    'first_name' => $c['first_name'],
                    'last_name' => $c['last_name'],
                    'phone' => $c['phone'],
                    'customer_type' => 'individual',
                    'segment' => 'regular',
                    'branch_id' => $branch->branch_id,
                    'opt_in_email' => true,
                    'opt_in_sms' => false,
                ]
            );
            $fullName = "{$c['first_name']} {$c['last_name']}";
            $customers[$fullName] = $customer;
        }

        // 6. Vehicles
        $vehicleData = [
            ['customer' => 'Dawit Bekele', 'make' => 'Toyota', 'model' => 'Hilux', 'year' => 2020, 'vin' => '1HGBH41JXMN109186', 'plate' => 'AA 123-456'],
            ['customer' => 'Hanna Girma', 'make' => 'Suzuki', 'model' => 'Dzire', 'year' => 2022, 'vin' => '5NPDH4AE9HH123456', 'plate' => 'AA 987-321'],
            ['customer' => 'Mulugeta Tesfaye', 'make' => 'Isuzu', 'model' => 'D-Max', 'year' => 2021, 'vin' => '3VWFE7AJ3DM654321', 'plate' => 'AA 456-789'],
            ['customer' => 'Fanuel Mekonnen', 'make' => 'Hyundai', 'model' => 'Tucson', 'year' => 2023, 'vin' => '2T2BZ1BA3KC111222', 'plate' => 'AA 111-222'],
        ];

        $vehicles = [];
        foreach ($vehicleData as $v) {
            $cust = $customers[$v['customer']];
            $vehicle = Vehicle::firstOrCreate(
                ['vin' => $v['vin']],
                [
                    'customer_id' => $cust->customer_id,
                    'make' => $v['make'],
                    'model' => $v['model'],
                    'year' => $v['year'],
                    'plate_number' => $v['plate'],
                    'mileage' => 45000,
                ]
            );
            $vehicles[$v['customer']] = $vehicle;
        }

        // 7. Today's Appointments
        $today = now()->toDateString();

        $appointmentsData = [
            [
                'customer' => 'Dawit Bekele',
                'bay' => $bay2,
                'tech' => $techUsers['Samuel'],
                'service' => 'Oil Change, Brake Service',
                'start' => "{$today} 09:00:00",
                'end' => "{$today} 10:00:00",
                'status' => 'confirmed',
            ],
            [
                'customer' => 'Hanna Girma',
                'bay' => $bay1,
                'tech' => $techUsers['Bob'],
                'service' => 'Brake Service, Diagnostic',
                'start' => "{$today} 10:30:00",
                'end' => "{$today} 11:30:00",
                'status' => 'booked',
            ],
            [
                'customer' => 'Fanuel Mekonnen',
                'bay' => $bay4,
                'tech' => $techUsers['Kaleb'],
                'service' => 'Full Service, AC Service',
                'start' => "{$today} 13:00:00",
                'end' => "{$today} 14:30:00",
                'status' => 'confirmed',
            ],
            [
                'customer' => 'Mulugeta Tesfaye',
                'bay' => $bay3,
                'tech' => $techUsers['Samuel'],
                'service' => 'Diagnostic, Engine Repair',
                'start' => "{$today} 15:30:00",
                'end' => "{$today} 16:30:00",
                'status' => 'completed',
            ],
        ];

        foreach ($appointmentsData as $a) {
            $cust = $customers[$a['customer']];
            $veh = $vehicles[$a['customer']];

            Appointment::firstOrCreate(
                [
                    'customer_id' => $cust->customer_id,
                    'scheduled_start' => $a['start'],
                ],
                [
                    'vehicle_id' => $veh->vehicle_id,
                    'branch_id' => $branch->branch_id,
                    'bay_id' => $a['bay']->bay_id,
                    'technician_id' => $a['tech']->user_id,
                    'service_type' => $a['service'],
                    'scheduled_end' => $a['end'],
                    'status' => $a['status'],
                    'is_walkin' => false,
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Branch::create([
            'name' => 'Main Branch',
            'code' => 'MAIN',
            'address' => 'Addis Ababa',
            'phone' => '+251 911 123 456',
            'email' => 'main@garage-erp.com',
            'is_active' => true,
        ]);

        $this->command->info('Main branch created successfully.');
    }
}

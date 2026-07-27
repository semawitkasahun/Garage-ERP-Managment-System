<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            $sections = [
                [
                    'name' => 'Service Department',
                    'code' => 'SRV-' . $branch->code,
                    'description' => 'General vehicle service and repairs',
                ],
                [
                    'name' => 'Body Shop',
                    'code' => 'BDY-' . $branch->code,
                    'description' => 'Collision repair and body work',
                ],
                [
                    'name' => 'Parts Department',
                    'code' => 'PRT-' . $branch->code,
                    'description' => 'Parts inventory and sales',
                ],
                [
                    'name' => 'Diagnostic Center',
                    'code' => 'DIA-' . $branch->code,
                    'description' => 'Advanced vehicle diagnostics',
                ],
                [
                    'name' => 'Quick Lube',
                    'code' => 'QIK-' . $branch->code,
                    'description' => 'Express oil and fluid services',
                ],
                [
                    'name' => 'Paint Department',
                    'code' => 'PNT-' . $branch->code,
                    'description' => 'Vehicle painting and finishing',
                ],
            ];

            foreach ($sections as $sectionData) {
                Section::create([
                    'name' => $sectionData['name'],
                    'code' => $sectionData['code'],
                    'description' => $sectionData['description'],
                    'branch_id' => $branch->branch_id,
                    'manager_id' => Employee::where('branch_id', $branch->branch_id)
                        ->where('job_title', 'Manager')
                        ->first()?->employee_id,
                    'status' => 'active',
                ]);
            }
        }
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\TechnicianSkill;
use Illuminate\Http\Request;

class TechnicianSkillController extends Controller
{
    public function index(Request $request)
    {
        $query = TechnicianSkill::query()->with(['employee']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('skill_name')) {
            $query->where('skill_name', 'like', '%' . $request->skill_name . '%');
        }

        if ($request->has('certification_name')) {
            $query->where('certification_name', 'like', '%' . $request->certification_name . '%');
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'skill_name' => 'nullable|string|max:100',
            'certification_name' => 'nullable|string|max:100',
            'certified_at' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:certified_at',
        ]);

        $skill = TechnicianSkill::create($validated);
        return response()->json($skill, 201);
    }

    public function show(TechnicianSkill $technicianSkill)
    {
        return $technicianSkill->load('employee');
    }

    public function update(Request $request, TechnicianSkill $technicianSkill)
    {
        $validated = $request->validate([
            'skill_name' => 'nullable|string|max:100',
            'certification_name' => 'nullable|string|max:100',
            'certified_at' => 'nullable|date',
            'expiry_date' => 'nullable|date|after:certified_at',
        ]);

        $technicianSkill->update($validated);
        return $technicianSkill;
    }

    public function destroy(TechnicianSkill $technicianSkill)
    {
        $technicianSkill->delete();
        return response()->noContent();
    }

    public function getByEmployee($employeeId)
    {
        $skills = TechnicianSkill::where('employee_id', $employeeId)
            ->latest()
            ->get();
        return $skills;
    }

    public function getExpiring($days = 30)
    {
        $skills = TechnicianSkill::where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>=', now())
            ->with(['employee'])
            ->orderBy('expiry_date', 'asc')
            ->get();
        return $skills;
    }

    public function getExpired()
    {
        $skills = TechnicianSkill::where('expiry_date', '<', now())
            ->with(['employee'])
            ->orderBy('expiry_date', 'asc')
            ->get();
        return $skills;
    }
}
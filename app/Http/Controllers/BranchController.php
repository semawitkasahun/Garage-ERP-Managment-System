<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        return Branch::query()
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:20|unique:branches,code',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $branch = Branch::create($validated);
        return response()->json($branch, 201);
    }

    public function show(Branch $branch)
    {
        return $branch->load(['employees', 'users', 'customers', 'bays']);//this will load the relationships for employees, users, customers, and bays associated with the branch
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'code' => 'sometimes|required|string|max:20|unique:branches,code,' . $branch->branch_id . ',branch_id',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $branch->update($validated); // this validates the request data and updates the branch with the validated data. The unique validation rule for the code field is adjusted to ignore the current branch's ID, 
        return $branch;
    }

    public function destroy(Branch $branch) 
    {
        $branch->delete();
        return response()->noContent();
    }
}
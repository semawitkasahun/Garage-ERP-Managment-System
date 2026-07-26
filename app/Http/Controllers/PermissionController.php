<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        return Permission::query()
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'module' => 'required|string|max:50',
            'action' => 'required|string|max:30',
        ]);

        $permission = Permission::create($validated);
        return response()->json($permission, 201);
    }

    public function show(Permission $permission)
    {
        return $permission->load('roles');
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'module' => 'sometimes|required|string|max:50',
            'action' => 'sometimes|required|string|max:30',
        ]); // the module and action do 

        $permission->update($validated);
        return $permission;
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return response()->noContent();
    }
}
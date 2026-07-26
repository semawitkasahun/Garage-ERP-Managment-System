<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(Request $request)
    {
        return SystemSetting::query()
            ->with(['branch'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'setting_key' => 'required|string|max:100|unique:system_settings,setting_key,NULL,setting_id,branch_id,' . $request->branch_id,
            'setting_value' => 'nullable|string|max:255',
        ]);

        $setting = SystemSetting::create($validated);
        return response()->json($setting, 201);
    }

    public function show(SystemSetting $systemSetting)
    {
        return $systemSetting->load('branch');
    }

    public function update(Request $request, SystemSetting $systemSetting)
    {
        $validated = $request->validate([
            'setting_key' => 'sometimes|required|string|max:100|unique:system_settings,setting_key,' . $systemSetting->setting_id . ',setting_id,branch_id,' . $request->branch_id,
            'setting_value' => 'nullable|string|max:255',
        ]);

        $systemSetting->update($validated);
        return $systemSetting;
    }

    public function destroy(SystemSetting $systemSetting)
    {
        $systemSetting->delete();
        return response()->noContent();
    }

    public function getByKey($key)
    {
        $setting = SystemSetting::where('setting_key', $key)->firstOrFail();
        return $setting;
    }
}
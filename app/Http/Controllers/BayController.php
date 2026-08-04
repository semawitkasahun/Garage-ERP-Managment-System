<?php

namespace App\Http\Controllers;

use App\Models\Bay;
use Illuminate\Http\Request;

class BayController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->input('branch_id', $request->user()->branch_id);
        return Bay::where('branch_id', $branchId)->where('is_active', true)->orderBy('name')->get();
    }
}

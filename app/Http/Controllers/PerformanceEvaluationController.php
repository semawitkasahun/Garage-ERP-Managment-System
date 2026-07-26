<?php

namespace App\Http\Controllers;

use App\Models\PerformanceEvaluation;
use Illuminate\Http\Request;

class PerformanceEvaluationController extends Controller
{
    public function index(Request $request)
    {
        $query = PerformanceEvaluation::query()->with(['employee', 'evaluator']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('evaluator_id')) {
            $query->where('evaluator_id', $request->evaluator_id);
        }

        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        if ($request->has('min_rating')) {
            $query->where('rating', '>=', $request->min_rating);
        }

        if ($request->has('max_rating')) {
            $query->where('rating', '<=', $request->max_rating);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'evaluator_id' => 'required|integer|exists:users,user_id',
            'period' => 'nullable|string|max:20',
            'rating' => 'nullable|numeric|min:0|max:5',
            'comments' => 'nullable|string',
        ]);

        $evaluation = PerformanceEvaluation::create($validated);
        return response()->json($evaluation, 201);
    }

    public function show(PerformanceEvaluation $performanceEvaluation)
    {
        return $performanceEvaluation->load(['employee', 'evaluator']);
    }

    public function update(Request $request, PerformanceEvaluation $performanceEvaluation)
    {
        $validated = $request->validate([
            'rating' => 'nullable|numeric|min:0|max:5',
            'comments' => 'nullable|string',
        ]);

        $performanceEvaluation->update($validated);
        return $performanceEvaluation;
    }

    public function destroy(PerformanceEvaluation $performanceEvaluation)
    {
        $performanceEvaluation->delete();
        return response()->noContent();
    }

    public function getByEmployee($employeeId)
    {
        $evaluations = PerformanceEvaluation::where('employee_id', $employeeId)
            ->with(['evaluator'])
            ->latest()
            ->get();
        return $evaluations;
    }

    public function getByEvaluator($evaluatorId)
    {
        $evaluations = PerformanceEvaluation::where('evaluator_id', $evaluatorId)
            ->with(['employee'])
            ->latest()
            ->get();
        return $evaluations;
    }

    public function getSummary($employeeId)
    {
        $evaluations = PerformanceEvaluation::where('employee_id', $employeeId);

        $summary = [
            'total_evaluations' => $evaluations->count(),
            'average_rating' => $evaluations->avg('rating'),
            'highest_rating' => $evaluations->max('rating'),
            'lowest_rating' => $evaluations->min('rating'),
            'by_period' => (clone $evaluations)->select('period', \DB::raw('avg(rating) as avg_rating'))
                ->groupBy('period')
                ->get(),
        ];

        return $summary;
    }
}
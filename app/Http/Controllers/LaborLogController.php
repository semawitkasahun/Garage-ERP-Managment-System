<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use Illuminate\Http\Request;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCard::query()->with(['workOrder']);

        if ($request->has('work_order_id')) {
            $query->where('work_order_id', $request->work_order_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'work_order_id' => 'required|integer|exists:work_orders,work_order_id',
            'description' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
            'priority' => 'nullable|string|max:10',
        ]);

        $jobCard = JobCard::create($validated);
        return response()->json($jobCard, 201);
    }

    public function show(JobCard $jobCard)
    {
        return $jobCard->load([
            'workOrder',
            'tasks' => function ($query) {
                $query->with(['technician', 'laborLogs']);
            },
            'partsRequisitions' => function ($query) {
                $query->with(['inventoryItem', 'requestedBy']);
            },
            'qualityControlChecks' => function ($query) {
                $query->with(['inspector', 'checklistItems']);
            },
            'equipmentBookings'
        ]);
    }

    public function update(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'description' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
            'priority' => 'nullable|string|max:10',
        ]);

        $jobCard->update($validated);
        return $jobCard;
    }

    public function destroy(JobCard $jobCard)
    {
        $jobCard->delete();
        return response()->noContent();
    }

    public function start(JobCard $jobCard)
    {
        $jobCard->update(['status' => 'in_progress']);
        return $jobCard;
    }

    public function complete(JobCard $jobCard)
    {
        $jobCard->update(['status' => 'completed']);
        return $jobCard;
    }

    public function getByWorkOrder($workOrderId)
    {
        $jobCards = JobCard::where('work_order_id', $workOrderId)
            ->with(['tasks'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getByStatus($status)
    {
        $jobCards = JobCard::where('status', $status)
            ->with(['workOrder'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getByPriority($priority)
    {
        $jobCards = JobCard::where('priority', $priority)
            ->with(['workOrder'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getProgress(JobCard $jobCard)
    {
        $totalTasks = $jobCard->tasks()->count();
        $completedTasks = $jobCard->tasks()->where('status', 'done')->count();

        $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0;

        return response()->json([
            'job_card_id' => $jobCard->job_card_id,
            'status' => $jobCard->status,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'progress' => $progress . '%',
        ]);
    }
}
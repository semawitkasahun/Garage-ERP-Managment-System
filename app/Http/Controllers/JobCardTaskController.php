<?php

namespace App\Http\Controllers;

use App\Models\JobCardTask;
use Illuminate\Http\Request;

class JobCardTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardTask::query()->with(['jobCard', 'technician', 'quotationItem']);

        if ($request->has('job_card_id')) {
            $query->where('job_card_id', $request->job_card_id);
        }

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|integer|exists:job_cards,job_card_id',
            'quotation_item_id' => 'nullable|integer|exists:quotation_items,quotation_item_id',
            'technician_id' => 'required|integer|exists:users,user_id',
            'task_description' => 'nullable|string|max:255',
            'estimated_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
        ]);

        $task = JobCardTask::create($validated);
        return response()->json($task, 201);
    }

    public function show(JobCardTask $jobCardTask)
    {
        return $jobCardTask->load([
            'jobCard',
            'quotationItem',
            'technician',
            'laborLogs' => function ($query) {
                $query->orderBy('clock_in', 'desc');
            },
            'partsRequisitions' => function ($query) {
                $query->with(['inventoryItem']);
            }
        ]);
    }

    public function update(Request $request, JobCardTask $jobCardTask)
    {
        $validated = $request->validate([
            'task_description' => 'nullable|string|max:255',
            'estimated_hours' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after:start_time',
        ]);

        $jobCardTask->update($validated);
        return $jobCardTask;
    }

    public function destroy(JobCardTask $jobCardTask)
    {
        $jobCardTask->delete();
        return response()->noContent();
    }

    public function start(JobCardTask $jobCardTask)
    {
        $jobCardTask->update([
            'status' => 'in_progress',
            'start_time' => now(),
        ]);
        return $jobCardTask;
    }

    public function complete(JobCardTask $jobCardTask)
    {
        $jobCardTask->update([
            'status' => 'done',
            'end_time' => now(),
        ]);
        return $jobCardTask;
    }

    public function assignTechnician(Request $request, JobCardTask $jobCardTask)
    {
        $validated = $request->validate([
            'technician_id' => 'required|integer|exists:users,user_id',
        ]);

        $jobCardTask->update(['technician_id' => $validated['technician_id']]);
        return $jobCardTask;
    }

    public function getByTechnician($technicianId)
    {
        $tasks = JobCardTask::where('technician_id', $technicianId)
            ->with(['jobCard'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->latest()
            ->get();
        return $tasks;
    }

    public function getByJobCard($jobCardId)
    {
        $tasks = JobCardTask::where('job_card_id', $jobCardId)
            ->with(['technician', 'laborLogs'])
            ->latest()
            ->get();
        return $tasks;
    }

    public function getPending()
    {
        $tasks = JobCardTask::where('status', 'pending')
            ->with(['jobCard', 'technician'])
            ->latest()
            ->get();
        return $tasks;
    }

    public function getInProgress()
    {
        $tasks = JobCardTask::where('status', 'in_progress')
            ->with(['jobCard', 'technician'])
            ->latest()
            ->get();
        return $tasks;
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|integer|exists:job_cards,job_card_id',
            'tasks' => 'required|array',
            'tasks.*.quotation_item_id' => 'nullable|integer|exists:quotation_items,quotation_item_id',
            'tasks.*.technician_id' => 'required|integer|exists:users,user_id',
            'tasks.*.task_description' => 'nullable|string|max:255',
            'tasks.*.estimated_hours' => 'nullable|numeric|min:0',
            'tasks.*.status' => 'nullable|string|max:20',
        ]);

        $createdTasks = [];
        foreach ($validated['tasks'] as $taskData) {
            $taskData['job_card_id'] = $validated['job_card_id'];
            $createdTasks[] = JobCardTask::create($taskData);
        }

        return response()->json($createdTasks, 201);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CalendarController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'view' => 'nullable|in:month,week,day',
            'project_id' => 'nullable|exists:projects,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Task::with(['project', 'assignee', 'creator'])
            ->whereNotNull('start_date')
            ->orWhereNotNull('due_date');

        if ($request->project_id) {
            $project = Project::findOrFail($request->project_id);
            $this->authorize('view', $project);
            $query->where('project_id', $request->project_id);
        } else {
            $query->whereHas('project.members', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->where('is_active', true);
            });
        }

        if ($request->user_id) {
            $query->where('assigned_to', $request->user_id);
        }

        $query->where(function ($q) use ($request) {
            $q->whereBetween('start_date', [$request->start_date, $request->end_date])
              ->orWhereBetween('due_date', [$request->start_date, $request->end_date])
              ->orWhere(function ($subQ) use ($request) {
                  $subQ->where('start_date', '<=', $request->start_date)
                       ->where('due_date', '>=', $request->end_date);
              });
        });

        $tasks = $query->orderBy('start_date')->orderBy('due_date')->get();

        $events = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'start' => $task->start_date,
                'end' => $task->due_date,
                'status' => $task->status,
                'priority' => $task->priority,
                'project' => [
                    'id' => $task->project->id,
                    'name' => $task->project->name,
                    'color' => $task->project->color,
                ],
                'assignee' => $task->assignee ? [
                    'id' => $task->assignee->id,
                    'name' => $task->assignee->name,
                ] : null,
                'type' => 'task',
                'color' => $this->getTaskColor($task),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    public function gantt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $project = Project::findOrFail($request->project_id);
        $this->authorize('view', $project);

        $tasks = Task::where('project_id', $request->project_id)
            ->with(['assignee', 'parentTask', 'subtasks'])
            ->whereNotNull('start_date')
            ->whereNotNull('due_date')
            ->orderBy('order')
            ->orderBy('created_at')
            ->get();

        $ganttData = $tasks->map(function ($task) {
            $dependencies = [];
            if ($task->dependencies) {
                $dependencies = is_array($task->dependencies) ? $task->dependencies : json_decode($task->dependencies, true) ?? [];
            }

            return [
                'id' => $task->id,
                'text' => $task->title,
                'start_date' => $task->start_date->format('Y-m-d'),
                'end_date' => $task->due_date->format('Y-m-d'),
                'duration' => $task->start_date->diffInDays($task->due_date) + 1,
                'progress' => $task->progress / 100,
                'parent' => $task->parent_task_id,
                'priority' => $task->priority,
                'status' => $task->status,
                'assignee' => $task->assignee ? $task->assignee->name : null,
                'dependencies' => $dependencies,
                'color' => $this->getTaskColor($task),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'tasks' => $ganttData,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'start_date' => $project->start_date,
                    'end_date' => $project->end_date,
                ]
            ]
        ]);
    }

    public function updateTaskDates(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update([
            'start_date' => $request->start_date,
            'due_date' => $request->due_date,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Task dates updated successfully',
            'data' => $task->fresh(['project', 'assignee'])
        ]);
    }

    public function updateTaskOrder(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validator = Validator::make($request->all(), [
            'order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update(['order' => $request->order]);

        return response()->json([
            'success' => true,
            'message' => 'Task order updated successfully',
            'data' => $task->fresh(['project', 'assignee'])
        ]);
    }

    public function milestones(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'nullable|exists:projects,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Task::with(['project', 'assignee'])
            ->where('priority', 'urgent')
            ->orWhereNotNull('due_date');

        if ($request->project_id) {
            $project = Project::findOrFail($request->project_id);
            $this->authorize('view', $project);
            $query->where('project_id', $request->project_id);
        } else {
            $query->whereHas('project.members', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->where('is_active', true);
            });
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
        }

        $milestones = $query->orderBy('due_date')->get();

        return response()->json([
            'success' => true,
            'data' => $milestones
        ]);
    }

    public function workload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = $request->user_id ?? $request->user()->id;

        $tasks = Task::with(['project'])
            ->where('assigned_to', $userId)
            ->where('status', '!=', 'done')
            ->where(function ($q) use ($request) {
                $q->whereBetween('start_date', [$request->start_date, $request->end_date])
                  ->orWhereBetween('due_date', [$request->start_date, $request->end_date]);
            })
            ->get();

        $workloadData = [];
        $currentDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        while ($currentDate->lte($endDate)) {
            $dayTasks = $tasks->filter(function ($task) use ($currentDate) {
                $startDate = $task->start_date ? Carbon::parse($task->start_date) : null;
                $dueDate = $task->due_date ? Carbon::parse($task->due_date) : null;
                
                return ($startDate && $startDate->lte($currentDate) && $dueDate && $dueDate->gte($currentDate));
            });

            $workloadData[] = [
                'date' => $currentDate->format('Y-m-d'),
                'task_count' => $dayTasks->count(),
                'estimated_hours' => $dayTasks->sum('estimated_hours'),
                'tasks' => $dayTasks->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'priority' => $task->priority,
                        'project' => $task->project->name,
                    ];
                }),
            ];

            $currentDate->addDay();
        }

        return response()->json([
            'success' => true,
            'data' => $workloadData
        ]);
    }

    private function getTaskColor($task)
    {
        $colors = [
            'low' => '#10B981',
            'medium' => '#F59E0B',
            'high' => '#EF4444',
            'urgent' => '#DC2626',
        ];

        return $colors[$task->priority] ?? $task->project->color ?? '#6B7280';
    }
}

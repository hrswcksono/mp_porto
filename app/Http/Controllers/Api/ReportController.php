<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\TimeTracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function timeTracking(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
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

        $query = TimeTracking::with(['user', 'task.project'])
            ->whereBetween('started_at', [$request->start_date, $request->end_date]);

        if ($request->project_id) {
            $project = Project::findOrFail($request->project_id);
            $this->authorize('view', $project);
            $query->whereHas('task', function ($q) use ($request) {
                $q->where('project_id', $request->project_id);
            });
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $timeTrackings = $query->get();

        $summary = [
            'total_time_minutes' => $timeTrackings->sum('duration_minutes'),
            'total_time_hours' => round($timeTrackings->sum('duration_minutes') / 60, 2),
            'billable_time_minutes' => $timeTrackings->where('is_billable', true)->sum('duration_minutes'),
            'billable_time_hours' => round($timeTrackings->where('is_billable', true)->sum('duration_minutes') / 60, 2),
            'total_sessions' => $timeTrackings->count(),
            'unique_users' => $timeTrackings->pluck('user_id')->unique()->count(),
            'unique_projects' => $timeTrackings->pluck('task.project.id')->unique()->count(),
        ];

        $byUser = $timeTrackings->groupBy('user_id')->map(function ($userTrackings) {
            $user = $userTrackings->first()->user;
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
                'total_minutes' => $userTrackings->sum('duration_minutes'),
                'total_hours' => round($userTrackings->sum('duration_minutes') / 60, 2),
                'sessions' => $userTrackings->count(),
            ];
        })->values();

        $byProject = $timeTrackings->groupBy('task.project.id')->map(function ($projectTrackings) {
            $project = $projectTrackings->first()->task->project;
            return [
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                ],
                'total_minutes' => $projectTrackings->sum('duration_minutes'),
                'total_hours' => round($projectTrackings->sum('duration_minutes') / 60, 2),
                'sessions' => $projectTrackings->count(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'by_user' => $byUser,
                'by_project' => $byProject,
                'details' => $timeTrackings,
            ]
        ]);
    }

    public function projectStatistics(Request $request)
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

        $query = Project::with(['tasks', 'members']);

        if ($request->project_id) {
            $project = Project::findOrFail($request->project_id);
            $this->authorize('view', $project);
            $query->where('id', $request->project_id);
        } else {
            $query->whereHas('members', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->where('is_active', true);
            });
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $projects = $query->get();

        $statistics = $projects->map(function ($project) {
            $tasks = $project->tasks;
            
            return [
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'progress' => $project->progress,
                ],
                'tasks' => [
                    'total' => $tasks->count(),
                    'completed' => $tasks->where('status', 'done')->count(),
                    'in_progress' => $tasks->where('status', 'in_progress')->count(),
                    'todo' => $tasks->where('status', 'todo')->count(),
                    'overdue' => $tasks->where('due_date', '<', now())->where('status', '!=', 'done')->count(),
                ],
                'members' => $project->members->where('is_active', true)->count(),
                'completion_rate' => $tasks->count() > 0 ? round(($tasks->where('status', 'done')->count() / $tasks->count()) * 100, 2) : 0,
                'average_task_duration' => $tasks->whereNotNull('start_date')->whereNotNull('due_date')->avg(function ($task) {
                    return Carbon::parse($task->start_date)->diffInDays(Carbon::parse($task->due_date));
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    public function taskAnalytics(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'nullable|exists:projects,id',
            'user_id' => 'nullable|exists:users,id',
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

        $query = Task::with(['project', 'assignee']);

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

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $tasks = $query->get();

        $analytics = [
            'total_tasks' => $tasks->count(),
            'by_status' => [
                'todo' => $tasks->where('status', 'todo')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'review' => $tasks->where('status', 'review')->count(),
                'done' => $tasks->where('status', 'done')->count(),
            ],
            'by_priority' => [
                'low' => $tasks->where('priority', 'low')->count(),
                'medium' => $tasks->where('priority', 'medium')->count(),
                'high' => $tasks->where('priority', 'high')->count(),
                'urgent' => $tasks->where('priority', 'urgent')->count(),
            ],
            'overdue_tasks' => $tasks->where('due_date', '<', now())->where('status', '!=', 'done')->count(),
            'completed_on_time' => $tasks->where('status', 'done')->filter(function ($task) {
                return $task->due_date && $task->updated_at <= $task->due_date;
            })->count(),
            'average_completion_time' => $tasks->where('status', 'done')->avg(function ($task) {
                return Carbon::parse($task->created_at)->diffInDays(Carbon::parse($task->updated_at));
            }),
        ];

        $byAssignee = $tasks->groupBy('assigned_to')->map(function ($userTasks, $userId) {
            $user = $userTasks->first()->assignee;
            return [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                ] : null,
                'total_tasks' => $userTasks->count(),
                'completed_tasks' => $userTasks->where('status', 'done')->count(),
                'overdue_tasks' => $userTasks->where('due_date', '<', now())->where('status', '!=', 'done')->count(),
                'completion_rate' => $userTasks->count() > 0 ? round(($userTasks->where('status', 'done')->count() / $userTasks->count()) * 100, 2) : 0,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'analytics' => $analytics,
                'by_assignee' => $byAssignee,
            ]
        ]);
    }

    public function userPerformance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = $request->user_id ?? $request->user()->id;
        $user = User::findOrFail($userId);

        $tasks = Task::where('assigned_to', $userId)
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->with('project')
            ->get();

        $timeTrackings = TimeTracking::where('user_id', $userId)
            ->whereBetween('started_at', [$request->start_date, $request->end_date])
            ->get();

        $performance = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role->name ?? null,
            ],
            'tasks' => [
                'total_assigned' => $tasks->count(),
                'completed' => $tasks->where('status', 'done')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'overdue' => $tasks->where('due_date', '<', now())->where('status', '!=', 'done')->count(),
                'completion_rate' => $tasks->count() > 0 ? round(($tasks->where('status', 'done')->count() / $tasks->count()) * 100, 2) : 0,
            ],
            'time_tracking' => [
                'total_hours' => round($timeTrackings->sum('duration_minutes') / 60, 2),
                'billable_hours' => round($timeTrackings->where('is_billable', true)->sum('duration_minutes') / 60, 2),
                'sessions' => $timeTrackings->count(),
                'average_session_duration' => $timeTrackings->count() > 0 ? round($timeTrackings->avg('duration_minutes'), 2) : 0,
            ],
            'productivity_score' => $this->calculateProductivityScore($tasks, $timeTrackings),
        ];

        return response()->json([
            'success' => true,
            'data' => $performance
        ]);
    }

    public function exportReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:time_tracking,project_statistics,task_analytics,user_performance',
            'format' => 'required|in:json,csv',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
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

        switch ($request->type) {
            case 'time_tracking':
                $data = $this->timeTracking($request)->getData()->data;
                break;
            case 'project_statistics':
                $data = $this->projectStatistics($request)->getData()->data;
                break;
            case 'task_analytics':
                $data = $this->taskAnalytics($request)->getData()->data;
                break;
            case 'user_performance':
                $data = $this->userPerformance($request)->getData()->data;
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid report type'
                ], 400);
        }

        if ($request->format === 'csv') {
            return $this->exportToCsv($data, $request->type);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'export_info' => [
                'type' => $request->type,
                'format' => $request->format,
                'generated_at' => now(),
                'date_range' => [
                    'start' => $request->start_date,
                    'end' => $request->end_date,
                ]
            ]
        ]);
    }

    private function calculateProductivityScore($tasks, $timeTrackings)
    {
        $completionRate = $tasks->count() > 0 ? ($tasks->where('status', 'done')->count() / $tasks->count()) * 100 : 0;
        $onTimeRate = $tasks->where('status', 'done')->count() > 0 ? 
            ($tasks->where('status', 'done')->filter(function ($task) {
                return $task->due_date && $task->updated_at <= $task->due_date;
            })->count() / $tasks->where('status', 'done')->count()) * 100 : 0;
        
        $timeEfficiency = $timeTrackings->count() > 0 ? 
            min(($timeTrackings->where('is_billable', true)->sum('duration_minutes') / $timeTrackings->sum('duration_minutes')) * 100, 100) : 0;

        return round(($completionRate * 0.4) + ($onTimeRate * 0.4) + ($timeEfficiency * 0.2), 2);
    }

    private function exportToCsv($data, $type)
    {
        $filename = $type . '_report_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($data, $type) {
            $file = fopen('php://output', 'w');
            
            switch ($type) {
                case 'time_tracking':
                    fputcsv($file, ['User', 'Project', 'Task', 'Duration (Hours)', 'Date', 'Billable']);
                    foreach ($data->details as $tracking) {
                        fputcsv($file, [
                            $tracking->user->name,
                            $tracking->task->project->name,
                            $tracking->task->title,
                            round($tracking->duration_minutes / 60, 2),
                            $tracking->started_at,
                            $tracking->is_billable ? 'Yes' : 'No'
                        ]);
                    }
                    break;
                    
                default:
                    fputcsv($file, ['Export not implemented for this report type']);
                    break;
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

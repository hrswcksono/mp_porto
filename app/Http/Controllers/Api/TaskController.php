<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use App\Models\TaskAssignment;
use App\Models\TimeTracking;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TaskController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request, Project $project = null)
    {
        $query = Task::with(['project', 'assignee', 'creator', 'parentTask', 'subtasks']);

        if ($project) {
            $query->where('project_id', $project->id);
        } else {
            $query->whereHas('project.members', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->where('is_active', true);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->has('due_date_from')) {
            $query->where('due_date', '>=', $request->due_date_from);
        }

        if ($request->has('due_date_to')) {
            $query->where('due_date', '<=', $request->due_date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('order')->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'estimated_hours' => 'nullable|integer|min:0',
            'parent_task_id' => 'nullable|exists:tasks,id',
            'assigned_to' => 'nullable|exists:users,id',
            'dependencies' => 'nullable|array',
            'dependencies.*' => 'exists:tasks,id',
            'checklist' => 'nullable|array',
            'tags' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->parent_task_id) {
            $parentTask = Task::where('id', $request->parent_task_id)
                ->where('project_id', $project->id)
                ->first();
            
            if (!$parentTask) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent task must belong to the same project'
                ], 422);
            }
        }

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'status' => $request->status ?? 'todo',
            'priority' => $request->priority ?? 'medium',
            'start_date' => $request->start_date,
            'due_date' => $request->due_date,
            'estimated_hours' => $request->estimated_hours,
            'checklist' => $request->checklist,
            'tags' => $request->tags,
            'project_id' => $project->id,
            'parent_task_id' => $request->parent_task_id,
            'created_by' => $request->user()->id,
            'assigned_to' => $request->assigned_to,
            'dependencies' => $request->dependencies,
            'order' => $request->order ?? 0,
        ]);

        if ($request->assigned_to) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'user_id' => $request->assigned_to,
                'type' => 'assignee',
                'assigned_by' => $request->user()->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $task->load(['project', 'assignee', 'creator', 'parentTask', 'subtasks'])
        ], 201);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task->project);

        return response()->json([
            'success' => true,
            'data' => $task->load([
                'project',
                'assignee',
                'creator',
                'parentTask',
                'subtasks.assignee',
                'assignments.user',
                'timeTrackings.user',
                'comments.user'
            ])
        ]);
    }

    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'estimated_hours' => 'nullable|integer|min:0',
            'progress' => 'nullable|integer|min:0|max:100',
            'assigned_to' => 'nullable|exists:users,id',
            'dependencies' => 'nullable|array',
            'dependencies.*' => 'exists:tasks,id',
            'checklist' => 'nullable|array',
            'tags' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $task->update($request->only([
            'title', 'description', 'status', 'priority', 'start_date',
            'due_date', 'estimated_hours', 'progress', 'assigned_to',
            'dependencies', 'checklist', 'tags', 'order'
        ]));

        if ($request->has('assigned_to') && $request->assigned_to !== $task->getOriginal('assigned_to')) {
            TaskAssignment::where('task_id', $task->id)
                ->where('type', 'assignee')
                ->delete();

            if ($request->assigned_to) {
                TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $request->assigned_to,
                    'type' => 'assignee',
                    'assigned_by' => $request->user()->id,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $task->load(['project', 'assignee', 'creator', 'parentTask', 'subtasks'])
        ]);
    }

    public function destroy(Task $task)
    {
        $this->authorize('update', $task->project);

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully'
        ]);
    }

    public function assign(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'type' => 'required|in:assignee,reviewer,watcher',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $existingAssignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $request->user_id)
            ->where('type', $request->type)
            ->first();

        if ($existingAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'User is already assigned to this task with this role'
            ], 409);
        }

        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $request->user_id,
            'type' => $request->type,
            'assigned_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User assigned successfully',
            'data' => $assignment->load('user')
        ], 201);
    }

    public function unassign(Task $task, $userId)
    {
        $this->authorize('update', $task->project);

        $assignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'User unassigned successfully'
        ]);
    }

    public function startTimeTracking(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        $activeTracking = TimeTracking::where('task_id', $task->id)
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->first();

        if ($activeTracking) {
            return response()->json([
                'success' => false,
                'message' => 'Time tracking is already active for this task'
            ], 409);
        }

        $tracking = TimeTracking::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'description' => $request->description,
            'started_at' => now(),
            'is_manual' => false,
            'is_billable' => $request->is_billable ?? true,
            'hourly_rate' => $request->hourly_rate,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Time tracking started successfully',
            'data' => $tracking
        ], 201);
    }

    public function stopTimeTracking(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        $tracking = TimeTracking::where('task_id', $task->id)
            ->where('user_id', $request->user()->id)
            ->whereNull('ended_at')
            ->firstOrFail();

        $endTime = now();
        $durationMinutes = $tracking->started_at->diffInMinutes($endTime);

        $tracking->update([
            'ended_at' => $endTime,
            'duration_minutes' => $durationMinutes,
        ]);

        $task->increment('actual_hours', intval($durationMinutes / 60));

        return response()->json([
            'success' => true,
            'message' => 'Time tracking stopped successfully',
            'data' => $tracking->fresh()
        ]);
    }

    public function getTimeTracking(Task $task)
    {
        $this->authorize('view', $task->project);

        $timeTrackings = $task->timeTrackings()->with('user')->get();

        return response()->json([
            'success' => true,
            'data' => $timeTrackings
        ]);
    }

    public function addComment(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
            'mentions' => 'nullable|array',
            'mentions.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $comment = Comment::create([
            'content' => $request->content,
            'commentable_type' => Task::class,
            'commentable_id' => $task->id,
            'user_id' => $request->user()->id,
            'parent_id' => $request->parent_id,
            'mentions' => $request->mentions,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'data' => $comment->load('user')
        ], 201);
    }

    public function getComments(Task $task)
    {
        $this->authorize('view', $task->project);

        $comments = $task->comments()
            ->with(['user', 'replies.user'])
            ->whereNull('parent_id')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }
}

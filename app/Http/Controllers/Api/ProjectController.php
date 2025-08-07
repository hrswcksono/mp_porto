<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ProjectController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $query = Project::with(['owner', 'team', 'members.user'])
            ->where(function ($q) use ($request) {
                $q->where('owner_id', $request->user()->id)
                  ->orWhereHas('members', function ($memberQuery) use ($request) {
                      $memberQuery->where('user_id', $request->user()->id)
                                  ->where('is_active', true);
                  });
            });

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $projects = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,in_progress,on_hold,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:7',
            'is_public' => 'nullable|boolean',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $project = Project::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . time(),
            'description' => $request->description,
            'status' => $request->status ?? 'draft',
            'priority' => $request->priority ?? 'medium',
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'budget' => $request->budget,
            'color' => $request->color ?? '#3B82F6',
            'is_public' => $request->is_public ?? false,
            'owner_id' => $request->user()->id,
            'team_id' => $request->team_id,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'role' => 'owner',
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project created successfully',
            'data' => $project->load(['owner', 'team', 'members.user'])
        ], 201);
    }

    public function show(Project $project)
    {
        $this->authorize('view', $project);

        return response()->json([
            'success' => true,
            'data' => $project->load([
                'owner',
                'team',
                'members.user',
                'tasks' => function ($query) {
                    $query->with(['assignee', 'creator'])->orderBy('order');
                }
            ])
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,in_progress,on_hold,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'progress' => 'nullable|integer|min:0|max:100',
            'color' => 'nullable|string|max:7',
            'is_public' => 'nullable|boolean',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $project->update($request->only([
            'name', 'description', 'status', 'priority', 'start_date',
            'end_date', 'budget', 'progress', 'color', 'is_public', 'team_id'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Project updated successfully',
            'data' => $project->load(['owner', 'team', 'members.user'])
        ]);
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project deleted successfully'
        ]);
    }

    public function members(Project $project)
    {
        $this->authorize('view', $project);

        $members = $project->members()->with('user')->get();

        return response()->json([
            'success' => true,
            'data' => $members
        ]);
    }

    public function addMember(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:owner,manager,member,viewer',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $existingMember = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $request->user_id)
            ->first();

        if ($existingMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this project'
            ], 409);
        }

        $member = ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user_id,
            'role' => $request->role,
            'permissions' => $request->permissions,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member added successfully',
            'data' => $member->load('user')
        ], 201);
    }

    public function updateMember(Request $request, Project $project, User $user)
    {
        $this->authorize('update', $project);

        $member = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'role' => 'sometimes|required|in:owner,manager,member,viewer',
            'permissions' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $member->update($request->only(['role', 'permissions', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Member updated successfully',
            'data' => $member->load('user')
        ]);
    }

    public function removeMember(Project $project, User $user)
    {
        $this->authorize('update', $project);

        $member = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($member->role === 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot remove project owner'
            ], 403);
        }

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully'
        ]);
    }

    public function statistics(Project $project)
    {
        $this->authorize('view', $project);

        $stats = [
            'total_tasks' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->where('status', 'done')->count(),
            'in_progress_tasks' => $project->tasks()->where('status', 'in_progress')->count(),
            'overdue_tasks' => $project->tasks()->where('due_date', '<', now())->where('status', '!=', 'done')->count(),
            'total_members' => $project->members()->where('is_active', true)->count(),
            'total_time_tracked' => $project->tasks()->withSum('timeTrackings', 'duration_minutes')->get()->sum('time_trackings_sum_duration_minutes') ?? 0,
            'budget_used' => 0, // Calculate based on time tracking and hourly rates
            'progress_percentage' => $project->progress,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

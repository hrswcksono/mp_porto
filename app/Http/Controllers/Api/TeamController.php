<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $query = Team::with(['leader', 'projects']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $teams = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:teams',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'leader_id' => 'nullable|exists:users,id',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team = Team::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'color' => $request->color ?? '#3B82F6',
            'is_active' => true,
            'leader_id' => $request->leader_id ?? $request->user()->id,
            'settings' => $request->settings,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team created successfully',
            'data' => $team->load('leader')
        ], 201);
    }

    public function show(Team $team)
    {
        return response()->json([
            'success' => true,
            'data' => $team->load(['leader', 'projects.owner'])
        ]);
    }

    public function update(Request $request, Team $team)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:teams,name,' . $team->id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'is_active' => 'nullable|boolean',
            'leader_id' => 'nullable|exists:users,id',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['name', 'description', 'color', 'is_active', 'leader_id', 'settings']);
        
        if (isset($updateData['name'])) {
            $updateData['slug'] = Str::slug($updateData['name']);
        }

        $team->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Team updated successfully',
            'data' => $team->load('leader')
        ]);
    }

    public function destroy(Team $team)
    {
        if ($team->projects()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete team with active projects'
            ], 409);
        }

        $team->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team deleted successfully'
        ]);
    }

    public function members(Team $team)
    {
        $members = User::whereHas('projects.team', function ($query) use ($team) {
            $query->where('teams.id', $team->id);
        })->with('role')->distinct()->get();

        return response()->json([
            'success' => true,
            'data' => $members
        ]);
    }

    public function addMember(Request $request, Team $team)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'project_id' => 'required|exists:projects,id',
            'role' => 'required|in:manager,member,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $project = $team->projects()->where('id', $request->project_id)->first();
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project does not belong to this team'
            ], 422);
        }

        $existingMember = $project->members()->where('user_id', $request->user_id)->first();
        
        if ($existingMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this project'
            ], 409);
        }

        $member = $project->members()->create([
            'user_id' => $request->user_id,
            'role' => $request->role,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Member added to team project successfully',
            'data' => $member->load('user')
        ], 201);
    }

    public function removeMember(Team $team, User $user)
    {
        $removedCount = 0;
        
        foreach ($team->projects as $project) {
            $member = $project->members()->where('user_id', $user->id)->first();
            if ($member && $member->role !== 'owner') {
                $member->delete();
                $removedCount++;
            }
        }

        if ($removedCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of any projects in this team or is a project owner'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "User removed from {$removedCount} team project(s) successfully"
        ]);
    }
}

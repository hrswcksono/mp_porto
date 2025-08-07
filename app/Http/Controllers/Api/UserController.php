<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'timezone' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:10',
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $defaultRole = Role::where('slug', 'member')->first();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'bio' => $request->bio,
            'timezone' => $request->timezone ?? 'UTC',
            'language' => $request->language ?? 'en',
            'role_id' => $request->role_id ?? $defaultRole?->id,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user->load('role')
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user->load([
                'role',
                'ownedProjects' => function ($query) {
                    $query->with('team')->latest()->take(5);
                },
                'projectMemberships' => function ($query) {
                    $query->with('project.team')->where('is_active', true)->latest()->take(5);
                },
                'assignedTasks' => function ($query) {
                    $query->with('project')->where('status', '!=', 'done')->latest()->take(5);
                }
            ])
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:10',
            'preferences' => 'nullable|array',
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'name', 'email', 'phone', 'bio', 'avatar', 'timezone',
            'language', 'preferences', 'role_id', 'is_active'
        ]);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->load('role')
        ]);
    }

    public function destroy(User $user)
    {
        if ($user->ownedProjects()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete user who owns projects. Transfer ownership first.'
            ], 409);
        }

        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'User deactivated successfully'
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'data' => $user->load([
                'role',
                'ownedProjects.team',
                'projectMemberships.project.team',
                'assignedTasks.project'
            ])
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:10',
            'preferences' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only([
            'name', 'phone', 'bio', 'avatar', 'timezone', 'language', 'preferences'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user->load('role')
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();

        $stats = [
            'owned_projects' => $user->ownedProjects()->count(),
            'member_projects' => $user->projectMemberships()->where('is_active', true)->count(),
            'assigned_tasks' => $user->assignedTasks()->where('status', '!=', 'done')->count(),
            'completed_tasks' => $user->assignedTasks()->where('status', 'done')->count(),
            'overdue_tasks' => $user->assignedTasks()
                ->where('due_date', '<', now())
                ->where('status', '!=', 'done')
                ->count(),
            'time_tracked_today' => $user->timeTrackings()
                ->whereDate('started_at', today())
                ->sum('duration_minutes'),
        ];

        $recentProjects = $user->projects()
            ->with('team')
            ->orderBy('project_members.created_at', 'desc')
            ->take(5)
            ->get();

        $recentTasks = $user->assignedTasks()
            ->with('project')
            ->where('status', '!=', 'done')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_projects' => $recentProjects,
                'recent_tasks' => $recentTasks,
            ]
        ]);
    }
}

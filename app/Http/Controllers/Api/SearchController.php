<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Comment;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SearchController extends Controller
{
    use AuthorizesRequests;

    public function global(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
            'types' => 'nullable|array',
            'types.*' => 'in:projects,tasks,users,comments,documents',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = $request->input('query');
        $types = $request->types ?? ['projects', 'tasks', 'users', 'comments', 'documents'];
        $limit = $request->limit ?? 10;
        $results = [];

        if (in_array('projects', $types)) {
            $projects = $this->searchProjects($query, $limit);
            $results['projects'] = $projects;
        }

        if (in_array('tasks', $types)) {
            $tasks = $this->searchTasks($query, $limit);
            $results['tasks'] = $tasks;
        }

        if (in_array('users', $types)) {
            $users = $this->searchUsers($query, $limit);
            $results['users'] = $users;
        }

        if (in_array('comments', $types)) {
            $comments = $this->searchComments($query, $limit);
            $results['comments'] = $comments;
        }

        if (in_array('documents', $types)) {
            $documents = $this->searchDocuments($query, $limit);
            $results['documents'] = $documents;
        }

        return response()->json([
            'success' => true,
            'data' => $results,
            'query' => $query
        ]);
    }

    public function projects(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'nullable|string',
            'status' => 'nullable|in:draft,active,on_hold,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'member_id' => 'nullable|exists:users,id',
            'sort_by' => 'nullable|in:name,created_at,updated_at,start_date,end_date',
            'sort_order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Project::with(['members', 'tasks'])
            ->whereHas('members', function ($q) {
                $q->where('user_id', auth()->id())->where('is_active', true);
            });

        if ($request->query) {
            $searchQuery = $request->query;
            $query->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                  ->orWhere('description', 'like', "%{$searchQuery}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('start_date', [$request->start_date, $request->end_date]);
        }

        if ($request->member_id) {
            $query->whereHas('members', function ($q) use ($request) {
                $q->where('user_id', $request->member_id)->where('is_active', true);
            });
        }

        $sortBy = $request->sort_by ?? 'updated_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $projects = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $projects
        ]);
    }

    public function tasks(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'project_id' => 'nullable|exists:projects,id',
            'due_date_from' => 'nullable|date',
            'due_date_to' => 'nullable|date|after_or_equal:due_date_from',
            'overdue' => 'nullable|boolean',
            'sort_by' => 'nullable|in:title,created_at,updated_at,due_date,priority',
            'sort_order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Task::with(['project', 'assignee', 'creator'])
            ->whereHas('project.members', function ($q) {
                $q->where('user_id', auth()->id())->where('is_active', true);
            });

        if ($request->query) {
            $searchQuery = $request->query;
            $query->where(function ($q) use ($searchQuery) {
                $q->where('title', 'like', "%{$searchQuery}%")
                  ->orWhere('description', 'like', "%{$searchQuery}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->due_date_from && $request->due_date_to) {
            $query->whereBetween('due_date', [$request->due_date_from, $request->due_date_to]);
        }

        if ($request->overdue) {
            $query->where('due_date', '<', now())
                  ->where('status', '!=', 'done');
        }

        $sortBy = $request->sort_by ?? 'updated_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $tasks = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    public function users(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'nullable|boolean',
            'sort_by' => 'nullable|in:name,email,created_at',
            'sort_order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = User::with(['role']);

        if ($request->query) {
            $searchQuery = $request->query;
            $query->where(function ($q) use ($searchQuery) {
                $q->where('name', 'like', "%{$searchQuery}%")
                  ->orWhere('email', 'like', "%{$searchQuery}%");
            });
        }

        if ($request->role_id) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $sortBy = $request->sort_by ?? 'name';
        $sortOrder = $request->sort_order ?? 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function suggestions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1',
            'type' => 'required|in:projects,tasks,users',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = $request->input('query');
        $limit = $request->limit ?? 10;
        $suggestions = [];

        switch ($request->type) {
            case 'projects':
                $suggestions = Project::whereHas('members', function ($q) {
                        $q->where('user_id', auth()->id())->where('is_active', true);
                    })
                    ->where('name', 'like', "%{$query}%")
                    ->select('id', 'name')
                    ->limit($limit)
                    ->get();
                break;

            case 'tasks':
                $suggestions = Task::whereHas('project.members', function ($q) {
                        $q->where('user_id', auth()->id())->where('is_active', true);
                    })
                    ->where('title', 'like', "%{$query}%")
                    ->select('id', 'title as name', 'project_id')
                    ->with('project:id,name')
                    ->limit($limit)
                    ->get();
                break;

            case 'users':
                $suggestions = User::where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->select('id', 'name', 'email')
                    ->limit($limit)
                    ->get();
                break;
        }

        return response()->json([
            'success' => true,
            'data' => $suggestions
        ]);
    }

    private function searchProjects($query, $limit)
    {
        return Project::whereHas('members', function ($q) {
                $q->where('user_id', auth()->id())->where('is_active', true);
            })
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'description', 'status')
            ->limit($limit)
            ->get();
    }

    private function searchTasks($query, $limit)
    {
        return Task::whereHas('project.members', function ($q) {
                $q->where('user_id', auth()->id())->where('is_active', true);
            })
            ->where(function ($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->select('id', 'title', 'description', 'status', 'project_id')
            ->with('project:id,name')
            ->limit($limit)
            ->get();
    }

    private function searchUsers($query, $limit)
    {
        return User::where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email')
            ->limit($limit)
            ->get();
    }

    private function searchComments($query, $limit)
    {
        return Comment::where('content', 'like', "%{$query}%")
            ->whereHas('commentable', function ($q) {
                $q->whereHas('members', function ($memberQuery) {
                    $memberQuery->where('user_id', auth()->id())->where('is_active', true);
                });
            })
            ->select('id', 'content', 'commentable_type', 'commentable_id', 'user_id')
            ->with(['user:id,name', 'commentable'])
            ->limit($limit)
            ->get();
    }

    private function searchDocuments($query, $limit)
    {
        return Document::where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->whereHas('documentable', function ($q) {
                $q->whereHas('members', function ($memberQuery) {
                    $memberQuery->where('user_id', auth()->id())->where('is_active', true);
                });
            })
            ->select('id', 'name', 'description', 'type', 'documentable_type', 'documentable_id')
            ->with('documentable')
            ->limit($limit)
            ->get();
    }
}

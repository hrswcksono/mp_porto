<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CommentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'commentable_type' => 'required|in:App\Models\Project,App\Models\Task',
            'commentable_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->commentable_type === Project::class) {
            $project = Project::findOrFail($request->commentable_id);
            $this->authorize('view', $project);
        } elseif ($request->commentable_type === Task::class) {
            $task = Task::findOrFail($request->commentable_id);
            $this->authorize('view', $task->project);
        }

        $query = Comment::where('commentable_type', $request->commentable_type)
            ->where('commentable_id', $request->commentable_id)
            ->with(['user', 'replies.user', 'mentions'])
            ->whereNull('parent_id');

        $comments = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'commentable_type' => 'required|in:App\Models\Project,App\Models\Task',
            'commentable_id' => 'required|integer',
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

        if ($request->commentable_type === Project::class) {
            $project = Project::findOrFail($request->commentable_id);
            $this->authorize('view', $project);
        } elseif ($request->commentable_type === Task::class) {
            $task = Task::findOrFail($request->commentable_id);
            $this->authorize('view', $task->project);
        }

        if ($request->parent_id) {
            $parentComment = Comment::findOrFail($request->parent_id);
            if ($parentComment->commentable_type !== $request->commentable_type || 
                $parentComment->commentable_id != $request->commentable_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent comment does not belong to the same entity'
                ], 422);
            }
        }

        $comment = Comment::create([
            'content' => $request->content,
            'commentable_type' => $request->commentable_type,
            'commentable_id' => $request->commentable_id,
            'user_id' => $request->user()->id,
            'parent_id' => $request->parent_id,
        ]);

        if ($request->mentions) {
            $comment->mentions()->attach($request->mentions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment created successfully',
            'data' => $comment->load(['user', 'mentions'])
        ], 201);
    }

    public function show(Comment $comment)
    {
        if ($comment->commentable_type === Project::class) {
            $this->authorize('view', $comment->commentable);
        } elseif ($comment->commentable_type === Task::class) {
            $this->authorize('view', $comment->commentable->project);
        }

        return response()->json([
            'success' => true,
            'data' => $comment->load(['user', 'replies.user', 'mentions', 'commentable'])
        ]);
    }

    public function update(Request $request, Comment $comment)
    {
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own comments'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
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

        $comment->update([
            'content' => $request->content,
            'is_edited' => true,
        ]);

        if ($request->has('mentions')) {
            $comment->mentions()->sync($request->mentions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'data' => $comment->load(['user', 'mentions'])
        ]);
    }

    public function destroy(Comment $comment)
    {
        if ($comment->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own comments'
            ], 403);
        }

        $comment->replies()->delete();
        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ]);
    }

    public function getReplies(Comment $comment)
    {
        if ($comment->commentable_type === Project::class) {
            $this->authorize('view', $comment->commentable);
        } elseif ($comment->commentable_type === Task::class) {
            $this->authorize('view', $comment->commentable->project);
        }

        $replies = $comment->replies()
            ->with(['user', 'mentions'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $replies
        ]);
    }

    public function like(Comment $comment)
    {
        if ($comment->commentable_type === Project::class) {
            $this->authorize('view', $comment->commentable);
        } elseif ($comment->commentable_type === Task::class) {
            $this->authorize('view', $comment->commentable->project);
        }

        $userId = auth()->id();
        $likes = $comment->likes ?? [];

        if (!in_array($userId, $likes)) {
            $likes[] = $userId;
            $comment->update(['likes' => $likes]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment liked successfully',
            'data' => [
                'likes_count' => count($likes),
                'is_liked' => true
            ]
        ]);
    }

    public function unlike(Comment $comment)
    {
        if ($comment->commentable_type === Project::class) {
            $this->authorize('view', $comment->commentable);
        } elseif ($comment->commentable_type === Task::class) {
            $this->authorize('view', $comment->commentable->project);
        }

        $userId = auth()->id();
        $likes = $comment->likes ?? [];

        if (($key = array_search($userId, $likes)) !== false) {
            unset($likes[$key]);
            $comment->update(['likes' => array_values($likes)]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment unliked successfully',
            'data' => [
                'likes_count' => count($likes),
                'is_liked' => false
            ]
        ]);
    }

    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3',
            'commentable_type' => 'nullable|in:App\Models\Project,App\Models\Task',
            'commentable_id' => 'nullable|integer',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Comment::with(['user', 'commentable'])
            ->where('content', 'like', '%' . $request->query . '%');

        if ($request->commentable_type && $request->commentable_id) {
            $query->where('commentable_type', $request->commentable_type)
                  ->where('commentable_id', $request->commentable_id);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $query->whereHas('commentable', function ($q) {
            $q->whereHas('members', function ($memberQuery) {
                $memberQuery->where('user_id', auth()->id())->where('is_active', true);
            });
        });

        $comments = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function getMyComments(Request $request)
    {
        $comments = Comment::where('user_id', $request->user()->id)
            ->with(['commentable', 'replies'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }

    public function getMentions(Request $request)
    {
        $comments = Comment::whereHas('mentions', function ($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })
            ->with(['user', 'commentable'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class NotificationController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $query = Notification::where('user_id', $request->user()->id)
            ->with(['notifiable']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('read_status')) {
            if ($request->read_status === 'read') {
                $query->whereNotNull('read_at');
            } elseif ($request->read_status === 'unread') {
                $query->whereNull('read_at');
            }
        }

        $notifications = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    public function show(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $notification->load('notifiable')
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification
        ]);
    }

    public function markAsUnread(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        $notification->update(['read_at' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as unread',
            'data' => $notification
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $updated = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => "Marked {$updated} notifications as read"
        ]);
    }

    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to notification'
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully'
        ]);
    }

    public function getUnreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count]
        ]);
    }

    public function createNotification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'notifiable_type' => 'nullable|string',
            'notifiable_id' => 'nullable|integer',
            'action_url' => 'nullable|url',
            'priority' => 'nullable|in:low,medium,high,urgent',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $notification = Notification::create([
            'user_id' => $request->user_id,
            'type' => $request->type,
            'title' => $request->title,
            'message' => $request->message,
            'notifiable_type' => $request->notifiable_type,
            'notifiable_id' => $request->notifiable_id,
            'action_url' => $request->action_url,
            'priority' => $request->priority ?? 'medium',
            'data' => $request->data ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification created successfully',
            'data' => $notification
        ], 201);
    }

    public function getSettings(Request $request)
    {
        $user = $request->user();
        $settings = $user->notification_settings ?? [
            'email_notifications' => true,
            'push_notifications' => true,
            'task_assignments' => true,
            'task_due_dates' => true,
            'project_updates' => true,
            'comments' => true,
            'mentions' => true,
        ];

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email_notifications' => 'nullable|boolean',
            'push_notifications' => 'nullable|boolean',
            'task_assignments' => 'nullable|boolean',
            'task_due_dates' => 'nullable|boolean',
            'project_updates' => 'nullable|boolean',
            'comments' => 'nullable|boolean',
            'mentions' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $currentSettings = $user->notification_settings ?? [];
        $newSettings = array_merge($currentSettings, $request->only([
            'email_notifications',
            'push_notifications',
            'task_assignments',
            'task_due_dates',
            'project_updates',
            'comments',
            'mentions',
        ]));

        $user->update(['notification_settings' => $newSettings]);

        return response()->json([
            'success' => true,
            'message' => 'Notification settings updated successfully',
            'data' => $newSettings
        ]);
    }

    public function getReminders(Request $request)
    {
        $validator = Validator::make($request->all(), [
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

        $query = Notification::where('user_id', $request->user()->id)
            ->where('type', 'reminder')
            ->with(['notifiable']);

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $reminders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $reminders
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:notifications,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $deleted = Notification::where('user_id', $request->user()->id)
            ->whereIn('id', $request->notification_ids)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} notifications successfully"
        ]);
    }
}

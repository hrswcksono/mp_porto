<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SearchController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('projects', ProjectController::class);
    Route::apiResource('projects.tasks', TaskController::class)->shallow();
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('users', UserController::class);
    
    Route::prefix('user')->group(function () {
        Route::get('profile', [UserController::class, 'profile']);
        Route::put('profile', [UserController::class, 'updateProfile']);
        Route::post('change-password', [UserController::class, 'changePassword']);
        Route::get('dashboard', [UserController::class, 'dashboard']);
    });
    
    Route::prefix('projects/{project}')->group(function () {
        Route::get('members', [ProjectController::class, 'members']);
        Route::post('members', [ProjectController::class, 'addMember']);
        Route::put('members/{user}', [ProjectController::class, 'updateMember']);
        Route::delete('members/{user}', [ProjectController::class, 'removeMember']);
        Route::get('statistics', [ProjectController::class, 'statistics']);
    });
    
    Route::prefix('tasks/{task}')->group(function () {
        Route::post('assign', [TaskController::class, 'assign']);
        Route::delete('assign/{user}', [TaskController::class, 'unassign']);
        Route::post('time-tracking/start', [TaskController::class, 'startTimeTracking']);
        Route::post('time-tracking/stop', [TaskController::class, 'stopTimeTracking']);
        Route::get('time-tracking', [TaskController::class, 'getTimeTracking']);
        Route::post('comments', [TaskController::class, 'addComment']);
        Route::get('comments', [TaskController::class, 'getComments']);
    });
    
    Route::prefix('teams/{team}')->group(function () {
        Route::get('members', [TeamController::class, 'members']);
        Route::post('members', [TeamController::class, 'addMember']);
        Route::delete('members/{user}', [TeamController::class, 'removeMember']);
    });
    
    Route::apiResource('documents', DocumentController::class);
    Route::prefix('documents/{document}')->group(function () {
        Route::get('download', [DocumentController::class, 'download']);
        Route::post('versions', [DocumentController::class, 'createVersion']);
        Route::get('versions', [DocumentController::class, 'getVersions']);
    });
    
    Route::prefix('calendar')->group(function () {
        Route::get('/', [CalendarController::class, 'index']);
        Route::get('gantt', [CalendarController::class, 'gantt']);
        Route::put('tasks/{task}/dates', [CalendarController::class, 'updateTaskDates']);
        Route::put('tasks/{task}/order', [CalendarController::class, 'updateTaskOrder']);
        Route::get('milestones', [CalendarController::class, 'milestones']);
        Route::get('workload', [CalendarController::class, 'workload']);
    });
    
    Route::prefix('reports')->group(function () {
        Route::get('time-tracking', [ReportController::class, 'timeTracking']);
        Route::get('project-statistics', [ReportController::class, 'projectStatistics']);
        Route::get('task-analytics', [ReportController::class, 'taskAnalytics']);
        Route::get('user-performance', [ReportController::class, 'userPerformance']);
        Route::post('export', [ReportController::class, 'exportReport']);
    });
    
    Route::apiResource('notifications', NotificationController::class);
    Route::prefix('notifications')->group(function () {
        Route::post('create', [NotificationController::class, 'createNotification']);
        Route::get('unread-count', [NotificationController::class, 'getUnreadCount']);
        Route::post('mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('bulk-delete', [NotificationController::class, 'bulkDelete']);
        Route::get('reminders', [NotificationController::class, 'getReminders']);
        Route::get('settings', [NotificationController::class, 'getSettings']);
        Route::put('settings', [NotificationController::class, 'updateSettings']);
    });
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('notifications/{notification}/unread', [NotificationController::class, 'markAsUnread']);
    
    Route::apiResource('comments', CommentController::class);
    Route::prefix('comments')->group(function () {
        Route::get('search', [CommentController::class, 'search']);
        Route::get('my-comments', [CommentController::class, 'getMyComments']);
        Route::get('mentions', [CommentController::class, 'getMentions']);
    });
    Route::get('comments/{comment}/replies', [CommentController::class, 'getReplies']);
    Route::post('comments/{comment}/like', [CommentController::class, 'like']);
    Route::delete('comments/{comment}/like', [CommentController::class, 'unlike']);
    
    Route::prefix('search')->group(function () {
        Route::get('global', [SearchController::class, 'global']);
        Route::get('projects', [SearchController::class, 'projects']);
        Route::get('tasks', [SearchController::class, 'tasks']);
        Route::get('users', [SearchController::class, 'users']);
        Route::get('suggestions', [SearchController::class, 'suggestions']);
    });
});

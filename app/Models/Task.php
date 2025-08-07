<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'start_date',
        'due_date',
        'estimated_hours',
        'actual_hours',
        'progress',
        'checklist',
        'tags',
        'project_id',
        'parent_task_id',
        'created_by',
        'assigned_to',
        'dependencies',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'estimated_hours' => 'integer',
            'actual_hours' => 'integer',
            'progress' => 'integer',
            'checklist' => 'array',
            'dependencies' => 'array',
            'order' => 'integer',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function parentTask()
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function subtasks()
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_assignments')->withPivot('type', 'assigned_at', 'assigned_by');
    }

    public function timeTrackings()
    {
        return $this->hasMany(TimeTracking::class);
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}

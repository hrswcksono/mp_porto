<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
        'priority',
        'start_date',
        'end_date',
        'budget',
        'progress',
        'color',
        'is_public',
        'owner_id',
        'team_id',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'budget' => 'decimal:2',
            'progress' => 'integer',
            'is_public' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function members()
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'project_members')->withPivot('role', 'permissions', 'is_active', 'joined_at');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
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

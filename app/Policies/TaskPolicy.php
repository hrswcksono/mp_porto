<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task)
    {
        $project = $task->project;
        return $project->owner_id === $user->id || 
               $project->members()->where('user_id', $user->id)->where('is_active', true)->exists() ||
               $project->is_public;
    }

    public function create(User $user, $project)
    {
        return $project->owner_id === $user->id || 
               $project->members()->where('user_id', $user->id)->where('is_active', true)->exists();
    }

    public function update(User $user, Task $task)
    {
        $project = $task->project;
        
        if ($project->owner_id === $user->id || $task->created_by === $user->id || $task->assigned_to === $user->id) {
            return true;
        }

        $member = $project->members()->where('user_id', $user->id)->where('is_active', true)->first();
        return $member && in_array($member->role, ['owner', 'manager']);
    }

    public function delete(User $user, Task $task)
    {
        $project = $task->project;
        
        if ($project->owner_id === $user->id || $task->created_by === $user->id) {
            return true;
        }

        $member = $project->members()->where('user_id', $user->id)->where('is_active', true)->first();
        return $member && $member->role === 'manager';
    }
}

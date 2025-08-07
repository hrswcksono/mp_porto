<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function view(User $user, Project $project)
    {
        return $project->owner_id === $user->id || 
               $project->members()->where('user_id', $user->id)->where('is_active', true)->exists() ||
               $project->is_public;
    }

    public function create(User $user)
    {
        return $user->is_active;
    }

    public function update(User $user, Project $project)
    {
        if ($project->owner_id === $user->id) {
            return true;
        }

        $member = $project->members()->where('user_id', $user->id)->where('is_active', true)->first();
        return $member && in_array($member->role, ['owner', 'manager']);
    }

    public function delete(User $user, Project $project)
    {
        return $project->owner_id === $user->id;
    }

    public function manageMembers(User $user, Project $project)
    {
        if ($project->owner_id === $user->id) {
            return true;
        }

        $member = $project->members()->where('user_id', $user->id)->where('is_active', true)->first();
        return $member && in_array($member->role, ['owner', 'manager']);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'is_active',
        'leader_id',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}

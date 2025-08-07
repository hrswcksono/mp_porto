<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeTracking extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',
        'description',
        'started_at',
        'ended_at',
        'duration_minutes',
        'is_manual',
        'is_billable',
        'hourly_rate',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'duration_minutes' => 'integer',
            'is_manual' => 'boolean',
            'is_billable' => 'boolean',
            'hourly_rate' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

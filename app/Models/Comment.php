<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'content',
        'commentable_type',
        'commentable_id',
        'user_id',
        'parent_id',
        'mentions',
        'is_edited',
        'edited_at',
    ];

    protected function casts(): array
    {
        return [
            'mentions' => 'array',
            'is_edited' => 'boolean',
            'edited_at' => 'datetime',
        ];
    }

    public function commentable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}

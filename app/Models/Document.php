<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = [
        'name',
        'original_name',
        'file_path',
        'mime_type',
        'file_size',
        'file_hash',
        'version',
        'description',
        'visibility',
        'documentable_type',
        'documentable_id',
        'uploaded_by',
        'folder_id',
        'is_folder',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'version' => 'integer',
            'is_folder' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function documentable()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function folder()
    {
        return $this->belongsTo(Document::class, 'folder_id');
    }

    public function children()
    {
        return $this->hasMany(Document::class, 'folder_id');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $query = Document::with(['user', 'documentable']);

        if ($request->has('project_id')) {
            $query->where('documentable_type', Project::class)
                  ->where('documentable_id', $request->project_id);
        }

        if ($request->has('task_id')) {
            $query->where('documentable_type', Task::class)
                  ->where('documentable_id', $request->task_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $documents
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10240',
            'documentable_type' => 'required|in:App\Models\Project,App\Models\Task',
            'documentable_id' => 'required|integer',
            'type' => 'nullable|in:document,image,video,other',
            'is_public' => 'nullable|boolean',
            'folder' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->documentable_type === Project::class) {
            $project = Project::findOrFail($request->documentable_id);
            $this->authorize('view', $project);
        } elseif ($request->documentable_type === Task::class) {
            $task = Task::findOrFail($request->documentable_id);
            $this->authorize('view', $task->project);
        }

        $file = $request->file('file');
        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('documents', $filename, 'public');

        $document = Document::create([
            'name' => $request->name,
            'description' => $request->description,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'type' => $request->type ?? $this->getDocumentType($file->getMimeType()),
            'documentable_type' => $request->documentable_type,
            'documentable_id' => $request->documentable_id,
            'user_id' => $request->user()->id,
            'is_public' => $request->is_public ?? false,
            'folder' => $request->folder,
            'version' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => $document->load('user')
        ], 201);
    }

    public function show(Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('view', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('view', $document->documentable->project);
        }

        return response()->json([
            'success' => true,
            'data' => $document->load(['user', 'documentable'])
        ]);
    }

    public function update(Request $request, Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('update', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('update', $document->documentable->project);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'nullable|boolean',
            'folder' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $document->update($request->only(['name', 'description', 'is_public', 'folder']));

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully',
            'data' => $document->load('user')
        ]);
    }

    public function destroy(Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('update', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('update', $document->documentable->project);
        }

        Storage::disk('public')->delete($document->path);
        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully'
        ]);
    }

    public function download(Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('view', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('view', $document->documentable->project);
        }

        if (!Storage::disk('public')->exists($document->path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);
        }

        return Storage::disk('public')->download($document->path, $document->original_name);
    }

    public function createVersion(Request $request, Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('update', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('update', $document->documentable->project);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $filename = time() . '_v' . ($document->version + 1) . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('documents', $filename, 'public');

        $newVersion = Document::create([
            'name' => $document->name,
            'description' => $request->description ?? $document->description,
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'type' => $this->getDocumentType($file->getMimeType()),
            'documentable_type' => $document->documentable_type,
            'documentable_id' => $document->documentable_id,
            'user_id' => $request->user()->id,
            'is_public' => $document->is_public,
            'folder' => $document->folder,
            'version' => $document->version + 1,
            'parent_id' => $document->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document version created successfully',
            'data' => $newVersion->load('user')
        ], 201);
    }

    public function getVersions(Document $document)
    {
        if ($document->documentable_type === Project::class) {
            $this->authorize('view', $document->documentable);
        } elseif ($document->documentable_type === Task::class) {
            $this->authorize('view', $document->documentable->project);
        }

        $versions = Document::where('parent_id', $document->id)
            ->orWhere('id', $document->id)
            ->with('user')
            ->orderBy('version', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $versions
        ]);
    }

    private function getDocumentType($mimeType)
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (in_array($mimeType, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
            return 'document';
        }
        
        return 'other';
    }
}

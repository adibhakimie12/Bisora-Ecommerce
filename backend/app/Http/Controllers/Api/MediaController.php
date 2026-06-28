<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MediaController extends Controller
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'application/pdf',
        'text/csv',
    ];

    public function presign(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $maxBytes = config('bisora.storage.max_upload_mb') * 1024 * 1024;
        $validated = $request->validate([
            'filename' => ['required', 'string', 'max:180'],
            'mime_type' => ['required', Rule::in(self::ALLOWED_MIME_TYPES)],
            'size_bytes' => ['required', 'integer', 'min:1', 'max:'.$maxBytes],
            'owner_type' => ['nullable', Rule::in(['product', 'category', 'page', 'theme', 'blog', 'store'])],
            'owner_id' => ['nullable', 'integer', 'min:1'],
            'visibility' => ['nullable', Rule::in(['public', 'private'])],
        ]);

        $visibility = $validated['visibility'] ?? 'public';
        $bucket = $visibility === 'private'
            ? config('bisora.storage.private_bucket')
            : config('bisora.storage.public_bucket');
        $safeFilename = Str::slug(pathinfo($validated['filename'], PATHINFO_FILENAME));
        $extension = pathinfo($validated['filename'], PATHINFO_EXTENSION);
        $finalFilename = trim(Str::random(8).'-'.$safeFilename.($extension ? '.'.$extension : ''), '-');
        $objectKey = "{$tenant->id}/{$visibility}/{$finalFilename}";

        $asset = MediaAsset::create([
            'tenant_id' => $tenant->id,
            'bucket' => $bucket,
            'object_key' => $objectKey,
            'filename' => $validated['filename'],
            'mime_type' => $validated['mime_type'],
            'size_bytes' => $validated['size_bytes'],
            'visibility' => $visibility,
            'owner_type' => $validated['owner_type'] ?? null,
            'owner_id' => $validated['owner_id'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'bucket' => $asset->bucket,
                'object_key' => $asset->object_key,
                'status' => $asset->status,
                ...$this->uploadIntent($asset),
            ],
        ], 201);
    }

    public function complete(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $validated = $request->validate([
            'media_asset_id' => ['required', 'integer'],
            'checksum' => ['nullable', 'string', 'max:160'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
        ]);

        $asset = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->findOrFail($validated['media_asset_id']);

        $asset->update([
            'status' => 'ready',
            'checksum' => $validated['checksum'] ?? null,
            'width' => $validated['width'] ?? null,
            'height' => $validated['height'] ?? null,
        ]);

        return response()->json([
            'data' => [
                ...$asset->fresh()->toArray(),
                'public_url' => $this->publicUrl($asset),
            ],
        ]);
    }

    public function localUploadPlaceholder(MediaAsset $mediaAsset): JsonResponse
    {
        return response()->json([
            'message' => 'Use Supabase S3 direct upload in production.',
            'media_asset_id' => $mediaAsset->id,
        ]);
    }

    private function publicUrl(MediaAsset $asset): ?string
    {
        if ($asset->visibility !== 'public') {
            return null;
        }

        return rtrim((string) config('filesystems.disks.supabase.url'), '/').'/'.$asset->bucket.'/'.$asset->object_key;
    }

    private function uploadIntent(MediaAsset $asset): array
    {
        if (config('filesystems.default') !== 'supabase') {
            return [
                'upload_url' => route('media.local-upload-placeholder', ['mediaAsset' => $asset->id], false),
                'headers' => [
                    'Content-Type' => $asset->mime_type,
                    'x-bisora-object-key' => $asset->object_key,
                ],
            ];
        }

        $diskConfig = [
            ...config('filesystems.disks.supabase'),
            'bucket' => $asset->bucket,
        ];
        $intent = Storage::build($diskConfig)->temporaryUploadUrl(
            $asset->object_key,
            now()->addMinutes(15),
            ['ContentType' => $asset->mime_type],
        );

        return [
            'upload_url' => $intent['url'],
            'headers' => [
                ...($intent['headers'] ?? []),
                'Content-Type' => $asset->mime_type,
                'x-bisora-object-key' => $asset->object_key,
            ],
        ];
    }
}

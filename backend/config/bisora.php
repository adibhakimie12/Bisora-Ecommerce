<?php

return [
    'owner_email' => env('BISORA_OWNER_EMAIL', 'owner@bisora.my'),
    'default_plan' => env('BISORA_DEFAULT_PLAN', 'premium'),

    'storage' => [
        'public_bucket' => env('SUPABASE_STORAGE_BUCKET_PUBLIC', 'public-storefront-media'),
        'private_bucket' => env('SUPABASE_STORAGE_BUCKET_PRIVATE', 'private-store-documents'),
        'max_upload_mb' => (int) env('BISORA_MAX_UPLOAD_MB', 20),
    ],

    'plans' => [
        'basic' => ['products' => 30, 'storage_mb' => 500, 'pages' => 50],
        'standard' => ['products' => 200, 'storage_mb' => 2000, 'pages' => 250],
        'premium' => ['products' => 1000, 'storage_mb' => 10000, 'pages' => 999],
    ],
];

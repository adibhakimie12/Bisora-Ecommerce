<?php

return [
    'owner_email' => env('BISORA_OWNER_EMAIL', 'adib.hakimi19@gmail.com'),
    'default_plan' => env('BISORA_DEFAULT_PLAN', 'Free Trial'),
    'trial_days' => (int) env('BISORA_TRIAL_DAYS', 14),
    'notification_delivery_mode' => env('BISORA_NOTIFICATION_DELIVERY_MODE', 'log'),

    'storage' => [
        'public_bucket' => env('SUPABASE_STORAGE_BUCKET_PUBLIC', 'public-storefront-media'),
        'private_bucket' => env('SUPABASE_STORAGE_BUCKET_PRIVATE', 'private-store-documents'),
        'max_upload_mb' => (int) env('BISORA_MAX_UPLOAD_MB', 5),
    ],

    'plans' => [
        'free trial' => ['products' => 15, 'storage_mb' => 250, 'pages' => 3, 'forms' => 1],
        'basic' => ['products' => 30, 'storage_mb' => 500, 'pages' => 10, 'forms' => 3],
        'standard' => ['products' => 200, 'storage_mb' => 2000, 'pages' => 100, 'forms' => 25],
        'premium' => ['products' => 1000, 'storage_mb' => 10000, 'pages' => 999, 'forms' => 999],
    ],
];

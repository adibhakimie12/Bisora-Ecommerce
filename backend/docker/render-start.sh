#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"

php artisan config:clear --no-ansi
php artisan route:clear --no-ansi
php artisan view:clear --no-ansi

php artisan migrate --force --no-ansi

if [ "${BISORA_SEED_ON_BOOT:-false}" = "true" ]; then
    php artisan db:seed --force --no-ansi
fi

php artisan config:cache --no-ansi
php artisan route:cache --no-ansi
php artisan view:cache --no-ansi

exec php artisan serve --host=0.0.0.0 --port="${PORT}"

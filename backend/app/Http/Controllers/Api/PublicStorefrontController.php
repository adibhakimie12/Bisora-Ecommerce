<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Services\OrderNotificationAutomation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PublicStorefrontController extends Controller
{
    public function __construct(private readonly OrderNotificationAutomation $notifications)
    {
    }

    public function show(string $store): JsonResponse
    {
        $store = $this->liveStore($store);

        return response()->json([
            'data' => [
                'store' => $this->storePayload($store),
                'pages' => $this->publishedContent($store, 'website_pages'),
                'blog_posts' => $this->publishedContent($store, 'blog_posts'),
                'products' => Product::query()
                    ->where('tenant_id', $store->tenant_id)
                    ->where('status', 'active')
                    ->with('category:id,name,slug')
                    ->latest()
                    ->get()
                    ->map(fn (Product $product): array => $this->productPayload($product))
                    ->values(),
            ],
        ]);
    }

    public function checkout(Request $request, string $store): JsonResponse
    {
        $store = $this->liveStore($store);
        $data = $request->validate([
            'customer.name' => ['required', 'string', 'max:120'],
            'customer.email' => ['required', 'email', 'max:160'],
            'customer.phone' => ['nullable', 'string', 'max:40'],
            'shipping_address.address_line_1' => ['required', 'string', 'max:180'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:180'],
            'shipping_address.city' => ['required', 'string', 'max:120'],
            'shipping_address.state' => ['nullable', 'string', 'max:120'],
            'shipping_address.postcode' => ['nullable', 'string', 'max:40'],
            'shipping_address.country' => ['required', 'string', 'max:120'],
            'shipping_method' => ['nullable', 'array'],
            'shipping_method.id' => ['nullable', 'string', 'max:120'],
            'shipping_method.label' => ['nullable', 'string', 'max:180'],
            'shipping_method.zone_name' => ['nullable', 'string', 'max:120'],
            'shipping_method.courier' => ['nullable', 'string', 'max:120'],
            'shipping_method.service' => ['nullable', 'string', 'max:180'],
            'shipping_method.amount' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'payment_method' => ['nullable', 'string', 'max:80'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $productIds = collect($data['items'])->pluck('product_id')->unique()->values();
        $products = Product::query()
            ->where('tenant_id', $store->tenant_id)
            ->where('status', 'active')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        abort_if($products->count() !== $productIds->count(), 422, 'Cart contains unavailable products.');

        $items = collect($data['items'])->map(function (array $item) use ($products): array {
            /** @var Product $product */
            $product = $products->get($item['product_id']);
            $quantity = (int) $item['quantity'];

            abort_if($product->stock < $quantity, 422, "Not enough stock for {$product->title}.");

            return [
                'product_id' => (string) $product->id,
                'name' => $product->title,
                'sku' => $product->sku,
                'quantity' => $quantity,
                'price' => $product->price,
                'line_total' => $product->price * $quantity,
            ];
        })->values();

        $shippingMethod = $data['shipping_method'] ?? [];
        $shippingAmount = (int) data_get($shippingMethod, 'amount', 0);
        $shippingLabel = data_get($shippingMethod, 'label') ?: data_get($shippingMethod, 'service');
        $shippingCourier = data_get($shippingMethod, 'courier') ?: 'Not assigned';
        $total = $items->sum('line_total') + $shippingAmount;

        $order = DB::transaction(function () use ($data, $items, $shippingAmount, $shippingCourier, $shippingLabel, $shippingMethod, $store, $total): Order {
            $customer = CustomerProfile::query()->updateOrCreate(
                ['tenant_id' => $store->tenant_id, 'email' => $data['customer']['email']],
                [
                    'name' => $data['customer']['name'],
                    'status' => 'new',
                    'shipping_address' => $data['shipping_address'],
                    'member_since' => now()->toDateString(),
                ],
            );

            $order = Order::query()->create([
                'tenant_id' => $store->tenant_id,
                'customer_profile_id' => $customer->id,
                'number' => $this->nextOrderNumber($store->tenant_id),
                'total' => $total,
                'payment_status' => 'pending',
                'settlement_status' => 'unsettled',
                'fulfillment_status' => 'unfulfilled',
                'ordered_at' => now()->toDateString(),
                'payment_method' => $data['payment_method'] ?? 'manual_bank_transfer',
                'items' => $items->all(),
                'shipping_address' => [
                    ...$data['shipping_address'],
                    'recipient' => $data['customer']['name'],
                    'email' => $data['customer']['email'],
                    'phone' => $data['customer']['phone'] ?? null,
                ],
                'shipment' => [
                    'courier' => $shippingAmount > 0 || $shippingLabel ? $shippingCourier : null,
                    'method' => $shippingLabel,
                    'service' => data_get($shippingMethod, 'service'),
                    'zone_name' => data_get($shippingMethod, 'zone_name'),
                    'shipping_fee' => $shippingAmount,
                    'tracking_location' => $shippingLabel ? "{$shippingLabel} selected at checkout" : 'Order received',
                ],
            ]);

            $customer->update([
                'orders_count' => $customer->orders()->count(),
                'total_spent' => $customer->orders()->sum('total'),
                'last_order_at' => $order->ordered_at,
            ]);

            foreach ($items as $item) {
                Product::query()
                    ->where('tenant_id', $store->tenant_id)
                    ->where('id', $item['product_id'])
                    ->decrement('stock', $item['quantity']);
            }

            $this->notifications->orderPlaced($order->fresh()->load('customer:id,name,email,status'), $store);

            return $order;
        });

        return response()->json(['data' => $order->fresh()->load('customer:id,name,email,status')], 201);
    }

    public function order(Request $request, string $store, string $number): JsonResponse
    {
        $store = $this->liveStore($store);
        $data = $request->validate([
            'email' => ['required', 'email', 'max:160'],
        ]);

        $order = Order::query()
            ->where('tenant_id', $store->tenant_id)
            ->where('number', $number)
            ->whereHas('customer', fn ($query) => $query->where('email', $data['email']))
            ->with('customer:id,name,email,status')
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    private function liveStore(string $store): Store
    {
        $store = Store::query()
            ->where('slug', $store)
            ->orWhere('managed_domain', $store)
            ->orWhere('custom_domain', $store)
            ->firstOrFail();

        abort_unless(data_get($store->settings ?? [], 'storefront.status') === 'live', 404);

        return $store;
    }

    private function nextOrderNumber(int $tenantId): string
    {
        $count = Order::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('created_at', Carbon::today())
            ->count() + 1;

        return 'ORD-' . now()->format('ymd') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    private function storePayload(Store $store): array
    {
        $settings = $store->settings ?? [];
        $storefront = data_get($settings, 'storefront', []);

        return [
            'id' => (string) $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'managed_domain' => $store->managed_domain,
            'custom_domain' => $store->custom_domain,
            'currency' => $store->currency,
            'status' => data_get($storefront, 'status', 'draft'),
            'published_url' => data_get($storefront, 'published_url'),
            'branding' => data_get($settings, 'branding', []),
            'settings' => [
                'shipping' => data_get($settings, 'shipping', []),
            ],
        ];
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => (string) $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'price' => $product->price,
            'compare_at_price' => $product->compare_at_price,
            'stock' => $product->stock,
            'thumbnail_url' => $product->thumbnail_url,
            'image_urls' => $product->image_urls ?? [],
            'description' => $product->description,
            'vendor' => $product->vendor,
            'product_type' => $product->product_type,
            'tags' => $product->tags ?? [],
            'variants' => $product->variants ?? [],
            'seo_title' => $product->seo_title,
            'seo_description' => $product->seo_description,
            'category' => $product->category ? [
                'id' => (string) $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
        ];
    }

    private function publishedContent(Store $store, string $key): array
    {
        return collect(data_get($store->settings ?? [], $key, []))
            ->filter(fn (array $record): bool => strcasecmp((string) ($record['status'] ?? ''), 'published') === 0)
            ->values()
            ->all();
    }
}

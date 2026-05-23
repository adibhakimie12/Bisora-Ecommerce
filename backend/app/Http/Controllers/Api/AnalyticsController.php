<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $orders = $this->orders($tenant->id);
        $paidOrders = $orders->where('payment_status', 'paid');

        return response()->json([
            'data' => [
                'metrics' => [
                    'revenue' => $paidOrders->sum('total'),
                    'orders' => $orders->count(),
                    'customers' => CustomerProfile::where('tenant_id', $tenant->id)->count(),
                    'products' => Product::where('tenant_id', $tenant->id)->count(),
                    'conversion_rate' => 3.42,
                    'net_profit' => (int) round($paidOrders->sum('total') * 0.62),
                ],
                'revenue_trend' => $this->revenueTrend($orders),
                'recent_orders' => $orders->take(5)->values(),
                'activity' => $orders->take(4)->map(fn (Order $order): array => [
                    'id' => (string) $order->id,
                    'title' => "Order {$order->number} received",
                    'time' => optional($order->created_at)->diffForHumans() ?? 'Recently',
                    'href' => "#/orders/{$order->number}",
                ])->values(),
            ],
        ]);
    }

    public function reportsOverview(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('tenant');
        $orders = $this->orders($tenant->id);
        $paidOrders = $orders->where('payment_status', 'paid');
        $revenue = $paidOrders->sum('total');
        $orderCount = $orders->count();

        return response()->json([
            'data' => [
                'overview' => [
                    'total_revenue' => $revenue,
                    'total_orders' => $orderCount,
                    'conversion_rate' => 3.42,
                    'average_order_value' => $orderCount > 0 ? (int) round($orders->sum('total') / $orderCount) : 0,
                ],
                'revenue_performance' => $this->revenueTrend($orders)->map(fn (array $point): array => [
                    'label' => $point['label'],
                    'current' => $point['revenue'],
                    'previous' => 0,
                ])->values(),
                'top_products' => $this->topProducts($orders),
                'finance' => [
                    'cash_collected' => $revenue,
                    'in_settlement' => $paidOrders->whereIn('settlement_status', ['unsettled', 'processing'])->sum('total'),
                    'upcoming_payouts' => $paidOrders->where('settlement_status', 'processing')->sum('total'),
                    'exceptions' => $orders->where('payment_status', 'pending')->count(),
                ],
            ],
        ]);
    }

    private function orders(int $tenantId): Collection
    {
        return Order::query()
            ->where('tenant_id', $tenantId)
            ->with('customer:id,name,email,status')
            ->latest('ordered_at')
            ->latest()
            ->get();
    }

    private function revenueTrend(Collection $orders): Collection
    {
        return $orders
            ->groupBy(fn (Order $order): string => optional($order->ordered_at)->format('M d') ?? 'Unknown')
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'revenue' => $group->where('payment_status', 'paid')->sum('total'),
                'orders' => $group->count(),
            ])
            ->values();
    }

    private function topProducts(Collection $orders): Collection
    {
        $products = collect();

        foreach ($orders as $order) {
            foreach (($order->items ?? []) as $item) {
                $name = (string) ($item['name'] ?? 'Unknown product');
                $existing = $products->get($name, ['name' => $name, 'units' => 0, 'revenue' => 0]);
                $quantity = (int) ($item['quantity'] ?? 0);
                $price = (int) ($item['price'] ?? 0);
                $products->put($name, [
                    'id' => str($name)->slug()->toString(),
                    'name' => $name,
                    'category' => 'Storefront',
                    'image_url' => (string) ($item['image_url'] ?? ''),
                    'units' => $existing['units'] + $quantity,
                    'revenue' => $existing['revenue'] + ($quantity * $price),
                    'trend' => 'up',
                ]);
            }
        }

        return $products->sortByDesc('revenue')->values()->take(5);
    }
}

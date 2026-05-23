import assert from 'node:assert/strict';
import { mapDashboardFromApi, mapReportsOverviewFromApi } from './analytics';

function testMapsDashboardFromApi() {
  const dashboard = mapDashboardFromApi({
    metrics: {
      revenue: 45000,
      orders: 2,
      customers: 1,
      products: 3,
      conversion_rate: 3.42,
      net_profit: 27900,
    },
    revenue_trend: [{ label: 'Apr 21', revenue: 45000, orders: 1 }],
    recent_orders: [
      {
        id: 1,
        number: 'ORD-9021',
        total: 45000,
        payment_status: 'paid',
        fulfillment_status: 'processing',
        customer: { name: 'Amina', email: 'amina@example.test' },
      },
    ],
    activity: [{ id: '1', title: 'Order ORD-9021 received', time: '1 minute ago', href: '#/orders/ORD-9021' }],
  });

  assert.equal(dashboard.metrics[0].value, 'RM 450');
  assert.equal(dashboard.metrics[1].value, '2');
  assert.equal(dashboard.revenueTrend[0].revenue, 450);
  assert.equal(dashboard.recentTransactions[0].id, '#ORD-9021');
  assert.equal(dashboard.activity[0].title, 'Order ORD-9021 received');
}

function testMapsReportsOverviewFromApi() {
  const reports = mapReportsOverviewFromApi({
    overview: {
      total_revenue: 134000,
      total_orders: 2,
      conversion_rate: 3.42,
      average_order_value: 67000,
    },
    revenue_performance: [{ label: 'Apr 21', current: 45000, previous: 0 }],
    top_products: [{ id: 'premium-modal-hijab', name: 'Premium Modal Hijab', category: 'Storefront', image_url: '', revenue: 25800, units: 2, trend: 'up' }],
    finance: {
      cash_collected: 134000,
      in_settlement: 134000,
      upcoming_payouts: 89000,
      exceptions: 0,
    },
  });

  assert.equal(reports.overviewMetrics[0].value, 'RM 1,340');
  assert.equal(reports.overviewMetrics[3].value, 'RM 670');
  assert.equal(reports.revenuePerformance[0].current, 450);
  assert.equal(reports.financeKpis[0].value, 'RM 1,340');
  assert.equal(reports.topProducts[0].name, 'Premium Modal Hijab');
}

testMapsDashboardFromApi();
testMapsReportsOverviewFromApi();

console.log('analytics api tests passed');

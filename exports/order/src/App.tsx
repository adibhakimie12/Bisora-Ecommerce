import { useMemo, useState } from 'react';
import { BulkShipmentModal } from './components/BulkShipmentModal';
import { OrderDetailPage } from './components/OrderDetailPage';
import { OrdersListPage } from './components/OrdersListPage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { orders } from './data';

export type Route =
  | { name: 'orders' }
  | { name: 'order-detail'; orderId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'orders' });
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkShipment, setShowBulkShipment] = useState(false);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [selectedOrderIds],
  );

  const openOrder = (orderId: string) => {
    setRoute({ name: 'order-detail', orderId });
  };

  const closeBulkShipment = () => {
    setShowBulkShipment(false);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar activeItem="Orders" />

      <div className="min-h-screen lg:pl-64">
        <TopHeader />

        <main className="p-4 sm:p-6 lg:p-8">
          {route.name === 'orders' ? (
            <OrdersListPage
              selectedOrderIds={selectedOrderIds}
              onBulkShipment={() => setShowBulkShipment(true)}
              onOpenOrder={openOrder}
              onSelectionChange={setSelectedOrderIds}
            />
          ) : (
            <OrderDetailPage
              order={orders.find((order) => order.id === route.orderId) ?? orders[0]}
              onBack={() => setRoute({ name: 'orders' })}
              onGenerateShipment={(orderId) => {
                setSelectedOrderIds([orderId]);
                setShowBulkShipment(true);
              }}
            />
          )}
        </main>
      </div>

      {showBulkShipment && (
        <BulkShipmentModal orders={selectedOrders} onClose={closeBulkShipment} />
      )}
    </div>
  );
}

import type { FulfillmentStatus, ShippingAddress } from './types';

export type OrderDetailMenu = 'invoice' | 'status' | 'headerMore' | 'more';
export type SellerFulfillmentStage =
  | 'Awaiting processing'
  | 'Processing'
  | 'Packed'
  | 'Ready for pickup'
  | 'Shipped'
  | 'Delivered'
  | 'Completed';

const sellerFulfillmentStages: SellerFulfillmentStage[] = [
  'Awaiting processing',
  'Processing',
  'Packed',
  'Ready for pickup',
  'Shipped',
  'Delivered',
];

export function getNextOpenOrderMenu(nextMenu: OrderDetailMenu, currentMenu?: OrderDetailMenu) {
  return currentMenu === nextMenu ? undefined : nextMenu;
}

export function getShippedActionState(stage: string) {
  if (stage === 'Shipped' || stage === 'Delivered' || stage === 'Completed') {
    return {
      label: 'Already shipped',
      disabled: true,
    };
  }

  return {
    label: 'Mark Shipped',
    disabled: false,
  };
}

export function getSellerFulfillmentStages() {
  return sellerFulfillmentStages;
}

export function mapOrderToSellerStage(status: FulfillmentStatus): SellerFulfillmentStage {
  switch (status) {
    case 'Unfulfilled':
      return 'Awaiting processing';
    case 'Processing':
      return 'Processing';
    case 'Shipped':
      return 'Shipped';
    case 'Delivered':
      return 'Delivered';
    default:
      return 'Processing';
  }
}

export function mapSellerStageToBadge(stage: SellerFulfillmentStage): FulfillmentStatus {
  switch (stage) {
    case 'Awaiting processing':
      return 'Unfulfilled';
    case 'Processing':
    case 'Packed':
    case 'Ready for pickup':
      return 'Processing';
    case 'Shipped':
      return 'Shipped';
    case 'Delivered':
    case 'Completed':
      return 'Delivered';
    default:
      return 'Processing';
  }
}

export function isPendingFulfillment(status: FulfillmentStatus) {
  return status === 'Unfulfilled' || status === 'Processing';
}

export function buildShippingAddressMapUrl(address: ShippingAddress) {
  const query = [address.line1, address.line2, address.city, address.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

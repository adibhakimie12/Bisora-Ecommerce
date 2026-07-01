import type { FulfillmentStatus, ShippingAddress } from './types';

export type OrderDetailMenu = 'invoice' | 'status' | 'headerMore' | 'more';

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

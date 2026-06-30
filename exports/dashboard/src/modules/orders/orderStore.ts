import { shouldUseDemoData } from '../../liveDataMode';
import type { Order } from './types';

const ORDER_STORAGE_KEY = 'bisora-seller-orders';

const orderListeners = new Set<() => void>();
let orderSnapshot: Order[] | null = null;
let storageListenerAttached = false;

function notifyOrderListeners() {
  orderListeners.forEach((listener) => listener());
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== ORDER_STORAGE_KEY) return;
    orderSnapshot = readOrdersFromStorage();
    notifyOrderListeners();
  });
  storageListenerAttached = true;
}

function readOrdersFromStorage(): Order[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = window.localStorage.getItem(ORDER_STORAGE_KEY);
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as Order[];
  } catch {
    return shouldUseDemoData() ? [] : [];
  }
}

export function loadLocalOrders(): Order[] {
  return readOrdersFromStorage();
}

export function getOrderSnapshot(): Order[] {
  attachStorageListener();
  if (!orderSnapshot) {
    orderSnapshot = readOrdersFromStorage();
  }
  return orderSnapshot;
}

export function subscribeOrders(listener: () => void) {
  attachStorageListener();
  orderListeners.add(listener);
  return () => {
    orderListeners.delete(listener);
  };
}

export function saveLocalOrders(records: Order[]) {
  orderSnapshot = records;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(records));
  }

  notifyOrderListeners();
}

export function addLocalOrder(record: Order) {
  const nextRecords = [record, ...getOrderSnapshot().filter((order) => order.id !== record.id)];
  saveLocalOrders(nextRecords);
  return record;
}

export function updateLocalOrder(record: Order) {
  const nextRecords = getOrderSnapshot().map((order) => (order.id === record.id ? record : order));
  saveLocalOrders(nextRecords);
  return record;
}

export function removeLocalOrders(orderIds: string[]) {
  const ids = new Set(orderIds);
  saveLocalOrders(getOrderSnapshot().filter((order) => !ids.has(order.id)));
}


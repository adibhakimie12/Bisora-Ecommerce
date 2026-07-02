import type { PublicCheckoutPayload, PublicOrder } from '../../api/storefront';
import { getProductSnapshot, saveProducts } from '../storefront/productStore';
import type { Product, ProductVariant, StockState } from '../products/types';
import { addLocalOrder, loadLocalOrders } from './orderStore';
import type { Order, OrderItem } from './types';

function deriveStockState(stock: number): StockState {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  if (stock >= 50) return 'High Stock';
  return 'In Stock';
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

function createOrderNumber(now: Date) {
  const datePart = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0'),
  ].join('');
  return `ORD-${datePart}-${timePart}`;
}

function deductVariantStock(variants: ProductVariant[], quantity: number) {
  let remaining = quantity;

  return variants.map((variant) => {
    if (remaining <= 0) return variant;
    const currentStock = Math.max(Number(variant.stock || 0), 0);
    const deducted = Math.min(currentStock, remaining);
    remaining -= deducted;
    const nextStock = currentStock - deducted;

    return {
      ...variant,
      stock: nextStock,
      stockState: deriveStockState(nextStock),
      lastUpdated: 'Today',
    };
  });
}

function deductProductStock(product: Product, quantity: number) {
  const variants = product.variants.length > 0 ? deductVariantStock(product.variants, quantity) : product.variants;
  const nextStock = variants.length > 0
    ? variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    : Math.max(Number(product.stock || 0) - quantity, 0);

  return {
    ...product,
    variants,
    stock: nextStock,
    stockState: deriveStockState(nextStock),
  };
}

function findProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId || String(product.id) === String(productId));
}

export function createLocalCheckoutOrder(storeSlug: string, payload: PublicCheckoutPayload, now = new Date()): PublicOrder {
  const products = getProductSnapshot();
  const orderItems: OrderItem[] = payload.items.flatMap((item, index) => {
    const product = findProduct(products, item.productId);
    if (!product) return [];

    return [{
      id: `${product.id}-${index}`,
      name: product.title,
      sku: product.sku,
      quantity: item.quantity,
      price: product.price,
      imageUrl: product.thumbnailUrl,
    }];
  });
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = Number(payload.shippingMethod?.amount ?? 0);
  const orderTotal = Number((total + shippingFee).toFixed(2));
  const orderNumber = createOrderNumber(now);
  const formattedDate = formatDate(now);
  const shippingCourier = payload.shippingMethod?.courier || 'Not assigned';
  const shippingMethod = payload.shippingMethod?.label || 'Manual shipping';

  const sellerOrder: Order = {
    id: `#${orderNumber}`,
    customer: {
      name: payload.customer.name,
      email: payload.customer.email,
      tag: 'Storefront customer',
    },
    products: orderItems.map((item) => item.name).join(', ') || 'No items',
    date: formattedDate,
    total: orderTotal,
    paymentStatus: 'Pending',
    settlementStatus: 'Unsettled',
    fulfillmentStatus: 'Unfulfilled',
    paymentMethod: payload.paymentMethod ?? 'manual_bank_transfer',
    items: orderItems,
    shipment: {
      orderDate: formattedDate,
      courier: shippingCourier,
      status: 'Unfulfilled',
      trackingLocation: payload.shippingMethod ? `${shippingMethod} selected at checkout` : 'Awaiting seller fulfillment',
      method: shippingMethod,
      shippingFee,
    },
    shippingAddress: {
      recipient: payload.customer.name,
      line1: payload.shippingAddress.addressLine1,
      line2: payload.shippingAddress.addressLine2 ?? '',
      city: payload.shippingAddress.city,
      country: payload.shippingAddress.country,
    },
  };

  const nextProducts = products.map((product) => {
    const requested = payload.items.find((item) => item.productId === product.id);
    return requested ? deductProductStock(product, requested.quantity) : product;
  });

  saveProducts(nextProducts);
  addLocalOrder(sellerOrder);

  return {
    id: sellerOrder.id,
    number: orderNumber,
    total: orderTotal,
    paymentStatus: 'pending',
    settlementStatus: 'unsettled',
    fulfillmentStatus: 'unfulfilled',
    paymentMethod: sellerOrder.paymentMethod,
    items: orderItems.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
    })),
    shipment: {
      courier: shippingCourier === 'Not assigned' ? '' : shippingCourier,
      trackingNumber: '',
      trackingLocation: sellerOrder.shipment.trackingLocation,
    },
    shippingAddress: {
      recipient: payload.customer.name,
      city: payload.shippingAddress.city,
      country: payload.shippingAddress.country,
    },
    customer: {
      id: `local-${storeSlug}-${payload.customer.email}`,
      name: payload.customer.name,
      email: payload.customer.email,
      status: 'Customer',
    },
  };
}

export function findLocalPublicOrder(orderNumber: string, email: string): PublicOrder | null {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOrderId = addHash(orderNumber);
  const match = loadLocalOrders().find(
    (order) => order.id === normalizedOrderId && order.customer.email.trim().toLowerCase() === normalizedEmail,
  );

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    number: match.id.replace(/^#/, ''),
    total: match.total,
    paymentStatus: match.paymentStatus.toLowerCase(),
    settlementStatus: match.settlementStatus?.toLowerCase() ?? '',
    fulfillmentStatus: match.fulfillmentStatus.toLowerCase(),
    paymentMethod: match.paymentMethod,
    items: match.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
    })),
    shipment: {
      courier: match.shipment.courier === 'Not assigned' ? '' : match.shipment.courier,
      trackingNumber: match.shipment.trackingNumber ?? '',
      trackingLocation: match.shipment.trackingLocation,
    },
    shippingAddress: {
      recipient: match.shippingAddress.recipient,
      city: match.shippingAddress.city,
      country: match.shippingAddress.country,
    },
    customer: {
      id: match.customer.email,
      name: match.customer.name,
      email: match.customer.email,
      status: match.customer.tag,
    },
  };
}

function addHash(orderNumber: string) {
  return orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
}

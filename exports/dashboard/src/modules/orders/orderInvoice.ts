import { formatOrderMoney } from './ordersFormatting';
import type { Order } from './types';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatAddress(order: Order) {
  return [
    order.shippingAddress.recipient,
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    `${order.shippingAddress.city}, ${order.shippingAddress.country}`,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br />');
}

export function buildInvoiceHtml(order: Order) {
  const items = order.items
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.sku)}</span>
          </td>
          <td>${item.quantity}</td>
          <td>${formatOrderMoney(item.price)}</td>
          <td>${formatOrderMoney(item.quantity * item.price)}</td>
        </tr>
      `,
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${escapeHtml(order.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 40px; }
      h1, h2, p { margin: 0; }
      .header { align-items: flex-start; display: flex; justify-content: space-between; margin-bottom: 40px; }
      .brand { color: #4f46e5; font-size: 22px; font-weight: 700; }
      .muted { color: #64748b; font-size: 12px; margin-top: 6px; }
      .invoice-title { font-size: 32px; margin-bottom: 8px; }
      .grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 28px; }
      .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
      .label { color: #64748b; font-size: 11px; letter-spacing: 0.12em; margin-bottom: 8px; text-transform: uppercase; }
      table { border-collapse: collapse; margin-top: 12px; width: 100%; }
      th { background: #eef2ff; color: #334155; font-size: 11px; letter-spacing: 0.1em; padding: 12px; text-align: left; text-transform: uppercase; }
      td { border-bottom: 1px solid #e2e8f0; padding: 14px 12px; vertical-align: top; }
      td span { color: #64748b; display: block; font-size: 12px; margin-top: 4px; }
      .total { display: flex; font-size: 22px; font-weight: 700; justify-content: flex-end; margin-top: 20px; }
      .footer { color: #64748b; font-size: 12px; margin-top: 44px; }
      @media print { body { padding: 24px; } }
    </style>
  </head>
  <body>
    <section class="header">
      <div>
        <p class="brand">Bisora</p>
        <p class="muted">Seller invoice copy</p>
      </div>
      <div>
        <h1 class="invoice-title">Invoice</h1>
        <p>${escapeHtml(order.id)}</p>
        <p class="muted">Order date: ${escapeHtml(order.date)}</p>
      </div>
    </section>

    <section class="grid">
      <div class="box">
        <p class="label">Bill to</p>
        <p><strong>${escapeHtml(order.customer.name)}</strong></p>
        <p class="muted">${escapeHtml(order.customer.email)}</p>
        <p class="muted">${formatAddress(order)}</p>
      </div>
      <div class="box">
        <p class="label">Status</p>
        <p>Payment: <strong>${escapeHtml(order.paymentStatus)}</strong></p>
        <p>Fulfillment: <strong>${escapeHtml(order.fulfillmentStatus)}</strong></p>
        <p>Method: <strong>${escapeHtml(order.paymentMethod)}</strong></p>
      </div>
    </section>

    <section>
      <p class="label">Items</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
      <p class="total">${formatOrderMoney(order.total)}</p>
    </section>

    <p class="footer">Generated from Bisora Admin. Use the browser print dialog to save this invoice as PDF.</p>
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 200));</script>
  </body>
</html>`;
}

export function openInvoicePrintWindow(order: Order) {
  if (typeof window === 'undefined') return false;

  const html = buildInvoiceHtml(order);

  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const popup = window.open(url, '_blank');

    if (!popup) {
      URL.revokeObjectURL(url);
      return false;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  }

  const popup = window.open('', '_blank', 'width=900,height=1200');
  if (!popup) return false;

  try {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    return true;
  } catch {
    return false;
  }
}

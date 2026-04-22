# Dashboard Module — Notes (Admin SaaS System)

## Overview

Dashboard is the central control hub of the ecommerce SaaS system.
It provides a real-time snapshot of business performance, quick access to key actions, and monitoring of recent activities.

---

## Layout Structure

### 1. Sidebar Navigation (Global Layout)

* Dashboard (active)
* Orders
* Products
* Customers
* Marketing
* Reports
* Settings
* Website Builder

---

### 2. Top Header

* Greeting message (e.g., "Morning, Sarah")
* Search bar (search orders, products, customers)
* Notification icon
* Admin profile avatar

---

## Core Sections

### 3. KPI Metrics (Top Cards)

Display high-level business performance:

* Total Revenue
* Total Orders
* Conversion Rate
* Net Profit

#### Behavior:

* Data updates dynamically from backend
* Show percentage change (e.g. +12% vs last month)
* Color indicators:

  * Green = positive
  * Red = negative

---

### 4. Revenue Performance Chart

* Bar chart (Monthly / Weekly toggle)
* Displays revenue trend over time

#### Behavior:

* Toggle between:

  * Monthly view
  * Weekly view
* Data sourced from orders module

---

### 5. Quick Actions Panel

Shortcuts for high-frequency actions:

* Add Product → navigate to Products > Create Product
* Create Campaign → navigate to Marketing module
* Manage Orders → navigate to Orders list
* Open Builder → navigate to Website Builder

---

### 6. Recent Transactions

Table displaying latest orders:

Columns:

* Order ID
* Customer Name
* Status (Paid / Processing / Shipped)
* Amount

#### Actions:

* Click row → open Order Detail page
* "View All" → go to Orders module

---

### 7. Featured Content / Promo Card

* Displays featured collection or campaign
* CTA button (e.g., "Edit Collection")

#### Purpose:

* Marketing highlight
* Quick access to promotions

---

### 8. Recent Activity Feed

Displays system updates:

Examples:

* New order received
* Blog post published
* Payment integration verified

#### Behavior:

* Chronological timeline
* Auto-refresh (optional)

---

## Functional Logic

### Data Dependencies

Dashboard pulls data from:

* Orders → revenue, orders, status
* Products → inventory alerts (future)
* Marketing → campaign performance (future)
* Reports → aggregated analytics

---

### Navigation Logic

* Dashboard acts as entry point
* All widgets link to deeper modules

---

## AI Integration (Future Scope)

### Smart Insights Panel (optional)

* Suggest:

  * Best performing products
  * Low conversion alerts
  * Recommended campaigns

---

## System Role Behavior

### Admin

* Full visibility

### Staff

* Limited based on permissions (future: Staff & Roles module)

---

## Notes for Antigravity

### Priority:

* Focus on structure + navigation first
* UI polish can be adjusted later

### Important:

* Each card should be modular (component-based)
* All buttons must have navigation mapping
* Data should be mock first, then connected to backend later

---

## Next Module

After dashboard complete:
→ Proceed to Orders module

---

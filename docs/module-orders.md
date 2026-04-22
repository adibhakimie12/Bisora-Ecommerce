# Orders Module — Notes (Admin SaaS System)

## Overview

Orders module is the core transaction management system.

It handles:

* Order tracking
* Fulfillment & shipping
* Draft/manual orders
* Abandoned checkout recovery
* Bulk shipment processing

---

## Navigation Structure

### Sidebar

* Orders (active)

### Top Tabs

* All Orders
* Draft Orders
* Abandoned Checkouts

---

## 1. All Orders Page

### KPI Summary

* Total Revenue
* Total Orders
* Pending Fulfillment

---

### Order Table

Columns:

* Order ID
* Customer
* Products
* Date
* Total
* Payment Status (Paid / Pending)
* Fulfillment Status (Processing / Shipped / Unfulfilled)

---

### Actions

* Click row → Open Order Detail
* Export CSV
* Create New Order

---

### Bulk Actions (IMPORTANT FLOW)

Triggered when multiple orders selected:

* Bulk Generate Shipment
* Print Waybill
* Assign Courier
* Mark as Shipped
* Delete

---

## 2. Bulk Shipment Flow

### Step 1: Select Orders

User selects multiple orders

↓

### Step 2: Bulk Shipment Modal

User configures:

* Courier (e.g. J&T, DHL)
* Package type (Parcel / Box)
* Shipping method (Standard / Express)
* Auto tracking ON/OFF
* Auto mark shipped ON/OFF

↓

### Step 3: Generate Shipment

↓

### Step 4: Processing Modal

Shows progress:

* Validating orders
* Assigning courier
* Generating tracking
* Sending notifications

↓

### Step 5: Completion Modal

Shows:

* Success count
* Failed count
* Tracking numbers

Actions:

* Download all waybills
* View all shipments

---

## 3. Order Detail Page

### Sections

#### Ordered Items

* Product image
* Quantity
* Price
* Total

---

#### Shipment Summary (Right Panel)

* Order date
* Courier
* Status
* Location tracking

---

#### Customer Info

* Name
* Email
* Tag (e.g. Platinum Member)

---

#### Shipping Address

* Full address
* Map preview

---

#### Payment Info

* Payment method
* Payment status

---

## 4. Fulfillment & Shipping

### Status Tabs

* Pending
* Processing
* Shipped
* Delivered

---

### Core Actions

* Generate Shipment
* Print Waybill
* Mark as Shipped

---

### Fields

* Courier selection
* Tracking number
* Package size / weight
* Auto-fulfillment toggle

---

## 5. Shipment Processing Page

(Advanced View)

Steps:

1. Order Validation
2. Courier Assignment
3. Shipment Record Creation
4. Waybill Generation
5. Status Update
6. Notification Trigger

---

## 6. Draft Orders

Purpose:
Manual order creation (WhatsApp / offline sales)

---

### Features

* Select/Create Customer
* Add Products manually
* Adjust price / shipping
* Send invoice
* Save as draft

---

## 7. Abandoned Checkouts

Purpose:
Recover lost sales

---

### Features

* View abandoned carts
* Customer details
* Cart value
* Status:

  * Abandoned
  * Contacted
  * Recovered

---

### Actions

* Send reminder
* Export data
* View recovery analytics

---

## Functional Logic

### Data Flow

Orders ← Checkout ← Website Builder

↓

Orders Module

↓

Fulfillment System

↓

Courier API

↓

Tracking + Notifications

---

## AI Logic (Future)

* Recommend best courier
* Predict delivery delay
* Suggest upsell before shipment
* Detect high-risk orders

---

## System Role Behavior

### Admin

* Full access

### Staff

* Limited:

  * Fulfillment only
  * No delete / no financial access

---

## Important for Antigravity

### Priority Build Order

1. Orders List
2. Order Detail
3. Bulk Shipment Flow
4. Draft Orders
5. Abandoned Checkouts

---

### Key Focus

* Navigation must work
* Buttons must trigger correct flow
* Data can be mock first

---

## Notes

This is the most critical module in the system.

Everything connects here:

* Payments
* Shipping
* Customer data
* Reports

---

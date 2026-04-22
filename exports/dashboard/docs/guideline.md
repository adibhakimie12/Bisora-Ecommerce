# Marketing Module Guideline (Draft v1)

Date: April 21, 2026

This guide explains how each Marketing feature works in the current frontend implementation.

## 1. Discounts

### Status behavior

- `Active`: discount is enabled, within start/end date, and usage is still available.
- `Scheduled`: start date/time is in the future.
- `Expired`: end date/time has passed.
- `Off`: manually turned off by seller.
- `Auto Off`: usage reached usage cap (`usage >= usageCap`) and system auto-stops discount.

### Controls

- `Turn On / Turn Off`: manual power switch for discount.
- `Use +1`: simulate one redemption for testing (helps test auto-off quickly).
- Start and end now include **date + time** (`datetime-local`) in Create Discount.
- Customer eligibility options:
  - `All Customers`
  - `First-Time Purchase`
  - `Returning Customers`
- Code distribution options:
  - `Public` (shown automatically to eligible audience)
  - `Direct Code` (share only via selected channels)
- Direct code channels:
  - `WhatsApp`
  - `Email`
  - `SMS`

## 2. Upsells

### Bump Offer vs One-Time Offer

- `Bump Offer`
  - Placement: shown before payment (checkout stage).
  - Trigger options: `Cart Trigger`, `Checkout Step`.
  - Use case: increase basket before payment.

- `One-Time Offer (OTO)`
  - Placement: shown after payment.
  - Trigger options: `Post Purchase Trigger`, `Thank You Page Trigger`.
  - Use case: post-purchase add-on while intent is high.

When switching offer type, default trigger and message adapt automatically to the selected flow.

## 3. Recovery Flow Builder

### Flow Components panel

- Each item (`Trigger`, `Delay`, `Email`, `WhatsApp`, `SMS`, `Condition`, `Discount Offer`, `End Flow`) is clickable.
- Clicking adds a new node into the flow canvas.

### Recovery Flow Builder canvas

- Every node is selectable.
- Selected node is highlighted.

### Node Configuration panel

- `Selected Node`: rename node label directly.
- `Delay` node: edit delay in minutes.
- `Condition` node: edit rule text.
- Channel nodes (`Email`, `WhatsApp`, `SMS`): edit template + message.
- `Remove Node`: delete selected node from flow.

## 4. Funnels (Current behavior)

- Funnel Builder:
  - Step Library (visual reference)
  - Canvas cards (flow stages)
  - Step Settings panel (offer and discount configuration)

- Create Funnel Wizard:
  - Step 1: funnel name + objective + traffic source
  - Step 2: template selection
  - Step 3: summary and create

- Automations:
  - Rule library with Active/Draft toggle
  - Automation canvas
  - Performance preview panel
  - Rule builder modal for creating new AI-style rule logic

## 5. Notes for future “Guideline Tab”

This file is prepared as source content for a future in-app `Guideline` tab.
When that tab is added, this document can be converted into:

- searchable FAQ
- inline walkthrough checklist
- context help by page/feature

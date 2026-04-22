# Customers Module Progress Notes

Updated: 2026-04-21

## Scope Implemented (from module-customers.md)

1. All Customers page
2. Customer Profile page
3. Reviews page
4. Review Moderation modal

## Functional Behaviors Implemented

- Route integration:
  - `#/customers` -> All Customers
  - `#/customers/reviews` -> Reviews
  - `#/customers/:id` -> Customer Profile

- All Customers:
  - search + status filter
  - create customer modal
  - row action menu (view profile, edit, add note, delete)
  - add internal note from list context

- Customer Profile:
  - KPI summary (total spent, orders, AOV, lifetime value)
  - order history table
  - recent purchases grid
  - internal notes add action
  - quick actions (send WhatsApp, send email, deactivate)

- Reviews:
  - KPI summary (average rating, total, pending)
  - filters (rating, status, product, search)
  - review moderation trigger per row
  - export report action

- Review Moderation Modal:
  - approve
  - feature
  - hide
  - delete
  - updates review state in frontend workspace

## Notes

- This is frontend-first functional structure.
- Designed to plug into backend APIs later without changing navigation or hierarchy.

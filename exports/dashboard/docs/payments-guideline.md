# Payments Module Guide (Draft v1)

Date: April 21, 2026

This guide explains how the Payments section should be understood by a seller during setup and testing.

## 1. Payment Rules Engine

Payment Rules are not payment methods.
They are logic rules that decide how checkout should behave under certain conditions.

Examples:
- `High Value Secure`: if cart is above RM1,000, prioritize safer methods like card or online banking.
- `VIP Premium Route`: if customer has VIP tag, prioritize preferred premium gateway.
- `Night COD Block`: disable cash on delivery at certain hours.

Current seller actions in frontend:
- `Activate` / `Move to Draft`: turn the rule on or keep it as a draft.
- `Edit`: update the rule name, condition, and action.
- `Duplicate`: clone a working rule and adjust it.
- `Delete`: remove a rule from the stack.
- `Create Rule`: add a new draft suggestion that seller can refine right away.
- `Use Template`: start from a recommended rule pattern instead of writing from scratch.

Seller should read Payment Rules like this:
- Rules shape the payment choices shown during checkout.
- Rules help decide what should be shown first, hidden, or limited.
- Rules do NOT confirm that money has been received.
- Rules do NOT replace webhook, callback, receipt review, or reconciliation.

Good seller use cases:
- push high-value orders toward card / online banking
- hide COD during risky hours
- prioritize a preferred gateway for VIP buyers
- control when manual methods should or should not appear

## 2. Gateway Setup Logic

### SecurePay
- Seller must register and be approved as a SecurePay merchant.
- Merchant generates API/app credentials from SecurePay side.
- Seller pastes credentials into gateway configuration.
- Callback/webhook URL must be configured.
- System marks payment as paid only after provider confirmation returns.

Official references:
- https://docs.securepay.my/
- https://www.securepay.my/securepay-api/

### FPX
- Usually enabled through an acquirer/payment gateway, not as a standalone wallet account.
- Customer is redirected to online banking.
- Provider callback/webhook confirms success.
- System should only mark payment paid after verified callback.

### Stripe
- Seller creates Stripe account and completes business verification.
- Publishable key, secret key, and webhook signing flow are configured.
- Webhook events are required for reliable payment state updates.

### GrabPay
- Seller applies as GrabPay / PayLater merchant first.
- Grab verifies merchant and provides onboarding/integration path.
- Callback/webhook should update the order after payment confirmation.

Official reference:
- https://www.grab.com/my/merchant/pay/

### Atome
- Seller must onboard as Atome merchant partner first.
- Merchant approval/commercial onboarding happens before integration.
- Credentials/support path come from Atome after approval.
- Callback/webhook confirms BNPL approval and payment success.

Official reference:
- https://www.atome.my/

### Touch n Go eWallet
- Seller must register as TNG merchant first.
- Can involve merchant dashboard, QR flow, or online integration path.
- Merchant should rely on provider notification/dashboard reconciliation and system callback integration before marking payment received.

Official references:
- https://www.touchngo.com.my/merchant/be-a-merchant/
- https://www.touchngo.com.my/merchant/merchant-dashboard

### DuitNow QR / Company QR
- Merchant typically onboards through a participating bank, acquirer, or QR payment provider.
- The QR normally settles into a linked merchant/company account.
- `Static QR` is simpler to start with, but often needs manual reconciliation or dashboard matching.
- `Dynamic QR` is stronger for e-commerce because amount/order reference can be tied to each payment session.
- For automated order updates, backend should rely on provider callback, reconciliation file, or verified settlement record before marking payment paid.

Official references:
- https://knowledgebase.paynet.my/hc/en-us/articles/49583136924441-How-do-merchants-onboard-to-DuitNow-QR
- https://knowledgebase.paynet.my/hc/en-us/articles/49584176719513-How-Can-Merchants-Use-DuitNow-QR
- https://www.paynet.my/business-solutions/duitnow-qr.html

## 3. Toggle vs Real Payment Confirmation

A gateway toggle only means:
- show/hide gateway in checkout
- allow/disallow use in frontend flow

It does NOT mean money is confirmed.

Real payment confirmation should come from:
- provider callback
- provider webhook
- verified settlement / merchant dashboard reconciliation

Only after that should backend:
- mark order as `Paid`
- save transaction reference
- trigger fulfillment / shipping flow
- trigger customer notifications

## 4. Manual Methods Logic

Manual methods are not instant-payment gateways.
They should be treated as seller-controlled payment flows that still need operational review.

### Cash on Delivery
- Turning `ON` means customers may see COD at checkout for eligible orders.
- It does NOT mean the order is paid.
- Order should remain in an unpaid / awaiting collection state until:
  - parcel is delivered or handoff is completed
  - rider / courier confirms payment collection
  - ops records collection proof or rider note

Recommended tracking:
- payment status: `Awaiting collection on delivery`
- evidence source: courier update, rider handoff confirmation, collection note
- only after confirmation should ops mark payment received

### Bank Transfer
- Turning `ON` means customers may choose manual transfer at checkout.
- It does NOT mean the transfer has been received.
- Order should remain in `Awaiting transfer proof / verification` until:
  - customer submits receipt / transfer slip
  - amount and payer details are matched
  - finance / ops verifies transfer in bank record or reconciliation

Recommended tracking:
- payment status: `Awaiting transfer proof / verification`
- evidence source: uploaded receipt, bank reference, finance review
- only after verification should ops mark payment received

### Product expectation inside Bisora
- Manual method toggle controls checkout visibility only.
- Bisora should surface:
  - waiting payment state
  - proof / verification checklist
  - operational reminder that manual methods are not auto-paid
- Fulfillment-safe flow should start only after manual payment is confirmed by ops, finance, courier collection, or verified reconciliation.

## 5. Suggested Seller Flow For Live Payment Setup

1. Choose which payment path you want:
- gateway card / online banking
- BNPL
- wallet
- QR

2. Register as merchant with the provider or participating acquirer.

3. Complete company verification, business documents, and settlement account linkage.

4. Collect these items before going live:
- API keys / credentials
- webhook or callback configuration
- return URL requirements
- settlement / reconciliation visibility

5. Test in sandbox / test mode first.

6. Only switch to live after callback/webhook and paid-status logic have been verified.

## 6. How to read the gateway page inside Bisora

### `Your setup progress tracker`
- This is only a manual progress label for the seller or operations team.
- It does not connect the gateway automatically.
- Example meaning:
  - `Not Started`: you have not applied yet
  - `Applied`: merchant application was submitted
  - `Awaiting Approval`: provider is reviewing your account
  - `Ready to Connect`: you already have credentials / account approval and can start technical setup
  - `Live`: gateway is approved, configured, and ready for production use

### `Open ... Setup`
- This button should take the seller to the provider onboarding / registration path.
- Its purpose is: “go there and start merchant setup”.

### `Read Official Info`
- This button should take the seller to official information or help material.
- Its purpose is: “understand the provider before or during setup”.

### `Copy Webhook URL`
- This is usually for a developer, integrator, or technical staff.
- The copied URL is pasted into the payment provider dashboard so the provider can notify Bisora about payment updates.
- Seller should not need this early unless they are already at the technical connection stage.

## 7. Future Guideline Note

This file exists as a dedicated Payments guide so future global guideline pages should reference it instead of rewriting the same gateway setup logic again.

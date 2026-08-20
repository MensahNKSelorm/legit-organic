# LegitOrganic operations admin

## Subscription pricing

Existing plan prices are intentionally read-only on the plan screen. Use **Weekly Delivery → Scheduled pricing** to create a change.

1. Select the plan and enter the new weekly price.
2. Choose an effective date at least 14 days ahead.
3. Add the customer-facing reason and set the change to **Scheduled**.
4. The system freezes the affected subscriber list and records one notice per customer.
5. Failed notices appear in **Attention required** and can be retried.
6. At the effective date, only customers with a successfully sent notice move to the new price. Everyone else remains on their previous price.

Production installs `legitorganic-subscriptions.timer`, which runs every five minutes. To run the pricing step manually:

```sh
python manage.py process_subscription_price_changes
```

The command is idempotent. Pending notices are delivered automatically; failed notices remain visible until staff explicitly retries them. Due changes apply without duplicating records.

## B2B review

Applications move through:

`Submitted → Under review → More information required → Approved / Rejected`

Approved accounts may later be suspended. Every status transition requires a concise review note and creates both a B2B review-history entry and a security audit event. Supporting documents remain available only through the protected admin download endpoint.

## Operational queues

The control-room home page surfaces renewal payments, failed price notices, scheduled price changes, submitted B2B applications, recipes awaiting review, and recipes with unresolved nutrition data.

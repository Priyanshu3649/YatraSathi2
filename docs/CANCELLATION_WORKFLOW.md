# Bill cancellation workflow (YatraSathi)

## Who may cancel

- **Administrator** (`us_usertype === 'admin'` or role `ADM`)
- **Accounts** (`ACC`)
- **Management** (`MGT`)

Agents (`AGT`), customer care, HR, and marketing employee roles **cannot** cancel bills via API.

## When cancellation is blocked

The system rejects cancellation if:

1. The bill is already **cancelled**.
2. Billing status is **PAID** or **FINAL**, or payment status is **FULLY_PAID** / **PARTIALLY_PAID**.
3. There are **active receipts** (`rcXreceipt`) with `rc_ref_number` equal to the bill number and `rc_status = 'Active'` and a positive total amount. Reverse or reallocate receipts first.

## Required data (UI + API)

- **Cancellation reason** (text)
- **Cancellation date** (business date; stored on the bill)
- **Approver user id** and **approver name** (authorization record)
- **Railway** and **agent** cancellation charges (non-negative; sum must not exceed bill total)

## Backend behaviour

1. Validates role, payload, payment state, and receipts.
2. Sets bill to **CANCELLED**, generates **`bl_cancellation_ref`** (`CAN-YYMMDD-#####`), stores approver fields and remarks.
3. Marks associated **booking** as **CANCELLED**, clears passenger `bl_bill_no` links where applicable.
4. Writes a **forensic audit** row (`actionType: CANCEL`) with old/new snapshots and structured `changedFields`.
5. **Deactivates** existing **journal** lines tied to the bill number (`je_status: Inactive`) and posts new **cancellation journal** entries referencing the cancellation number.
6. Sends **email** to finance (`FINANCE_NOTIFY_EMAILS` in `.env`) and to the **customer** when an email is found via `UserTVL` by customer phone. If `SMTP_HOST` is unset, messages are **logged only**.

## Environment (email)

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
FINANCE_NOTIFY_EMAILS=accounts@example.com,cfo@example.com
```

Optional: `npm install nodemailer` in the API project root.

## UI

- **Billing** toolbar: **Print** uses a **React Router `Link`** (same-tab) to `/print/bill/:id`.
- **Cancellations** opens `/billing/cancellations` (searchable history).

## API

- `POST /api/billing/:id/cancel` (or `/api/employee/billing/:id/cancel` for staff) — body matches the modal fields.
- `GET /api/billing/cancellations/history` — query: `page`, `limit`, `fromDate`, `toDate`, `customerName`, `reason`.

## Tests

Run: `npm test` (Jest) — covers cancellation validation helpers and role rules.

## Database

If new columns are missing after deploy, run `scripts/sql/add-bill-cancellation-columns.sql` on the TVL database.

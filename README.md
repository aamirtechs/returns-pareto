# returns-pareto
Live page: https://aamirtechs.github.io/returns-pareto/
Use it in your browser: the Pages site above runs the full tool locally, no install needed.

Turn Shopify or WooCommerce orders and refunds CSV exports into a returns Pareto: which SKUs, reasons and regions actually drive returns, repeat returners, and what to fix first. Offline, no store login needed.

## Why

Most stores have a long list of returned items and no clear answer to what is actually driving returns. A Pareto view fixes that. If two SKUs and one reason make up most refunds, you fix the size guide, the photos or the supplier for those SKUs first, instead of spreading effort across everything.

## Install

Requires Node.js 20 or later. There are no dependencies.

```bash
git clone https://github.com/aamirtechs/returns-pareto.git
cd returns-pareto
node src/cli.js --help
```

## Input

Orders CSV with columns:

```csv
order_id,customer_id,sku,quantity,region
ORD-1001,cust_hash_a91f,TEE-BLK-M,1,US-CA
```

The customer column may be `customer_id`, a customer email hash column such as `customer_email_hash`, or `email_hash`. Never put real customer emails or personal data into a report you share. Hash identifiers first, as the examples do.

Returns or refunds CSV with columns:

```csv
order_id,sku,reason,refund_amount,chargeback
ORD-1001,TEE-BLK-M,Too small did not fit,29.99,false
```

The `chargeback` column is optional. Use `true`, `1` or `yes` for a chargeback or refund marker row.

## Reason buckets

Free-text reasons are normalised into buckets using `config/reason-map.json`, an editable keyword map shipped in the repo. The default buckets are: sizing, damaged, wrong item, changed mind, late delivery, quality and other (the fallback when no keyword matches). Edit the keywords to match your store language, or pass a different map with `--reason-map`.

## Usage

```bash
returns-pareto --orders orders.csv --returns returns.csv [--reason-map config/reason-map.json] [--out-dir .]
```

Outputs:

- `report.md` with Pareto tables by SKU, by reason, by SKU x reason and by region, each with counts, refund amounts, share and cumulative share, plus a repeat-returner table and a double-refund flag list.
- `pareto.csv` with the by-SKU Pareto, one row per SKU.

The double-refund flag lists any order that has both a normal return row and a chargeback or refund marker row, so it can be checked manually before money is refunded twice.

## Example

The examples are synthetic. Twelve orders, nine return rows, one SKU dominating on sizing, and one order (ORD-1007) with both a return row and a chargeback row.

Run it:

```bash
node src/cli.js --orders examples/orders.csv --returns examples/returns.csv --out-dir /tmp/pareto-out
```

Real output captured from that run:

```text
Orders: 12
Returns: 9
Total refund amount: 314.91
Top SKU: TEE-BLK-M (6 returns, 66.7%)
Top reason: sizing (5 returns, 55.6%)
Repeat returners: 5 (2+ returns: 2)
Double-refund flags: 1
Wrote /tmp/pareto-out/report.md and /tmp/pareto-out/pareto.csv
```

The generated `pareto.csv`:

```csv
sku,returns,refund_amount,share_pct,cumulative_share_pct
TEE-BLK-M,6,179.94,66.7,66.7
HOODIE-GRY-L,2,119.98,22.2,88.9
MUG-WHT,1,14.99,11.1,100.0
```

And the report begins:

```markdown
# Returns Pareto Report

Orders: 12
Returns: 9
Total refund amount: 314.91
Overall return rate by order count: 75.0%

## Pareto by SKU

| SKU | Returns | Refund amount | Share | Cumulative share |
| --- | --- | --- | --- | --- |
| TEE-BLK-M | 6 | 179.94 | 66.7% | 66.7% |
| HOODIE-GRY-L | 2 | 119.98 | 22.2% | 88.9% |
| MUG-WHT | 1 | 14.99 | 11.1% | 100.0% |

## Pareto by reason

| Reason bucket | Returns | Refund amount | Share | Cumulative share |
| --- | --- | --- | --- | --- |
| sizing | 5 | 149.95 | 55.6% | 55.6% |
| damaged | 1 | 59.99 | 11.1% | 66.7% |
| quality | 1 | 59.99 | 11.1% | 77.8% |

## Double-refund flags

- ORD-1007 (TEE-BLK-M; TEE-BLK-M): Order has 2 refund rows including a chargeback marker
```

In this example two rows (TEE-BLK-M and HOODIE-GRY-L) already reach 88.9 percent of returns, and sizing on TEE-BLK-M alone is 55.6 percent, so the size guide for that SKU is the first fix.

## Library use

```js
import { loadOrders, loadReturns, loadReasonMap, analyse } from "./src/index.js";

const reasonMap = loadReasonMap("config/reason-map.json");
const analysis = analyse(loadOrders("examples/orders.csv"), loadReturns("examples/returns.csv", reasonMap));
console.log(analysis.bySku);
```

## Tests

```bash
npm test
```

## License

MIT. Copyright (c) 2026 Amir Hussain.

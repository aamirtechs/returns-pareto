# Changelog

## 1.0.0

- Initial release.
- Read orders and returns or refunds CSV exports in Shopify or WooCommerce style column shapes, fully offline with no store login.
- Normalise free-text return reasons into buckets using an editable keyword-map JSON file shipped in the repo.
- Pareto tables by SKU, by reason and by SKU combined with reason, with counts, refund amounts, share and cumulative share, plus a by-region table.
- Repeat-returner table with orders, returns and return rate per customer.
- Double-refund flag list for orders that have both a return and a chargeback marker.
- Outputs report.md and pareto.csv.

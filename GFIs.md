# Good First Issues

## 1. WooCommerce refunds export mapping

Add a documented column mapping for a WooCommerce refunds export, whose headers differ from the generic returns shape used today, and cover it with a small synthetic fixture. The mapping should translate order id, product SKU, refund reason and amount fields onto the internal return shape without changing the analysis code. Note any WooCommerce fields that have no equivalent and how they are handled.

## 2. Reason-bucket presets for apparel vs electronics

Add two extra keyword-map preset files, one tuned for apparel language and one for electronics language, alongside the default map in the config folder. Each preset should keep the same bucket names so reports stay comparable, and only the keywords should differ. Include a short note in the README on when to pick each preset and a test that loads both presets successfully.

## 3. Size-related return detector for variant names

Add a detector that spots likely size-related returns from variant names in the SKU or product data, for example variants containing size tokens, and cross-checks them against the sizing reason bucket. The output should be an extra section in the report listing the SKUs where variant size signals and sizing reasons line up. Cover it with tests using synthetic variant names.

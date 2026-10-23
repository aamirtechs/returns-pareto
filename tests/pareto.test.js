import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bucketReason, loadReasonMap, analyse, normaliseOrders, normaliseReturns, parseCsv } from "../src/index.js";

const mapPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "config", "reason-map.json");
const reasonMap = loadReasonMap(mapPath);

test("reason map loads all expected buckets", () => {
  for (const b of ["sizing", "damaged", "wrong item", "changed mind", "late delivery", "quality"]) assert.ok(b in reasonMap, b);
});

test("bucketReason classifies known phrases", () => {
  assert.equal(bucketReason("Too small, did not fit", reasonMap), "sizing");
  assert.equal(bucketReason("Arrived damaged and cracked", reasonMap), "damaged");
  assert.equal(bucketReason("Sent the wrong item", reasonMap), "wrong item");
  assert.equal(bucketReason("Changed my mind", reasonMap), "changed mind");
  assert.equal(bucketReason("Arrived late, took too long", reasonMap), "late delivery");
  assert.equal(bucketReason("Poor quality, stopped working", reasonMap), "quality");
  assert.equal(bucketReason("Just returning it", reasonMap), "other");
  assert.equal(bucketReason("", reasonMap), "other");
});

test("parseCsv and normalisation handle synthetic data", () => {
  const rows = parseCsv("order_id,customer_id,sku,quantity,region\nORD-1,cust_hash_x,SKU-1,2,US-CA\n");
  const orders = normaliseOrders(rows);
  assert.equal(orders[0].quantity, 2);
  assert.equal(orders[0].customer_id, "cust_hash_x");
});

function sample() {
  const orders = normaliseOrders([
    { order_id: "ORD-1", customer_id: "cust_hash_a", sku: "SKU-1", quantity: "1", region: "US-CA" },
    { order_id: "ORD-2", customer_id: "cust_hash_a", sku: "SKU-1", quantity: "1", region: "US-CA" },
    { order_id: "ORD-3", customer_id: "cust_hash_b", sku: "SKU-2", quantity: "1", region: "US-NY" },
    { order_id: "ORD-4", customer_id: "cust_hash_b", sku: "SKU-2", quantity: "1", region: "US-NY" },
  ]);
  const returns = normaliseReturns([
    { order_id: "ORD-1", sku: "SKU-1", reason: "Too small", refund_amount: "10", chargeback: "false" },
    { order_id: "ORD-2", sku: "SKU-1", reason: "Too small", refund_amount: "10", chargeback: "false" },
    { order_id: "ORD-3", sku: "SKU-2", reason: "Changed my mind", refund_amount: "20", chargeback: "false" },
  ], reasonMap);
  return { orders, returns };
}

test("pareto by SKU is sorted with cumulative share reaching 100 percent", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  assert.equal(a.bySku[0].key, "SKU-1");
  assert.equal(a.bySku[0].count, 2);
  assert.ok(Math.abs(a.bySku[a.bySku.length - 1].cumulativeShare - 1) < 1e-9);
});

test("pareto by reason and by SKU x reason", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  assert.equal(a.byReason[0].key, "sizing");
  assert.equal(a.bySkuReason[0].key, "SKU-1 x sizing");
});

test("region pareto joins returns to orders", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  assert.equal(a.byRegion[0].key, "US-CA");
  assert.equal(a.byRegion[0].count, 2);
});

test("repeat returner table counts orders, returns and rate", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  const top = a.repeatReturners.find(r => r.customer === "cust_hash_a");
  assert.equal(top.orders, 2);
  assert.equal(top.returns, 2);
  assert.equal(top.returnRate, 1);
  assert.equal(a.repeatOnly.length, 1);
});

test("double-refund flag when order has return and chargeback rows", () => {
  const orders = normaliseOrders([{ order_id: "ORD-9", customer_id: "cust_hash_z", sku: "SKU-9", quantity: "1", region: "US-TX" }]);
  const returns = normaliseReturns([
    { order_id: "ORD-9", sku: "SKU-9", reason: "Too small", refund_amount: "10", chargeback: "true" },
    { order_id: "ORD-9", sku: "SKU-9", reason: "Chargeback filed", refund_amount: "10", chargeback: "true" },
  ], reasonMap);
  const a = analyse(orders, returns);
  assert.equal(a.doubleRefunds.length, 1);
  assert.equal(a.doubleRefunds[0].order_id, "ORD-9");
});

test("no double-refund flag for a plain single return", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  assert.equal(a.doubleRefunds.length, 0);
});

test("totals are computed", () => {
  const { orders, returns } = sample();
  const a = analyse(orders, returns);
  assert.equal(a.totalReturns, 3);
  assert.equal(a.totalOrders, 4);
  assert.equal(a.totalRefund, 40);
});

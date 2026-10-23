#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOrders, loadReturns, loadReasonMap, analyse, buildReport, paretoToCsv } from "./index.js";

function parseArgs(argv) {
  const args = { outDir: ".", reasonMap: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--orders") args.orders = argv[++i];
    else if (argv[i] === "--returns") args.returns = argv[++i];
    else if (argv[i] === "--out-dir") args.outDir = argv[++i];
    else if (argv[i] === "--reason-map") args.reasonMap = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.orders || !args.returns) {
  console.log("Usage: returns-pareto --orders orders.csv --returns returns.csv [--reason-map config/reason-map.json] [--out-dir .]");
  process.exit(args.help ? 0 : 1);
}
const defaultMap = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "config", "reason-map.json");
const reasonMap = loadReasonMap(args.reasonMap || defaultMap);
const orders = loadOrders(args.orders);
const returns = loadReturns(args.returns, reasonMap);
const analysis = analyse(orders, returns);
fs.mkdirSync(args.outDir, { recursive: true });
fs.writeFileSync(path.join(args.outDir, "report.md"), buildReport(analysis));
fs.writeFileSync(path.join(args.outDir, "pareto.csv"), paretoToCsv(analysis.bySku));
console.log(`Orders: ${analysis.totalOrders}`);
console.log(`Returns: ${analysis.totalReturns}`);
console.log(`Total refund amount: ${analysis.totalRefund.toFixed(2)}`);
if (analysis.bySku.length) console.log(`Top SKU: ${analysis.bySku[0].key} (${analysis.bySku[0].count} returns, ${(analysis.bySku[0].share * 100).toFixed(1)}%)`);
if (analysis.byReason.length) console.log(`Top reason: ${analysis.byReason[0].key} (${analysis.byReason[0].count} returns, ${(analysis.byReason[0].share * 100).toFixed(1)}%)`);
console.log(`Repeat returners: ${analysis.repeatReturners.length} (2+ returns: ${analysis.repeatOnly.length})`);
console.log(`Double-refund flags: ${analysis.doubleRefunds.length}`);
console.log(`Wrote ${path.join(args.outDir, "report.md")} and ${path.join(args.outDir, "pareto.csv")}`);

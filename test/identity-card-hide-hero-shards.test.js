import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const component = readFileSync(
  join(root, "src/components/Common/IdentityCard.vue"),
  "utf8",
);
const catalog = readFileSync(join(root, "src/utils/xyzwItemCatalog.ts"), "utf8");

const failures = [];

for (const itemId of [101, 117, 205, 314]) {
  if (!catalog.includes(`${itemId}:`)) {
    failures.push(`catalog should still keep hero shard item ${itemId}`);
  }
  if (!component.includes(`itemId: ${itemId}`)) {
    failures.push(`hero shard ${itemId} is missing from hiddenInventoryItemIds`);
  }
}

if (!component.includes("hiddenInventoryItemIds")) {
  failures.push("IdentityCard.vue is missing hiddenInventoryItemIds");
}

if (!/\.filter\(\(item\)\s*=>\s*!hiddenInventoryItemIds\.has\(item\.itemId\)\)/.test(component)) {
  failures.push("inventoryResources must filter out hidden hero shard item ids");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("identity card hides hero shard inventory items");

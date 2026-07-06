import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const component = readFileSync(
  join(root, "src/components/Common/IdentityCard.vue"),
  "utf8",
);
const catalog = readFileSync(join(root, "src/utils/xyzwItemCatalog.ts"), "utf8");

const failures = [];
const fishSpiritItemIds = Array.from(
  catalog.matchAll(/^\s+(\d+):\s+\{"name":"[^"]*鱼灵[^"]*"/gm),
  ([, itemId]) => Number(itemId),
);

if (fishSpiritItemIds.length === 0) {
  failures.push("catalog should contain fish spirit inventory items");
}

for (const itemId of fishSpiritItemIds) {
  if (!component.includes(`itemId: ${itemId}`)) {
    failures.push(`fish spirit item ${itemId} is missing from hiddenInventoryItemIds`);
  }
}

if (!component.includes("hiddenInventoryItemIds")) {
  failures.push("IdentityCard.vue is missing hiddenInventoryItemIds");
}

if (!/\.filter\(\(item\)\s*=>\s*!hiddenInventoryItemIds\.has\(item\.itemId\)\)/.test(component)) {
  failures.push("inventoryResources must filter out hidden inventory item ids");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("identity card hides fish spirit inventory items");

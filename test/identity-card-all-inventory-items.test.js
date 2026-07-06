import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const componentPath = join(root, "src/components/Common/IdentityCard.vue");
const catalogPath = join(root, "src/utils/xyzwItemCatalog.ts");
const itemsIconDir = join(root, "public/game-icons/items");

const component = readFileSync(componentPath, "utf8");
const failures = [];

if (!existsSync(catalogPath)) {
  failures.push("missing src/utils/xyzwItemCatalog.ts item catalog");
} else {
  const catalog = readFileSync(catalogPath, "utf8");
  for (const itemId of ["1001", "2001", "35002", "37007"]) {
    if (!catalog.includes(`${itemId}:`) && !catalog.includes(`"${itemId}":`)) {
      failures.push(`item catalog is missing item ${itemId}`);
    }
  }
}

if (!existsSync(itemsIconDir)) {
  failures.push("missing public/game-icons/items for inventory icons");
}

for (const expected of [
  "xyzwItemCatalog",
  "normalizeInventoryItems",
  "inventoryResources",
  "usedItemIds",
]) {
  if (!component.includes(expected)) {
    failures.push(`IdentityCard.vue is missing ${expected}`);
  }
}

if (!/itemId:\s*1001/.test(component) || !/itemId:\s*2001/.test(component)) {
  failures.push("fixed resource entries must declare itemId for dedupe");
}

if (!/new Set\([\s\S]*itemId/.test(component)) {
  failures.push("inventory resources must dedupe against fixed itemId values");
}

if (!/role\.items[\s\S]*role\.itemList[\s\S]*role\.bag\?\.items[\s\S]*role\.inventory/.test(component)) {
  failures.push("roleInfo must continue reading all known inventory sources");
}

if (!/\.\.\.nonZero[\s\S]*\.\.\.inventoryResources[\s\S]*\.\.\.zero/.test(component)) {
  failures.push("resList must place extra non-zero inventory items before zero fixed resources");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("identity card includes all inventory items");

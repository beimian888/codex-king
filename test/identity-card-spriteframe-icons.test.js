import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const catalogPath = join(root, "src/utils/xyzwItemCatalog.ts");
const componentPath = join(root, "src/components/Common/IdentityCard.vue");
const failures = [];

const catalog = readFileSync(catalogPath, "utf8");
const component = readFileSync(componentPath, "utf8");

for (const itemId of [101, 117, 205, 314]) {
  const iconPath = join(root, "public/game-icons/items", `${itemId}.png`);
  if (!catalog.includes(`${itemId}:`)) {
    failures.push(`catalog is missing sprite-frame item ${itemId}`);
  }
  if (!existsSync(iconPath)) {
    failures.push(`missing cropped sprite-frame icon ${itemId}.png`);
  } else if (statSync(iconPath).size < 500) {
    failures.push(`cropped sprite-frame icon ${itemId}.png is unexpectedly small`);
  }
}

if (/catalog\?\.icon[\s\S]*:\s*resourceIconMap\.treasureBowl/.test(component)) {
  failures.push("inventory item fallback still reuses treasureBowl icon");
}

if (!component.includes("unknownItemIcon")) {
  failures.push("IdentityCard.vue should use a neutral unknownItemIcon fallback");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("identity card includes sprite-frame inventory icons");

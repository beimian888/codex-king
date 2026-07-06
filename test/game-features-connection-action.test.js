import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gameFeatures = readFileSync(join(root, "src/views/GameFeatures.vue"), "utf8");

const failures = [];

if (gameFeatures.includes('class="ws-status-section"')) {
  failures.push("game features page still renders the bottom connection status section");
}

if (gameFeatures.includes('class="ws-status-card"')) {
  failures.push("game features page still renders the connection status card");
}

if (!gameFeatures.includes('class="connection-status-button"')) {
  failures.push("game features header must render connection status as a button");
}

if (!gameFeatures.includes("@click=\"toggleConnection\"")) {
  failures.push("connection status button must toggle disconnect/reconnect");
}

if (!gameFeatures.includes(":type=\"connectionButtonType\"")) {
  failures.push("connection status button must expose connected/disconnected visual state");
}

if (!gameFeatures.includes("connectionActionLabel")) {
  failures.push("connection status button must use a dedicated action label");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("game features connection action lives in the page header");

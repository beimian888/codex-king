import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  webGame.includes("@click=\"refreshGameInstance(instance.id)\""),
  "each web game window must expose a refresh button in its own action bar",
);

assert(
  webGame.includes("const refreshGameInstance = (instanceId) =>") &&
    webGame.includes("frameKey: instance.frameKey + 1"),
  "refreshing a web game window must only bump that instance's frame key",
);

assert(
  webGame.includes(":key=\"`${instance.id}-${instance.frameKey}`\""),
  "web game iframe keys must include the per-window frame key",
);

console.log("web game windows have individual refresh controls");

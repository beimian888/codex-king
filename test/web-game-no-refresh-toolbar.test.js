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
  !webGame.includes('class="game-toolbar"'),
  "web game page must not render the standalone refresh toolbar row",
);
assert(
  !webGame.includes("@click=\"refreshGame\"") &&
    !webGame.includes("const refreshGame ="),
  "web game page must not restore a global refresh control or handler",
);
assert(
  webGame.includes('class="game-instance-grid"') &&
    webGame.includes('class="game-frame"'),
  "web game content must render directly after the main navigation",
);

console.log("web game refresh toolbar row is removed");

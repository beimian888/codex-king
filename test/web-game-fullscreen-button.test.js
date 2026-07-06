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
  webGame.includes("game-instance-fullscreen-button") &&
    webGame.includes('aria-label="铺满全屏"') &&
    webGame.includes("@click=\"toggleGameInstanceFullscreen(instance.id)\""),
  "each web game window must expose a fullscreen button in its action bar",
);

assert(
  webGame.includes('class="game-instance-fullscreen-icon"') &&
    /\.game-instance-fullscreen-icon::before\s*\{[\s\S]*?border-top:\s*2px solid currentColor;/.test(
      webGame,
    ) &&
    /\.game-instance-fullscreen-icon::after\s*\{[\s\S]*?border-bottom:\s*2px solid currentColor;/.test(
      webGame,
    ),
  "the fullscreen button must use the smaller expand icon matching the requested visual",
);

assert(
  webGame.includes("fullscreenGameInstanceId = ref(\"\")") &&
    webGame.includes("fullscreen: isGameInstanceFullscreen(instance.id)") &&
    webGame.includes("toggleGameInstanceFullscreen"),
  "web game must track page-level fullscreen fallback per game window",
);

assert(
  webGame.includes("requestElementFullscreen") &&
    webGame.includes("requestFullscreen") &&
    webGame.includes("webkitRequestFullscreen"),
  "fullscreen action must try native browser fullscreen on the game iframe first",
);

assert(
  /\.game-instance-card\.fullscreen\s*\{[\s\S]*?position:\s*fixed;/.test(
    webGame,
  ) &&
    /\.game-instance-card\.fullscreen\s+\.game-frame\s*\{[\s\S]*?height:\s*100% !important;/.test(
      webGame,
    ) &&
    /\.game-instance-card\.fullscreen\s+\.game-instance-resize-handle\s*\{[\s\S]*?display:\s*none;/.test(
      webGame,
    ),
  "fallback fullscreen mode must make the selected game fill the viewport and hide resize handles",
);

console.log("web game windows have a fullscreen button and fallback fullscreen mode");

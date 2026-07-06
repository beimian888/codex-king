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
  webGame.includes('class="game-instance-actions-toolbar"') &&
    /\.game-instance-actions-toolbar\s*\{[\s\S]*?height:\s*32px;/.test(webGame) &&
    /\.game-instance-actions-toolbar\s*\{[\s\S]*?padding:\s*2px 4px;/.test(webGame) &&
    /\.game-instance-actions-toolbar\s*\{[\s\S]*?border-radius:\s*999px;/.test(webGame) &&
    /\.game-instance-actions-toolbar\s*\{[\s\S]*?background:\s*var\(--web-game-toolbar-bg\);/.test(webGame) &&
    /\.game-instance-actions-toolbar\s*\{[\s\S]*?box-shadow:/.test(webGame),
  "game window actions must use a 20% smaller single pill toolbar matching the reference",
);

assert(
  webGame.includes("--web-game-toolbar-bg: linear-gradient(") &&
    webGame.includes("rgba(255, 255, 255, 0.98)") &&
    webGame.includes("rgba(246, 250, 255, 0.96)") &&
    webGame.includes("rgba(30, 41, 59, 0.94)") &&
    webGame.includes("--web-game-toolbar-shadow:") &&
    !/\.game-instance-actions-toolbar\s*\{[\s\S]*?background:\s*rgba\(255, 255, 255, 0\.88\);/.test(webGame),
  "game window toolbar must use reference-style theme gradients instead of flat translucent backgrounds",
);

assert(
  !webGame.includes("game-instance-menu-button") &&
    !webGame.includes("game-window-menu-dot") &&
    webGame.includes('class="game-window-tool-button game-instance-minimize-button"') &&
    webGame.includes('class="game-instance-minimize-icon"') &&
    webGame.includes('class="game-window-tool-button game-instance-fullscreen-button"') &&
    webGame.includes('class="game-window-tool-button game-instance-refresh-button"') &&
    webGame.includes('class="game-window-tool-button game-instance-close-button"'),
  "game window toolbar must remove the menu button and keep minimize, fullscreen, refresh, and close icon buttons",
);

assert(
  webGame.includes("@click=\"refreshGameInstance(instance.id)\"") &&
    webGame.includes("@click=\"closeGameInstance(instance.id)\"") &&
    webGame.includes('aria-label="刷新当前窗口"') &&
    webGame.includes('aria-label="关闭当前窗口"') &&
    !/<n-button[\s\S]*?@click="closeGameInstance\(instance\.id\)"[\s\S]*?>\s*关闭\s*<\/n-button>/.test(webGame),
  "refresh and close actions must keep behavior but use icon-only buttons",
);

assert(
  /\.game-window-tool-button\s*\{[\s\S]*?width:\s*27px;[\s\S]*?height:\s*26px;/.test(webGame) &&
    /\.game-window-tool-button\s*\{[\s\S]*?font-weight:\s*900;/.test(webGame) &&
    /\.game-window-tool-button \+ \.game-window-tool-button::before\s*\{[\s\S]*?top:\s*6px;[\s\S]*?bottom:\s*6px;[\s\S]*?width:\s*1px;/.test(webGame) &&
    /\.game-window-tool-button \+ \.game-window-tool-button::before\s*\{[\s\S]*?box-shadow:\s*1px 0 0 rgba\(255, 255, 255, 0\.82\);/.test(webGame) &&
    /\.game-instance-close-icon\s*\{[\s\S]*?width:\s*19px;[\s\S]*?height:\s*19px;/.test(webGame) &&
    /\.game-instance-close-icon::before\s*\{[\s\S]*?border:\s*2px solid currentColor;/.test(webGame) &&
    /\.game-instance-close-icon::after\s*\{[\s\S]*?width:\s*6px;[\s\S]*?height:\s*6px;/.test(webGame),
  "game window toolbar buttons must use 20% smaller bold reference-style dimensions and separators",
);

assert(
  /\.game-instance-refresh-button \.n-icon\s*\{[\s\S]*?font-size:\s*18px;[\s\S]*?filter:\s*drop-shadow\(0 0 0 currentColor\);[\s\S]*?transform:\s*scale\(1\.08\);/.test(webGame) &&
    /\.game-instance-refresh-button \.n-icon :deep\(svg\)\s*\{[\s\S]*?stroke-width:\s*48px;/.test(webGame),
  "game window refresh icon must stay visually heavier inside the smaller pill",
);

console.log("web game window actions use the segmented pill toolbar style");

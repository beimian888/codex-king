import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");
const defaultLayout = readFileSync(join(root, "src/layout/DefaultLayout.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  !webGame.includes("WINDOW_WIDTH_STORAGE_KEY"),
  "web game window size must not override the fixed 320px default with saved width",
);
assert(
  !webGame.includes("WINDOW_HEIGHT_STORAGE_KEY"),
  "web game window height must not be stored separately from the fixed aspect ratio",
);
assert(
  webGame.includes("DEFAULT_GAME_WINDOW_WIDTH = 320"),
  "new web game windows must default to 320px wide",
);
assert(
  webGame.includes("GAME_WINDOW_ASPECT_WIDTH = 320") &&
    webGame.includes("GAME_WINDOW_ASPECT_HEIGHT = 560"),
  "web game frame must use a fixed 320:560 aspect ratio",
);
assert(
  webGame.includes("MIN_GAME_WINDOW_WIDTH = 200") &&
    webGame.includes("min-width: 200px"),
  "web game windows must be able to shrink well below the default 320px width",
);
assert(
  !webGame.includes('class="window-size-control"') &&
    !webGame.includes("v-model:value=\"activeGameWindowWidth\"") &&
    !webGame.includes("v-model:value=\"activeGameWindowHeight\"") &&
    !webGame.includes('class="window-size-slider"'),
  "web game toolbar must remove the manual width and height sliders",
);
assert(
  webGame.includes("width: DEFAULT_GAME_WINDOW_WIDTH") &&
    webGame.includes("x: DEFAULT_GAME_WINDOW_X + gameInstances.value.length * 28") &&
    webGame.includes("y: DEFAULT_GAME_WINDOW_Y + gameInstances.value.length * 28"),
  "new game windows must receive independent width, x, and y state",
);
assert(
  webGame.includes("getGameInstanceStyle(instance)") &&
    webGame.includes("getGameFrameStyle(instance)") &&
    webGame.includes("left: `${instance.x}px`") &&
    webGame.includes("top: `${instance.y}px`") &&
    webGame.includes("width: `${instance.width}px`") &&
    webGame.includes("height: `${getGameFrameHeight(instance.width)}px`"),
  "web game cards must use each window's width and derive iframe height from the fixed ratio",
);
assert(
  !/\.instance-count-1\s+\.game-instance-card\s*\{[\s\S]*?max-width:/.test(
    webGame,
  ) && !webGame.includes("--game-window-width"),
  "desktop game windows must not be capped by a static max-width while edge resizing",
);
assert(
  webGame.includes('class="game-instance-canvas"') &&
    webGame.includes("@pointerdown=\"startDragGameInstance($event, instance)\"") &&
    webGame.includes("draggingGameInstance = ref(null)") &&
    webGame.includes("moveDraggingGameInstance") &&
    webGame.includes("stopDraggingGameInstance"),
  "web game windows must support dragging by their header",
);
assert(
    webGame.includes("fullscreenGameInstanceId = ref") &&
    webGame.includes("isGameInstanceFullscreen(instance.id)") &&
    webGame.includes('WEB_GAME_FULLSCREEN_CLASS = "web-game-fullscreen-active"') &&
    webGame.includes("document.documentElement.classList.toggle(WEB_GAME_FULLSCREEN_CLASS") &&
    webGame.includes("syncWebGameFullscreenChrome") &&
    defaultLayout.includes(":global(.web-game-fullscreen-active .default-layout.web-game-layout .dashboard-nav)") &&
    defaultLayout.includes(":global(.web-game-fullscreen-active .default-layout.web-game-layout .main)") &&
    webGame.includes("game-instance-fullscreen-button") &&
    /class="game-window-tool-button game-instance-fullscreen-button"[\s\S]*?aria-label="[^"]+"/.test(webGame) &&
    webGame.includes("@click=\"toggleGameInstanceFullscreen(instance.id)\"") &&
    webGame.includes("enterGameInstanceFullscreen(instance.id") &&
    webGame.includes("isMobileViewport()") &&
    /\.game-instance-card\.fullscreen\s*\{[\s\S]*?position:\s*fixed;/.test(webGame) &&
    /\.game-instance-fullscreen-icon::before\s*\{[\s\S]*?border-top:\s*2px solid/.test(webGame) &&
    /@media \(max-width: 768px\)[\s\S]*?\.game-instance-card\.fullscreen \.game-instance-header\s*\{[\s\S]*?display:\s*none;/.test(webGame),
  "web game windows must support a fullscreen button and auto fullscreen on mobile open",
);
assert(
    webGame.includes('class="game-instance-resize-handle resize-right"') &&
    webGame.includes('class="game-instance-resize-handle resize-bottom"') &&
    webGame.includes('class="game-instance-resize-handle resize-corner"') &&
    webGame.includes("startResizeGameInstance($event, instance, 'right')") &&
    webGame.includes("startResizeGameInstance($event, instance, 'bottom')") &&
    webGame.includes("startResizeGameInstance($event, instance, 'corner')") &&
    webGame.includes("resizingGameInstance = ref(null)") &&
    webGame.includes("moveResizingGameInstance") &&
    webGame.includes("stopResizingGameInstance"),
  "web game windows must resize by dragging their edges",
);
assert(
  webGame.includes("getCornerResizeWidth") &&
    !webGame.includes("Math.max(widthFromRight, widthFromBottom)"),
  "corner resizing must support shrinking as well as enlarging",
);
assert(
  webGame.includes("--web-game-dock-gap: 20px") &&
    webGame.includes('<div class="web-game-stage"') &&
    webGame.includes('class="web-game-content"') &&
    webGame.includes('v-if="tokenOptions.length && showFloatingDock"') &&
    !webGame.includes(':class="{ collapsed: isFloatingDockCollapsed }"') &&
    /\.web-game-stage\s*\{[\s\S]*?position:\s*relative;/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?position:\s*absolute;/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?top:\s*16px;/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?left:\s*16px;/.test(webGame) &&
    /\.web-game-content\s*\{[\s\S]*?width:\s*100%;/.test(webGame) &&
    !webGame.includes("grid-template-columns: minmax(248px, 300px) minmax(0, 1fr)"),
  "web game control menu must be a floating panel over full-width game content",
);
assert(
  webGame.includes("showFloatingDock = ref(true)") &&
    !webGame.includes("isFloatingDockCollapsed") &&
    !webGame.includes("@click=\"isFloatingDockCollapsed = !isFloatingDockCollapsed\"") &&
    !webGame.includes("灞曞紑") &&
    !webGame.includes("鏀惰捣") &&
    webGame.includes("@click=\"showFloatingDock = false\"") &&
    webGame.includes('class="floating-dock-reopen"') &&
    webGame.includes("@click=\"showFloatingDock = true\"") &&
    !/\.multi-open-dock\.collapsed\s*\{/.test(webGame),
  "web game floating control panel must remove collapse and keep close and reopen",
);
assert(
  webGame.includes('class="multi-open-dock-close"') &&
    /class="multi-open-dock-close"[\s\S]*?aria-label="[^"]+"/.test(webGame) &&
    webGame.includes('class="multi-open-dock-close-icon"') &&
    /\.multi-open-dock-close\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;[^}]*padding:\s*0;/.test(webGame) &&
    /\.multi-open-dock-close\s*\{[^}]*border:\s*1px solid/.test(webGame) &&
    /\.multi-open-dock-close\s*\{[^}]*border-radius:\s*50%;/.test(webGame) &&
    !/\.multi-open-dock-close\s*\{[^}]*border-left:\s*1px solid/.test(webGame) &&
    /\.multi-open-dock-close-icon\s*\{[\s\S]*?width:\s*28px;[\s\S]*?height:\s*28px;/.test(webGame) &&
    /\.multi-open-dock-close-icon::before\s*\{[\s\S]*?inset:\s*0;[\s\S]*?border:\s*2px solid/.test(webGame) &&
    /\.multi-open-dock-close-icon::after\s*\{[\s\S]*?width:\s*8px;[\s\S]*?height:\s*8px;/.test(webGame),
  "web game floating control close action must use a circular target icon button",
);
assert(
  webGame.includes('class="multi-open-dock-primary-action"') &&
    webGame.includes('class="multi-open-dock-link-actions"') &&
    webGame.includes('class="multi-open-dock-divider"') &&
    /class="multi-open-account-select"[\s\S]*?class="multi-open-dock-primary-action"[\s\S]*?class="multi-open-dock-link-actions"/.test(
      webGame,
    ) &&
    /\.multi-open-dock\s*\{[\s\S]*?width:\s*min\(458px, calc\(100% - 48px\)\);/.test(
      webGame,
    ) &&
    /\.multi-open-dock\s*\{[\s\S]*?transform:\s*scale\(0\.84\);/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?transform-origin:\s*top left;/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?padding:\s*20px 20px 28px;/.test(webGame) &&
    /\.multi-open-dock\s*\{[\s\S]*?border-radius:\s*18px;/.test(webGame) &&
    /\.multi-open-account-select\s*:deep\(\.n-base-selection\)\s*\{[\s\S]*?--n-height:\s*48px;/.test(
      webGame,
    ) &&
    /\.multi-open-account-select\s*:deep\(\.n-base-selection\)\s*\{[\s\S]*?font-size:\s*15px;/.test(
      webGame,
    ) &&
    /\.multi-open-dock-body\s*\{[\s\S]*?gap:\s*24px;/.test(webGame) &&
    /\.multi-open-dock-primary-action\s*\{[\s\S]*?min-width:\s*102px;/.test(webGame) &&
    /\.multi-open-dock-link-actions\s*\{[\s\S]*?justify-content:\s*center;/.test(
      webGame,
    ) &&
    /\.multi-open-dock-divider\s*\{[\s\S]*?height:\s*24px;/.test(webGame),
  "web game floating control panel must match the reference card format",
);
assert(
  /@media \(max-width: 768px\)[\s\S]*?\.game-frame\s*\{[\s\S]*?width:\s*100%;/.test(webGame),
  "mobile web game frames must stay full width regardless of desktop size setting",
);
assert(
  /@media \(max-width: 768px\)[\s\S]*?\.multi-open-dock\s*\{[\s\S]*?width:\s*min\(360px, calc\(100% - 24px\)\);/.test(webGame) &&
    /@media \(max-width: 768px\)[\s\S]*?\.multi-open-dock-body\s*\{[\s\S]*?flex-direction:\s*column;/.test(webGame) &&
    /@media \(max-width: 768px\)[\s\S]*?\.multi-open-account-select\s*\{[\s\S]*?width:\s*100%;/.test(webGame),
  "mobile web game floating control panel must keep the same vertical reference layout",
);
assert(
  !webGame.includes("localStorage.getItem(WINDOW_WIDTH_STORAGE_KEY)") &&
    !webGame.includes("localStorage.setItem(WINDOW_WIDTH_STORAGE_KEY") &&
    !webGame.includes("localStorage.getItem(WINDOW_HEIGHT_STORAGE_KEY)") &&
    !webGame.includes("localStorage.setItem(WINDOW_HEIGHT_STORAGE_KEY"),
  "web game default width must not be restored or saved with localStorage",
);

console.log("web game windows resize from edges with a fixed ratio");

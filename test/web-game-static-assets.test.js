import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGameEntry = join(root, "public/web-game/asar/index.html");
const webGameBridge = join(root, "public/web-game/asar/web-helper-bridge.js");
const webGameMain = join(root, "public/web-game/asar/main.2a00e.js");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(existsSync(webGameEntry), "web game static entry index.html must exist");
assert(existsSync(webGameBridge), "web game helper bridge must exist");
assert(existsSync(webGameMain), "web game main bundle must exist");

const entryHtml = readFileSync(webGameEntry, "utf8");
assert(
  entryHtml.includes("web-helper-bridge.js") &&
    entryHtml.includes("main.2a00e.js"),
  "web game entry must load the game bridge and main bundle",
);

const bridgeScript = readFileSync(webGameBridge, "utf8");
assert(
  bridgeScript.includes("installEmbeddedChromeHider") &&
    bridgeScript.includes("xyzw-platform-chrome-hidden") &&
    bridgeScript.includes("MutationObserver") &&
    bridgeScript.includes('document.body.querySelectorAll("*")') &&
    bridgeScript.includes("element.contains(gameCanvas)") &&
    bridgeScript.includes("document.elementsFromPoint") &&
    bridgeScript.includes("findTopChromeCandidate") &&
    bridgeScript.includes("subtree: true") &&
    bridgeScript.includes("Cocos2dGameContainer") &&
    bridgeScript.includes("GameCanvas"),
  "web game bridge must hide embedded platform top chrome without hiding the Cocos game canvas",
);

assert(
  entryHtml.includes("web-helper-bridge.js?v=20260706-hide-chrome5"),
  "web game entry must bump the helper bridge version so browsers do not reuse cached top-chrome code",
);

assert(
  !bridgeScript.includes("EMBEDDED_CHROME_HEIGHT") &&
    !bridgeScript.includes("translateY(-44px)") &&
    !bridgeScript.includes("calc(100% + 44px)"),
  "web game bridge must not crop the game canvas to hide the outer app navigation bar",
);

console.log("web game static assets are present");

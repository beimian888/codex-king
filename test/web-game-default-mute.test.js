import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");
const webGameBridge = readFileSync(
  join(root, "public/web-game/asar/web-helper-bridge.js"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  webGame.includes('params.set("muted", "1")'),
  "web game iframe entry URL must request muted startup by default",
);
assert(
  webGameBridge.includes("installDefaultMute") &&
    webGameBridge.includes("HTMLMediaElement.prototype.play") &&
    webGameBridge.includes("cc.audioEngine.setMusicVolume(0)") &&
    webGameBridge.includes("cc.audioEngine.setEffectsVolume(0)"),
  "web game bridge must install default mute guards for media and Cocos audio",
);

console.log("web game starts muted by default");

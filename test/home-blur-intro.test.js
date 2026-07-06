import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const home = readFileSync(join(root, "src/views/Home.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const introCopy =
  "北冕之王是一款面向《咸鱼之王》玩家的网页综合管理平台，提供账号管理、游戏功能、网页游戏和日常任务等模块，帮助用户更高效地管理多个游戏账号和更好的游戏体验。";

assert(home.includes(introCopy), "home must include the exact requested intro copy");
assert(home.includes("const heroIntroText ="), "home must keep the intro copy in a dedicated script constant");
assert(home.includes("const heroIntroSegments = computed("), "home must split intro copy into animated segments");
assert(home.includes('class="hero-intro-blur'), "home must render the intro copy in the hero blue-box position");
assert(home.includes(':aria-label="heroIntroText"'), "intro text must keep a complete accessible label");
assert(home.includes("heroIntroSegments"), "intro text must render generated segments");
assert(home.includes("--intro-index"), "each intro segment must expose its stagger index to CSS");
assert(home.includes("hero-intro-segment"), "intro text must wrap each animated segment in a styled span");
assert(home.includes("@keyframes intro-blur-in"), "intro text must define a blur-in keyframe animation");
assert(home.includes("filter: blur(10px)") || home.includes("filter: blur(12px)"), "intro animation must start blurred");
assert(home.includes("filter: blur(0)") || home.includes("filter: blur(0px)"), "intro animation must end sharp");
assert(home.includes("prefers-reduced-motion: reduce"), "intro animation must respect reduced-motion preferences");

console.log("home blur intro contract is present");

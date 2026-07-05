import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const themeToggle = readFileSync(
  join(root, "src/components/Common/ThemeToggle.vue"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  themeToggle.includes('class="theme-switch"'),
  "theme toggle must render the custom switch container",
);
assert(
  themeToggle.includes('type="checkbox"') &&
    themeToggle.includes('class="theme-switch-input"') &&
    themeToggle.includes(':checked="isDark"') &&
    themeToggle.includes('@change="toggleTheme"'),
  "theme toggle must keep a checked checkbox bound to the current theme and change handler",
);
assert(
  themeToggle.includes('class="theme-switch-slider round"') &&
    themeToggle.includes('class="sun-moon"') &&
    themeToggle.includes('class="moon-dot moon-dot-1"') &&
    themeToggle.includes('class="cloud cloud-light cloud-1"') &&
    themeToggle.includes('class="stars"') &&
    themeToggle.includes('class="star star-1"'),
  "theme toggle must include the sun moon slider visuals",
);
assert(
  themeToggle.includes(":aria-label=\"") &&
    themeToggle.includes("切换到浅色模式") &&
    themeToggle.includes("切换到深色模式"),
  "theme toggle must expose an accessible theme switch label",
);
assert(
  !themeToggle.includes("<n-button") &&
    !themeToggle.includes("@vicons/ionicons5"),
  "theme toggle must not use the old Naive UI icon button implementation",
);

console.log("theme toggle uses the custom sun moon switch");

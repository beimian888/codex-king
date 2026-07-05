import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const layout = readFileSync(join(root, "src/layout/DefaultLayout.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const userInfoStart = layout.indexOf('class="user-info"');
assert(userInfoStart !== -1, "default layout must render the nav user info block");

const userInfoEnd = layout.indexOf("</div>", userInfoStart);
const userInfoBlock = layout.slice(userInfoStart, userInfoEnd);

assert(userInfoBlock.includes("<n-avatar"), "nav user info must render an avatar");
assert(
  userInfoBlock.includes(":src=\"selectedToken?.avatar || '/icons/codex-icon.svg'\""),
  "nav user avatar must use the project logo as the default image",
);
assert(
  userInfoBlock.includes('fallback-src="/icons/codex-icon.svg"'),
  "nav user avatar fallback must use the project logo",
);
assert(
  !userInfoBlock.includes("/icons/xiaoyugan.png"),
  "nav user avatar must no longer use xiaoyugan as its default image",
);

console.log("default layout nav avatar uses the project logo by default");

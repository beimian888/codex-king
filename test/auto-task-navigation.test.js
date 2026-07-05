import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const home = read("src/views/Home.vue");
const router = read("src/router/index.js");
const layout = read("src/layout/DefaultLayout.vue");
const batchDailyTasks = read("src/views/BatchDailyTasks.vue");

const homeAutoTaskItem = '{ id: "option4", label: "自动任务", to: "/admin/batch-daily-tasks" }';
assert(
  home.includes(homeAutoTaskItem),
  "home capsule navigation must label option4 as auto task and target batch daily tasks",
);
assert(
  !home.includes('{ id: "option4", label: "日常任务", to: "/admin/daily-tasks" }'),
  "home capsule navigation must no longer send the fourth item to daily tasks",
);

const batchRouteStart = router.indexOf("path: 'batch-daily-tasks'");
assert(batchRouteStart !== -1, "router must keep the BatchDailyTasks route");
const batchRouteEnd = router.indexOf("path:", batchRouteStart + 1);
const batchRouteBlock = router.slice(batchRouteStart, batchRouteEnd === -1 ? undefined : batchRouteEnd);
assert(
  batchRouteBlock.includes("path: 'batch-daily-tasks'"),
  "auto task module must keep the existing batch daily tasks path",
);
assert(
  batchRouteBlock.includes("title: '自动任务'"),
  "BatchDailyTasks route title must be renamed to auto task",
);
assert(
  !batchRouteBlock.includes("title: '批量日常'"),
  "BatchDailyTasks route title must not keep the old batch daily label",
);

for (const section of ["desktop", "mobile drawer"]) {
  const markup = section === "desktop"
    ? layout.slice(layout.indexOf('class="nav-menu"'), layout.indexOf('class="nav-user"'))
    : layout.slice(layout.indexOf('class="drawer-menu"'), layout.indexOf("</div>", layout.indexOf('class="drawer-menu"')));
  const autoTaskLink = markup.indexOf('to="/admin/batch-daily-tasks"');
  assert(autoTaskLink !== -1, `${section} navigation must keep the auto task module link`);
  const linkEnd = markup.indexOf("</router-link>", autoTaskLink);
  const linkBlock = markup.slice(autoTaskLink, linkEnd);
  assert(linkBlock.includes("<span>自动任务</span>"), `${section} navigation must label batch daily tasks as auto task`);
  assert(!linkBlock.includes("批量日常"), `${section} navigation must not show the old batch daily label`);
}

assert(
  batchDailyTasks.includes("<h2>自动任务</h2>"),
  "batch daily tasks page heading must be renamed to auto task",
);
assert(
  !batchDailyTasks.includes("<h2>批量日常任务</h2>"),
  "batch daily tasks page heading must not keep the old title",
);

console.log("auto task navigation contract is satisfied");

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const batchDailyTasks = readFileSync(join(root, "src/views/BatchDailyTasks.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function styleBlock(selector) {
  let searchFrom = 0;
  while (searchFrom < batchDailyTasks.length) {
    const start = batchDailyTasks.indexOf(`${selector} {`, searchFrom);
    if (start === -1) {
      break;
    }
    const end = batchDailyTasks.indexOf("\n}", start);
    assert(end !== -1, `style block ${selector} must close`);
    const block = batchDailyTasks.slice(start, end);
    if (block.includes("background")) {
      return block;
    }
    searchFrom = end + 2;
  }

  assert(false, `style block ${selector} with background must exist`);
}

function globalStyleBlock(selector) {
  const start = batchDailyTasks.indexOf(`:global(${selector}) {`);
  assert(start !== -1, `global style block ${selector} must exist`);
  const end = batchDailyTasks.indexOf("\n}", start);
  assert(end !== -1, `global style block ${selector} must close`);
  return batchDailyTasks.slice(start, end);
}

const headerStart = batchDailyTasks.indexOf('class="page-header auto-task-hero"');
assert(headerStart !== -1, "auto task page must use the redesigned hero toolbar container");

const headerEnd = batchDailyTasks.indexOf("<!-- Token Selection -->", headerStart);
assert(headerEnd !== -1, "auto task hero toolbar must stay above the token selection card");

const headerBlock = batchDailyTasks.slice(headerStart, headerEnd);

assert(
  headerBlock.includes('class="auto-task-hero-main"') &&
    headerBlock.includes('class="auto-task-title-block"') &&
    headerBlock.includes('class="auto-task-summary-list"'),
  "auto task toolbar must group title and schedule summaries in the left overview column",
);
assert(
  headerBlock.includes('class="auto-task-control-board"') &&
    headerBlock.includes('class="auto-task-control-row"') &&
    headerBlock.includes('class="auto-task-control-row auto-task-control-row--primary"'),
  "auto task toolbar must use one right-side control board with two ordered rows",
);
assert(
  headerBlock.includes("定时管理") && headerBlock.includes("执行控制"),
  "auto task control rows must have clear labels",
);
assert(
  !headerBlock.includes("auto-task-status-strip") &&
    !headerBlock.includes("auto-task-config-actions") &&
    !headerBlock.includes("auto-task-run-actions"),
  "auto task toolbar must remove the old scattered rail layout",
);
assert(
  headerBlock.indexOf("新增定时任务") <
    headerBlock.indexOf("查看定时任务") &&
    headerBlock.indexOf("查看定时任务") !== -1,
  "auto task schedule actions must keep add before view",
);
assert(
  !headerBlock.includes("导出配置") &&
    !headerBlock.includes("导入配置") &&
    !headerBlock.includes('@click="exportConfig"') &&
    !headerBlock.includes(':custom-request="importConfig"') &&
    !headerBlock.includes("<n-upload"),
  "auto task toolbar must remove export and import configuration actions",
);
assert(
  !headerBlock.includes("开始执行") &&
    !headerBlock.includes("停止") &&
    !headerBlock.includes('@click="startBatch"') &&
    !headerBlock.includes('@click="stopBatch"'),
  "auto task run actions must remove the start and stop buttons from the top toolbar",
);
assert(
  headerBlock.indexOf("任务模板") !== -1 &&
    headerBlock.indexOf("设置") !== -1 &&
    headerBlock.indexOf("任务模板") < headerBlock.indexOf("设置"),
  "auto task run actions must keep template before settings",
);
assert(
  !headerBlock.includes("background-color: #f8f9fa") &&
    !headerBlock.includes("border: 1px solid #e9ecef"),
  "auto task toolbar must remove pale inline surfaces from the dark page header",
);

assert(
  batchDailyTasks.includes(".auto-task-hero") &&
    batchDailyTasks.includes(".auto-task-control-board") &&
    batchDailyTasks.includes(".auto-task-control-row"),
  "auto task toolbar styles must be defined for the new sections",
);
assert(
  batchDailyTasks.includes('[data-theme="dark"] .auto-task-hero') &&
    batchDailyTasks.includes('[data-theme="dark"] .auto-task-control-board'),
  "auto task toolbar must define dark-mode surfaces for the redesigned sections",
);
for (const selector of [".auto-task-summary-list", ".auto-task-control-board", ".auto-task-control-row"]) {
  const block = styleBlock(selector);
  const normalizedBlock = block.replace(/\s+/g, " ");
  assert(
    normalizedBlock.includes("rgba(255, 255, 255") || block.includes("var(--app-surface)"),
    `${selector} base surface must be light because light mode removes data-theme`,
  );
  assert(
    !block.includes("rgba(15, 23, 42") && !block.includes("rgba(30, 41, 59"),
    `${selector} base surface must not force a dark block in light mode`,
  );
}
assert(
  !batchDailyTasks.includes('[data-theme="light"] .auto-task-summary-list') &&
    !batchDailyTasks.includes('[data-theme="light"] .auto-task-control-board') &&
    !batchDailyTasks.includes('[data-theme="light"] .auto-task-hero'),
  "auto task toolbar must not rely on light data-theme selectors because light mode has no data-theme attribute",
);
for (const selector of [
  '[data-theme="dark"] .auto-task-hero',
  '[data-theme="dark"] .auto-task-summary-list',
  '[data-theme="dark"] .auto-task-control-board',
  '[data-theme="dark"] .auto-task-control-row--primary',
]) {
  const block = globalStyleBlock(selector);
  assert(
    block.includes("rgba(15, 23, 42") || block.includes("rgba(30, 41, 59") || block.includes("#111827"),
    `${selector} must keep dark-mode surfaces explicit`,
  );
}
assert(
  globalStyleBlock('[data-theme="dark"] .auto-task-control-row').includes("rgba(30, 41, 59"),
  "dark mode must override the base control rows with a dark surface",
);
assert(
  batchDailyTasks.includes("@media (max-width: 1400px)") &&
    batchDailyTasks.includes(".auto-task-hero") &&
    batchDailyTasks.includes("grid-template-columns: 1fr;"),
  "auto task toolbar must stack before the right log column makes the control board overflow",
);
assert(
  batchDailyTasks.includes("@media (max-width: 768px)") &&
    batchDailyTasks.includes(".auto-task-control-row"),
  "auto task toolbar must have mobile layout rules for its action groups",
);

console.log("auto task toolbar layout contract is satisfied");

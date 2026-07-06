import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function collectVueFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectVueFiles(fullPath);
    }
    return entry.name.endsWith(".vue") ? [fullPath] : [];
  });
}

const brokenSelectors = [];

for (const file of collectVueFiles(join(root, "src"))) {
  const source = readFileSync(file, "utf8");
  const styleBlocks = source.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi);

  for (const block of styleBlocks) {
    const [, attributes, styleSource] = block;
    if (!/\bscoped\b/.test(attributes) || !styleSource.includes('[data-theme="dark"]')) {
      continue;
    }

    const styleStartLine = source.slice(0, block.index).split(/\r?\n/).length;
    const lines = styleSource.split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const usesDarkTheme = trimmed.includes('[data-theme="dark"]');
      if (!usesDarkTheme) return;

      const wrapsWholeSelector = trimmed.includes(':global([data-theme="dark"] ');
      const halfGlobal = trimmed.includes(':global([data-theme="dark"]) .');
      const bareScopedSelector =
        trimmed.startsWith('[data-theme="dark"]') ||
        trimmed.includes(', [data-theme="dark"]');
      const splitGlobalDeep =
        trimmed.includes(':global([data-theme="dark"]') && trimmed.includes(":deep(");

      if (!wrapsWholeSelector || halfGlobal || bareScopedSelector || splitGlobalDeep) {
        brokenSelectors.push(
          `${file.replace(`${root}\\`, "")}:${styleStartLine + index}: ${trimmed}`,
        );
      }
    });
  }
}

assert(
  brokenSelectors.length === 0,
  `scoped dark-mode selectors must wrap the full selector in :global(...):\n${brokenSelectors.join("\n")}`,
);

const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");

assert(
  tokenImport.includes("--account-glass: rgba(15, 23, 42, 0.86);") &&
    tokenImport.includes("--account-glass-strong: rgba(17, 24, 39, 0.94);"),
  "account page dark mode must use deep surfaces instead of washed-out gray glass",
);

assert(
  tokenImport.includes(":global([data-theme=\"dark\"] .header-actions)") &&
    tokenImport.includes("background: rgba(2, 6, 23, 0.34) !important;"),
  "account page dark mode header actions must sit on a subtle dark rail",
);

assert(
  tokenImport.includes(":global([data-theme=\"dark\"] .default-layout .token-card.arco-card)") &&
    tokenImport.includes("background: linear-gradient(145deg, rgba(30, 41, 59, 0.74), rgba(15, 23, 42, 0.92)), var(--account-glass-strong) !important;"),
  "account page dark mode token cards must override global Arco card glass",
);

assert(
  !tokenImport.includes(":global([data-theme=\"dark\"] .token-card-storage-inline)") &&
    !tokenImport.includes(".token-card-status-row"),
  "account page dark mode must not keep removed storage or connection status badge styles",
);

assert(
  tokenImport.includes("grid-template-columns: minmax(0, 1fr);") &&
    tokenImport.includes("padding: 18px 20px;") &&
    tokenImport.includes("min-height: 96px;"),
  "account token cards must reserve vertical space for identity controls and the shared command row",
);

assert(
  tokenImport.includes(".token-card-command-row") &&
    tokenImport.includes("gap: 10px 14px;") &&
    tokenImport.includes("justify-content: flex-end;") &&
    tokenImport.includes(".token-card-actions {\n  flex-wrap: nowrap;"),
  "account token card controls must share one compact command row so edit/delete cannot overlap the game feature button",
);

assert(
  tokenImport.includes(":deep(.arco-card-body)") &&
    tokenImport.includes("display: none;") &&
    !tokenImport.includes("class=\"token-card-primary-action\""),
  "account token card body must not reserve old lower-area space after the game feature action is removed",
);

assert(
  tokenImport.includes("padding: 14px 2px 2px;") &&
    tokenImport.includes("padding: 19px 1px 1px;"),
  "account token grid must leave 16px of visible top room so selected card outlines are not pressed against the header",
);

console.log("dark mode scoped selectors and account surfaces are safe");

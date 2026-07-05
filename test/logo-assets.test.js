import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const logoPath = "/icons/codex-icon.svg";

const checks = [
  {
    file: "index.html",
    pattern: `rel="icon" type="image/svg+xml" href="${logoPath}"`,
    label: "browser favicon",
  },
  {
    file: "src/layout/DefaultLayout.vue",
    pattern: `src="${logoPath}" alt="北冕之王" class="brand-logo"`,
    label: "default layout brand logo",
  },
  {
    file: "src/views/Home.vue",
    pattern: `src="${logoPath}" alt="北冕之王"`,
    label: "home global brand logo",
  },
  {
    file: "src/views/Login.vue",
    pattern: `src="${logoPath}" alt="北冕之王" class="brand-logo"`,
    label: "login brand logo",
  },
  {
    file: "src/views/Register.vue",
    pattern: `src="${logoPath}" alt="北冕之王" class="brand-logo"`,
    label: "register brand logo",
  },
  {
    file: "src/views/TokenImport/index.vue",
    pattern: `src="${logoPath}" alt="北冕之王" class="brand-logo"`,
    label: "token import brand logo",
  },
];

const failures = [];

if (!existsSync(join(root, "public/icons/codex-icon.svg"))) {
  failures.push("missing public/icons/codex-icon.svg");
}

for (const check of checks) {
  const content = readFileSync(join(root, check.file), "utf8");
  if (!content.includes(check.pattern)) {
    failures.push(`${check.label} still does not use ${logoPath}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("brand logo assets are unified");

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(
  join(root, "src/views/TokenImport/index.vue"),
  "utf8",
);
const singleBin = readFileSync(
  join(root, "src/views/TokenImport/singlebin.vue"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  tokenImport.includes("添加账号") && !tokenImport.includes("添加游戏Token"),
  "token import modal title should be renamed to add account",
);

assert(
  !singleBin.includes('v-model:value="importForm.name"') &&
    !singleBin.includes("<a-list>") &&
    !singleBin.includes("<n-collapse") &&
    !singleBin.includes("@click=\"handleImport\""),
  "single bin modal should remove manual role name, preview list, details collapse, and add-token button",
);

assert(
  singleBin.includes("addSingleBinToken") &&
    singleBin.includes("tokenStore.updateToken") &&
    singleBin.includes("tokenStore.addToken") &&
    singleBin.includes("tokenStore.fetchTokenAvatar") &&
    singleBin.includes('$emit("ok")'),
  "single bin upload should automatically add or update the token and close the modal",
);

assert(
  singleBin.includes("single-bin-import-form") &&
    singleBin.includes("single-bin-upload") &&
    singleBin.includes("arco-upload-drag") &&
    singleBin.includes("[data-theme=\"dark\"] .single-bin-import-form"),
  "single bin modal should use account-page aligned upload styling in light and dark themes",
);

console.log("single bin import auto-add behavior is enforced");

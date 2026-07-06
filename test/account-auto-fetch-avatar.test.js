import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const read = (path) => readFileSync(join(root, path), "utf8");
const tokenStore = read("src/stores/tokenStore.ts");
const importForms = [
  "src/views/TokenImport/manual.vue",
  "src/views/TokenImport/singlebin.vue",
  "src/views/TokenImport/wxqrcode.vue",
  "src/views/TokenImport/bin.vue",
  "src/views/TokenImport/url.vue",
];

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  tokenStore.includes("const fetchTokenAvatar") &&
    tokenStore.includes("sendGetRoleInfo(tokenId)") &&
    tokenStore.includes("selectToken(tokenId, true)") &&
    tokenStore.includes("fetchTokenAvatar,"),
  "token store must expose a helper that requests role info or connects to fetch the avatar",
);

for (const formPath of importForms) {
  const source = read(formPath);
  assert(
    source.includes("fetchTokenAvatar"),
    `${formPath} must fetch the role avatar after adding or updating an account`,
  );
}

console.log("account import fetches role avatar automatically after adding accounts");

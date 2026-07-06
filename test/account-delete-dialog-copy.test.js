import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const deleteStart = tokenImport.indexOf("const deleteToken = (token) => {");
assert(deleteStart !== -1, "deleteToken handler must exist");

const deleteEnd = tokenImport.indexOf("};", deleteStart);
assert(deleteEnd !== -1, "deleteToken handler must close");

const deleteBlock = tokenImport.slice(deleteStart, deleteEnd);

assert(deleteBlock.includes('title: "删除账号"'), "delete dialog title must be 删除账号");
assert(
  deleteBlock.includes('content: `确定要删除"${token.name}"吗?`'),
  "delete dialog content must ask to delete the game name without extra Token wording",
);
assert(!deleteBlock.includes("删除Token"), "delete dialog must not show 删除Token");
assert(!deleteBlock.includes("此操作无法恢复"), "delete dialog must not include the old extra warning sentence");

console.log("account delete dialog copy matches requested wording");

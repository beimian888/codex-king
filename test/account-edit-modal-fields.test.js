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

const modalStart = tokenImport.indexOf('v-model:show="showEditModal"');
assert(modalStart !== -1, "edit account modal block must exist");

const modalEnd = tokenImport.indexOf("</n-modal>", modalStart);
assert(modalEnd !== -1, "edit account modal must close with n-modal");

const modalBlock = tokenImport.slice(modalStart, modalEnd);

assert(modalBlock.includes('title="编辑账号"'), "edit modal title must be 编辑账号");
assert(modalBlock.includes('label="名称"'), "edit modal must keep the account name field");
assert(modalBlock.includes('label="服务器"'), "edit modal must keep the server field");

for (const removedLabel of ["Token字符串", "WebSocket地址", "备注"]) {
  assert(!modalBlock.includes(removedLabel), `edit modal must not render ${removedLabel}`);
}

const editRulesStart = tokenImport.indexOf("const editRules = {");
assert(editRulesStart !== -1, "editRules must exist");

const editRulesEnd = tokenImport.indexOf("};", editRulesStart);
assert(editRulesEnd !== -1, "editRules must close");

const editRulesBlock = tokenImport.slice(editRulesStart, editRulesEnd);
assert(!editRulesBlock.includes("token:"), "editRules must not validate removed token field");
assert(editRulesBlock.includes("请输入账号名称"), "name validation should use account wording");

const saveEditStart = tokenImport.indexOf("const saveEdit = async () => {");
assert(saveEditStart !== -1, "saveEdit must exist");

const saveEditEnd = tokenImport.indexOf("};", saveEditStart);
assert(saveEditEnd !== -1, "saveEdit must close");

const saveEditBlock = tokenImport.slice(saveEditStart, saveEditEnd);
const updateStart = saveEditBlock.indexOf("tokenStore.updateToken");
assert(updateStart !== -1, "saveEdit must update the account");

const updateEnd = saveEditBlock.indexOf("});", updateStart);
assert(updateEnd !== -1, "updateToken payload must close");

const updateBlock = saveEditBlock.slice(updateStart, updateEnd);
assert(updateBlock.includes("name: editForm.name"), "saveEdit must update the account name");
assert(updateBlock.includes("server: editForm.server"), "saveEdit must update the server");

for (const removedPayload of ["token:", "wsUrl:", "remark:"]) {
  assert(!updateBlock.includes(removedPayload), `saveEdit must not update ${removedPayload}`);
}

console.log("edit account modal only edits name and server");

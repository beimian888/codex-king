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

const tokenImport = read("src/views/TokenImport/index.vue");
const systemData = await import("../src/utils/systemManagementData.js");
const { changeCurrentSystemUserPassword } = systemData;

assert(
  typeof changeCurrentSystemUserPassword === "function",
  "system data layer must export changeCurrentSystemUserPassword",
);

assert(
  tokenImport.includes('class="account-password-panel"'),
  "account page must render a password-change panel below account management",
);
assert(
  tokenImport.includes('v-model:value="passwordForm.currentPassword"'),
  "password panel must bind the original password field",
);
assert(
  tokenImport.includes('v-model:value="passwordForm.newPassword"'),
  "password panel must bind the new password field",
);
assert(
  tokenImport.includes('v-model:value="passwordForm.confirmPassword"'),
  "password panel must bind the confirm password field",
);
assert(
  tokenImport.includes("@submit.prevent=\"handleChangePassword\"") &&
    tokenImport.includes("changeCurrentSystemUserPassword({"),
  "password panel must submit through handleChangePassword and call the data layer",
);

const result = await changeCurrentSystemUserPassword({
  currentPassword: "oldpass1",
  newPassword: "newpass1",
  confirmPassword: "newpass1",
});

assert(!result.success, "password change must stay disabled until the backend api exists");
assert(
  result.message === "后端暂未开放修改密码接口",
  "password change placeholder message must clearly point to the missing backend api",
);

console.log("account password change data flow and page contract are covered");

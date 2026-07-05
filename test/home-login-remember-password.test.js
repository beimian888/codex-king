import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const home = readFileSync(join(root, "src/views/Home.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function blockBetween(start, end) {
  const startIndex = home.indexOf(start);
  assert(startIndex !== -1, `missing block start: ${start}`);
  const endIndex = home.indexOf(end, startIndex);
  assert(endIndex !== -1, `missing block end: ${end}`);
  return home.slice(startIndex, endIndex);
}

assert(
  home.includes('const SYSTEM_AUTH_REMEMBER_KEY = "xyzw_system_auth_remember";'),
  "home must define an independent localStorage key for remembered login fields",
);
assert(home.includes("const rememberPassword = ref(false);"), "home must track remember-password state");

const passwordInputIndex = home.indexOf('name="password"');
const feedbackIndex = home.indexOf('class="auth-feedback"', passwordInputIndex);
assert(passwordInputIndex !== -1 && feedbackIndex !== -1, "login form must contain password input before feedback");
const rememberOptionBlock = home.slice(passwordInputIndex, feedbackIndex);
assert(
  rememberOptionBlock.includes('v-if="!isRegisterMode"'),
  "remember-password option must only render in login mode",
);
assert(
  rememberOptionBlock.includes('class="remember-password-option"'),
  "remember-password option must use a dedicated class for stable styling",
);
assert(
  rememberOptionBlock.includes('type="checkbox"') &&
    rememberOptionBlock.includes('v-model="rememberPassword"'),
  "remember-password option must be a checkbox bound to rememberPassword",
);
assert(rememberOptionBlock.includes("记住密码"), "remember-password option must use the requested label");

const resetBlock = blockBetween("const resetAuthForm =", "const handleAuthSubmit =");
assert(
  resetBlock.includes("rememberPassword.value = false;"),
  "resetAuthForm must clear remember-password state before applying saved fields",
);

const readBlock = blockBetween("const readRememberedAuth =", "const applyRememberedAuth =");
assert(
  readBlock.includes("localStorage.getItem(SYSTEM_AUTH_REMEMBER_KEY)") &&
    readBlock.includes("JSON.parse") &&
    readBlock.includes("catch"),
  "home must read remembered auth safely from localStorage",
);

const applyBlock = blockBetween("const applyRememberedAuth =", "const saveRememberedAuth =");
assert(applyBlock.includes("readRememberedAuth()"), "applyRememberedAuth must use the read helper");
assert(applyBlock.includes("authForm.username = saved.username || \"\";"), "saved username must be restored");
assert(
  applyBlock.includes("rememberPassword.value = Boolean(saved.rememberPassword);"),
  "saved remember-password state must be restored",
);
assert(
  applyBlock.includes("authForm.password = saved.rememberPassword ? saved.password || \"\" : \"\";"),
  "saved password must only be restored when rememberPassword was enabled",
);

const saveBlock = blockBetween("const saveRememberedAuth =", "const handleAuthSubmit =");
assert(
  saveBlock.includes("username: authForm.username") &&
    saveBlock.includes("rememberPassword: rememberPassword.value"),
  "saveRememberedAuth must always save username and remember-password state",
);
assert(
  saveBlock.includes("if (rememberPassword.value)") &&
    saveBlock.includes("payload.password = authForm.password;"),
  "saveRememberedAuth must only save password when rememberPassword is checked",
);
assert(
  saveBlock.includes("localStorage.setItem(SYSTEM_AUTH_REMEMBER_KEY, JSON.stringify(payload));"),
  "saveRememberedAuth must persist the remembered auth payload",
);

const openLoginModalBlock = blockBetween("const openLoginModal =", "const closeLoginModal =");
assert(
  openLoginModalBlock.indexOf("resetAuthForm();") < openLoginModalBlock.indexOf("applyRememberedAuth();") &&
    openLoginModalBlock.indexOf("applyRememberedAuth();") < openLoginModalBlock.indexOf("isLoginModalVisible.value = true;"),
  "opening the login modal must reset the form, apply saved fields, then show the modal",
);

const authSubmitBlock = blockBetween("const handleAuthSubmit =", "const handleLoginKeydown =");
assert(
  authSubmitBlock.includes("if (!isRegisterMode.value)") &&
    authSubmitBlock.includes("saveRememberedAuth();"),
  "successful login must save remembered auth fields, while successful registration must not",
);

assert(home.includes(".remember-password-option"), "remember-password option must have scoped styles");

console.log("home login remember-password contract is present");

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

function blockBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  assert(startIndex !== -1, `missing block start: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert(endIndex !== -1, `missing block end: ${end}`);
  return source.slice(startIndex, endIndex);
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

globalThis.localStorage = createMemoryStorage();

const {
  SYSTEM_SESSION_KEY,
  getCurrentSystemSession,
  loginSystemUser,
  logoutSystemUser,
} = await import("../src/utils/systemManagementData.js");

assert(typeof logoutSystemUser === "function", "system data layer must export logoutSystemUser");

const loginResult = loginSystemUser({ username: "111", password: "111" });
assert(loginResult.success, "super admin login must succeed before logout");
assert(localStorage.getItem(SYSTEM_SESSION_KEY), "login must create a system session before logout");

logoutSystemUser();
assert(!localStorage.getItem(SYSTEM_SESSION_KEY), "logoutSystemUser must remove the system session");
assert(getCurrentSystemSession() === null, "logoutSystemUser must make the current session empty");

const home = read("src/views/Home.vue");

assert(
  home.includes("logoutSystemUser") && home.includes("@/utils/systemManagementData"),
  "home must import logoutSystemUser from the system data layer",
);
assert(
  home.includes("`欢迎 ${currentSystemSession.value.username}`"),
  "logged-in welcome text must use a space between 欢迎 and username",
);
assert(!home.includes("欢迎，"), "logged-in welcome text must not include a comma");
assert(home.includes("退出当前账号"), "logged-in welcome button must expose a logout label");

const desktopLoginStart = home.indexOf('class="button desktop-login"');
assert(desktopLoginStart !== -1, "desktop login button must exist");
const desktopLoginEnd = home.indexOf("</button>", desktopLoginStart);
const desktopLoginButton = home.slice(desktopLoginStart, desktopLoginEnd);
assert(
  desktopLoginButton.includes('@click="handleLoginButtonClick"'),
  "desktop welcome button must use the shared login/logout click handler",
);
assert(
  !desktopLoginButton.includes(':disabled="isSystemLoggedIn"'),
  "desktop welcome button must remain clickable after login so it can log out",
);
assert(
  desktopLoginButton.includes('class="login-button-label"') &&
    desktopLoginButton.includes("{{ loginButtonText }}") &&
    desktopLoginButton.includes('class="login-button-logout"') &&
    desktopLoginButton.includes("退出登录"),
  "desktop welcome button must render both the welcome label and the hover logout label",
);

const mobileLoginStart = home.indexOf('class="mobile-login');
assert(mobileLoginStart !== -1, "mobile login area must exist");
const mobileLoginEnd = home.indexOf("</button>", mobileLoginStart);
const mobileLoginButton = home.slice(mobileLoginStart, mobileLoginEnd);
assert(
  mobileLoginButton.includes('@click="handleLoginButtonClick"'),
  "mobile welcome button must use the shared login/logout click handler",
);
assert(
  !mobileLoginButton.includes(':disabled="isSystemLoggedIn"'),
  "mobile welcome button must remain clickable after login so it can log out",
);

const logoutBlock = blockBetween(home, "const handleSystemLogout =", "const handleLoginButtonClick =");
assert(logoutBlock.includes("logoutSystemUser();"), "home logout handler must clear the system session");
assert(logoutBlock.includes("refreshSystemSession();"), "home logout handler must refresh local login state");
assert(logoutBlock.includes('message.success("已退出登录")'), "home logout handler must confirm logout");

const clickBlock = blockBetween(home, "const handleLoginButtonClick =", "const closeLoginModal =");
assert(
  clickBlock.includes("isSystemLoggedIn.value") &&
    clickBlock.includes("handleSystemLogout();") &&
    clickBlock.includes("openLoginModal();"),
  "home login button click handler must log out when logged in and open login when logged out",
);

assert(
  home.includes(".button.is-welcome:hover .login-button-label") &&
    home.includes(".button.is-welcome:hover .login-button-logout") &&
    home.includes("button-logout-shake"),
  "welcome button must keep a hover transition that swaps the welcome label for logout",
);

console.log("home welcome button logs out and uses the requested hover copy");

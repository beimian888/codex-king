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

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    async json() {
      return payload;
    },
  };
}

const fetchCalls = [];
globalThis.localStorage = createMemoryStorage();
globalThis.fetch = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  fetchCalls.push({ url, options: { ...options, method } });

  if (method === "POST" && url === "/api/auth/login") {
    return createJsonResponse({
      success: true,
      message: "登录成功",
      data: {
        user: {
          id: 1,
          username: "111",
          role: "super_admin",
          lastLoginAt: "2026-07-06 10:08",
        },
      },
    });
  }

  if (method === "POST" && url === "/api/auth/logout") {
    return createJsonResponse({
      success: true,
      message: "退出成功",
      data: {},
    });
  }

  throw new Error(`Unexpected fetch call: ${method} ${url}`);
};

const {
  SYSTEM_SESSION_KEY,
  getCurrentSystemSession,
  loginSystemUser,
  logoutSystemUser,
} = await import("../src/utils/systemManagementData.js");

assert(typeof logoutSystemUser === "function", "system data layer must export logoutSystemUser");

const loginResult = await loginSystemUser({ username: "111", password: "111" });
assert(loginResult.success, "super admin login must succeed before logout");
assert(localStorage.getItem(SYSTEM_SESSION_KEY), "login must create a cached system session before logout");

const logoutResult = await logoutSystemUser();
assert(logoutResult.success, "logout must report backend success");
assert(!localStorage.getItem(SYSTEM_SESSION_KEY), "logoutSystemUser must remove the cached system session");
assert(getCurrentSystemSession() === null, "logoutSystemUser must make the current session empty");

assert(fetchCalls[0].url === "/api/auth/login", "login must call the backend login api");
assert(fetchCalls[1].url === "/api/auth/logout", "logout must call the backend logout api");
assert(fetchCalls[1].options.credentials === "include", "logout must send credentials");

const home = read("src/views/Home.vue");

assert(
  home.includes("logoutSystemUser") && home.includes("@/utils/systemManagementData"),
  "home must import logoutSystemUser from the system data layer",
);
assert(
  home.includes("`欢迎 ${currentSystemSession.value.username}`"),
  "logged-in welcome text must use a space between 欢迎 and username",
);
assert(
  home.includes("loginButtonText") && home.includes("currentSystemSession.value.username"),
  "logged-in welcome text must be derived from current system session state",
);

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
    desktopLoginButton.includes("login-button-logout"),
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
assert(logoutBlock.includes("await logoutSystemUser();"), "home logout handler must await session logout");
assert(logoutBlock.includes("refreshSystemSession();"), "home logout handler must refresh local login state");
assert(logoutBlock.includes("message.success("), "home logout handler must confirm logout");

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

console.log("home welcome button logs out through backend system data client");

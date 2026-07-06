import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const systemPath = "/admin/system-management";

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
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

function createJsonResponse(payload, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  };
}

function createFetchMock(routeMap) {
  const calls = [];
  const fetchMock = async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    calls.push({ url, options: { ...options, method } });
    const routeKey = `${method} ${url}`;
    const queue = routeMap.get(routeKey);
    if (!queue || queue.length === 0) {
      throw new Error(`Unexpected fetch call: ${routeKey}`);
    }
    return queue.shift();
  };
  fetchMock.calls = calls;
  return fetchMock;
}

globalThis.localStorage = createMemoryStorage();
globalThis.fetch = createFetchMock(
  new Map([
    [
      "POST /api/auth/register",
      [
        createJsonResponse({
          success: true,
          message: "注册成功",
          data: {
            user: {
              id: 12,
              username: "测试用户",
              role: "user",
              level: "月卡",
              expiresAt: "2026-08-05 10:00",
              lastLoginAt: "2026-07-06 10:00",
            },
          },
        }),
        createJsonResponse({ success: false, message: "用户名已存在", data: {} }, false, 400),
        createJsonResponse({ success: false, message: "卡密不可用", data: {} }, false, 400),
      ],
    ],
    [
      "POST /api/auth/login",
      [
        createJsonResponse({ success: false, message: "用户名或密码错误", data: {} }, false, 401),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: {
            user: {
              id: 12,
              username: "测试用户",
              role: "user",
              lastLoginAt: "2026-07-06 10:05",
            },
          },
        }),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: {
            user: {
              id: 1,
              username: "111",
              role: "super_admin",
              lastLoginAt: "2026-07-06 10:06",
            },
          },
        }),
      ],
    ],
  ]),
);

const {
  SYSTEM_LICENSE_CARDS_KEY,
  SYSTEM_USERS_KEY,
  SYSTEM_SESSION_KEY,
  SYSTEM_ROLE_SUPER_ADMIN,
  SYSTEM_ROLE_USER,
  getCurrentSystemSession,
  isSystemAdminSession,
  loginSystemUser,
  registerSystemUser,
} = await import("../src/utils/systemManagementData.js");

const registerResult = await registerSystemUser({
  username: "测试用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-MONTH-8F2K-Q7PA",
});

assert(registerResult.success, "registering with backend auth api must succeed");
assert(registerResult.user?.username === "测试用户", "register result must expose the created user");

const registerCall = globalThis.fetch.calls[0];
assert(registerCall.url === "/api/auth/register", "register must call the backend register api");
assert(registerCall.options.credentials === "include", "register must send credentials");
assert(registerCall.options.headers["Content-Type"] === "application/json", "register must send json");
assert(
  JSON.parse(registerCall.options.body).cardKey === "XYZW-MONTH-8F2K-Q7PA",
  "register must forward the activation card key to backend",
);

const sessionAfterRegister = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(sessionAfterRegister.username === "测试用户", "successful register must cache a frontend session");
assert(sessionAfterRegister.role === SYSTEM_ROLE_USER, "register session must cache the user role");
assert(getCurrentSystemSession()?.username === "测试用户", "session helper must read the cached register session");
assert(!isSystemAdminSession(), "normal registered users must not be treated as admins");
assert(!localStorage.getItem(SYSTEM_LICENSE_CARDS_KEY), "frontend must no longer cache license cards locally");
assert(!localStorage.getItem(SYSTEM_USERS_KEY), "frontend must no longer cache user lists locally");

const duplicateUser = await registerSystemUser({
  username: "测试用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-YEAR-M9HD-6LZT",
});
assert(!duplicateUser.success, "duplicate usernames must be rejected by backend response");
assert(duplicateUser.message.includes("用户名已存在"), "duplicate username error must stay readable");

const reusedCard = await registerSystemUser({
  username: "另一个用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-MONTH-8F2K-Q7PA",
});
assert(!reusedCard.success, "used card keys must be rejected by backend response");
assert(reusedCard.message.includes("卡密不可用"), "used card key error must stay readable");

const wrongPassword = await loginSystemUser({
  username: "测试用户",
  password: "wrong-password",
});
assert(!wrongPassword.success, "login must reject the wrong password");
assert(wrongPassword.message.includes("用户名或密码错误"), "wrong password error must stay readable");

const loginResult = await loginSystemUser({
  username: "测试用户",
  password: "secret123",
});
assert(loginResult.success, "login must succeed with a registered system user");
assert(loginResult.user?.lastLoginAt, "successful login must expose last login time");

const sessionAfterLogin = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(sessionAfterLogin.username === "测试用户", "successful login must overwrite the cached session");
assert(sessionAfterLogin.role === SYSTEM_ROLE_USER, "normal user login must cache the user role");

const superAdminLogin = await loginSystemUser({
  username: "111",
  password: "111",
});
assert(superAdminLogin.success, "built-in super admin login must succeed through backend auth api");
assert(
  superAdminLogin.user?.role === SYSTEM_ROLE_SUPER_ADMIN,
  "super admin login result must carry super_admin role",
);

const superAdminSession = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(
  superAdminSession.role === SYSTEM_ROLE_SUPER_ADMIN,
  "super admin login must cache the super_admin role",
);
assert(isSystemAdminSession(), "super admin login must be treated as an admin session");

const home = read("src/views/Home.vue");
const systemPage = read("src/views/SystemManagement.vue");

assert(
  home.includes("loginSystemUser") &&
    home.includes("registerSystemUser") &&
    home.includes("@/utils/systemManagementData"),
  "home auth modal must import the system management auth functions",
);
assert(home.includes('@submit.prevent="handleAuthSubmit"'), "home auth modal form must submit through handleAuthSubmit");
assert(home.includes("const authForm = reactive({"), "home auth modal must keep a reactive auth form");
assert(home.includes('v-model="authForm.username"'), "home username input must be bound to authForm");
assert(home.includes('v-model="authForm.password"'), "home password input must be bound to authForm");
assert(home.includes('v-model="authForm.confirmPassword"'), "home confirm password input must be bound to authForm");
assert(home.includes('v-model="authForm.cardKey"'), "home card key input must be bound to authForm");
assert(home.includes("registerSystemUser({"), "home register mode must call registerSystemUser");
assert(home.includes("loginSystemUser({"), "home login mode must call loginSystemUser");
assert(home.includes(`router.push("${systemPath}")`), "home auth success must enter system management");
assert(home.includes('class="auth-feedback"'), "home auth modal must render inline auth feedback");

assert(
  systemPage.includes("refreshSystemManagementData") &&
    systemPage.includes("@/utils/systemManagementData"),
  "system management page must read system data through the data layer",
);
assert(systemPage.includes("const users = ref("), "system management page must keep local users state");
assert(systemPage.includes("activeSection === 'users'"), "user management must render a real users section");
assert(systemPage.includes("<th>用户名</th>"), "user table must include username column");
assert(systemPage.includes("<th>激活卡密</th>"), "user table must include activation card column");
assert(systemPage.includes("<th>最后登录</th>"), "user table must include last login column");
assert(systemPage.includes("licenseCards.value = data.licenseCards"), "refresh must reload cards from the data layer");
assert(systemPage.includes("users.value = data.users"), "refresh must reload users from the data layer");
assert(
  systemPage.includes('message.success("已刷新系统管理数据")') &&
    systemPage.includes("const data = refreshSystemManagementData();"),
  "refresh flow must expose a success feedback path",
);

console.log("home auth is connected to the backend system data client");

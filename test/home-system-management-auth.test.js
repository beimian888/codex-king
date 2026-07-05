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

function parseDateTime(value) {
  const [date, time] = String(value || "").split(" ");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function diffWholeDays(start, end) {
  return Math.round((parseDateTime(end).getTime() - parseDateTime(start).getTime()) / 86400000);
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
  SYSTEM_LICENSE_CARDS_KEY,
  SYSTEM_USERS_KEY,
  SYSTEM_SESSION_KEY,
  SYSTEM_ROLE_SUPER_ADMIN,
  SYSTEM_ROLE_USER,
  getSystemLicenseCards,
  getSystemUsers,
  isSystemAdminSession,
  loginSystemUser,
  registerSystemUser,
} = await import("../src/utils/systemManagementData.js");

const registerResult = registerSystemUser({
  username: "测试用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-MONTH-8F2K-Q7PA",
});

assert(registerResult.success, "registering with an unused card key must succeed");
assert(registerResult.user?.username === "测试用户", "register result must return the created user");

const usedCard = getSystemLicenseCards().find((card) => card.cardKey === "XYZW-MONTH-8F2K-Q7PA");
assert(usedCard?.status === "used", "registration must mark the card key as used");
assert(usedCard?.statusText === "已使用", "used card key must use the 已使用 status text");
assert(usedCard?.user === "测试用户", "used card key must record the registering username");
assert(usedCard?.usedAt, "used card key must record a use time");
assert(usedCard?.expiresAt, "used card key must record an expiry time after activation");
assert(
  diffWholeDays(usedCard.usedAt, usedCard.expiresAt) === 30,
  "month cards must expire 30 days after activation",
);

const users = getSystemUsers();
assert(users.length === 1, "registration must create one system user");
assert(users[0].cardKey === "XYZW-MONTH-8F2K-Q7PA", "system user must record the activation card");
assert(users[0].level === "月卡", "system user must inherit the card level");
assert(users[0].expiresAt === usedCard.expiresAt, "system user expiry must match the activated card expiry");
assert(users[0].statusText === "正常", "system user must be active after registration");
assert(users[0].role === SYSTEM_ROLE_USER, "registered system users must default to the user role");

const duplicateUser = registerSystemUser({
  username: "测试用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-YEAR-M9HD-6LZT",
});
assert(!duplicateUser.success, "duplicate usernames must be rejected");
assert(duplicateUser.message.includes("用户名已存在"), "duplicate username error must be clear");

const reusedCard = registerSystemUser({
  username: "另一个用户",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-MONTH-8F2K-Q7PA",
});
assert(!reusedCard.success, "used card keys must be rejected");
assert(reusedCard.message.includes("卡密已被使用"), "used card key error must be clear");

const wrongPassword = loginSystemUser({
  username: "测试用户",
  password: "wrong-password",
});
assert(!wrongPassword.success, "login must reject the wrong password");
assert(wrongPassword.message.includes("用户名或密码错误"), "wrong password error must be clear");

const loginResult = loginSystemUser({
  username: "测试用户",
  password: "secret123",
});
assert(loginResult.success, "login must succeed with a registered system user");
assert(loginResult.user?.lastLoginAt, "successful login must update last login time");

const session = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(session.username === "测试用户", "successful login must persist a system session");
assert(session.role === SYSTEM_ROLE_USER, "normal user login must persist the user role");
assert(!isSystemAdminSession(), "normal registered users must not be treated as admins");
assert(localStorage.getItem(SYSTEM_LICENSE_CARDS_KEY), "license cards must be stored under the system key");
assert(localStorage.getItem(SYSTEM_USERS_KEY), "users must be stored under the system key");

const superAdminLogin = loginSystemUser({
  username: "111",
  password: "111",
});
assert(superAdminLogin.success, "built-in super admin login must succeed");
assert(superAdminLogin.user?.role === SYSTEM_ROLE_SUPER_ADMIN, "super admin login result must carry super_admin role");
const superAdminSession = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(superAdminSession.role === SYSTEM_ROLE_SUPER_ADMIN, "super admin login must persist the super_admin role");
assert(isSystemAdminSession(), "super admin login must be treated as an admin session");

const home = read("src/views/Home.vue");
const systemPage = read("src/views/SystemManagement.vue");

assert(
  home.includes("loginSystemUser") &&
    home.includes("registerSystemUser") &&
    home.includes("@/utils/systemManagementData"),
  "home auth modal must import the system management auth functions",
);
assert(
  home.includes('@submit.prevent="handleAuthSubmit"'),
  "home auth modal form must submit through handleAuthSubmit",
);
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
  "system management page must read local system data through the data layer",
);
assert(systemPage.includes("const users = ref("), "system management page must keep local users state");
assert(systemPage.includes("activeSection === 'users'"), "user management must render a real users section");
assert(systemPage.includes("<th>用户名</th>"), "user table must include username column");
assert(systemPage.includes("<th>激活卡密</th>"), "user table must include activation card column");
assert(systemPage.includes("<th>最后登录</th>"), "user table must include last login column");
assert(systemPage.includes("licenseCards.value = data.licenseCards"), "refresh must reload cards from the data layer");
assert(systemPage.includes("users.value = data.users"), "refresh must reload users from the data layer");
assert(systemPage.includes("已刷新系统管理数据"), "refresh feedback must mention system management data");

console.log("home auth is connected to the local system management data");

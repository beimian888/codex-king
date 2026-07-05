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

const systemData = await import("../src/utils/systemManagementData.js");
const {
  SYSTEM_SESSION_KEY,
  SYSTEM_ROLE_SUPER_ADMIN,
  SYSTEM_ROLE_ADMIN,
  SYSTEM_ROLE_USER,
  loginSystemUser,
  registerSystemUser,
  getCurrentSystemSession,
  isSystemAdminSession,
  isSystemSuperAdminSession,
  getSystemAdmins,
  createSystemAdmin,
  deleteSystemAdmin,
} = systemData;

for (const [name, value] of [
  ["SYSTEM_ROLE_SUPER_ADMIN", SYSTEM_ROLE_SUPER_ADMIN],
  ["SYSTEM_ROLE_ADMIN", SYSTEM_ROLE_ADMIN],
  ["SYSTEM_ROLE_USER", SYSTEM_ROLE_USER],
]) {
  assert(value, `${name} must be exported from the system management data layer`);
}

for (const [name, value] of [
  ["getCurrentSystemSession", getCurrentSystemSession],
  ["isSystemAdminSession", isSystemAdminSession],
  ["isSystemSuperAdminSession", isSystemSuperAdminSession],
  ["getSystemAdmins", getSystemAdmins],
  ["createSystemAdmin", createSystemAdmin],
  ["deleteSystemAdmin", deleteSystemAdmin],
]) {
  assert(typeof value === "function", `${name} must be exported as a function`);
}

assert(SYSTEM_ROLE_SUPER_ADMIN === "super_admin", "super admin role value must be super_admin");
assert(SYSTEM_ROLE_ADMIN === "admin", "admin role value must be admin");
assert(SYSTEM_ROLE_USER === "user", "normal user role value must be user");

const superLogin = loginSystemUser({
  username: "111",
  password: "111",
});
assert(superLogin.success, "built-in super admin must be able to log in");
assert(superLogin.user?.role === SYSTEM_ROLE_SUPER_ADMIN, "super admin login result must carry super_admin role");

let session = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(session?.username === "111", "super admin login must persist the super admin username");
assert(session?.role === SYSTEM_ROLE_SUPER_ADMIN, "super admin session must persist the super_admin role");
assert(getCurrentSystemSession()?.role === SYSTEM_ROLE_SUPER_ADMIN, "current session helper must read the super admin role");
assert(isSystemAdminSession(), "super admin session must be treated as an admin session");
assert(isSystemSuperAdminSession(), "super admin session must be treated as a super admin session");

const registeredFromAdminSession = registerSystemUser({
  username: "registered-after-admin",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-YEAR-M9HD-6LZT",
});
assert(registeredFromAdminSession.success, "registering a normal user while an admin session exists must succeed");
session = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(
  session?.role === SYSTEM_ROLE_USER,
  "normal registration must replace any previous admin session with a user session",
);
assert(!isSystemAdminSession(), "normal registration must not leave an admin session active");

loginSystemUser({
  username: "111",
  password: "111",
});

const createAdminResult = createSystemAdmin({
  username: "ops-admin",
  password: "ops123456",
  confirmPassword: "ops123456",
});
assert(createAdminResult.success, "super admin must be able to create a normal admin");
assert(createAdminResult.admin?.role === SYSTEM_ROLE_ADMIN, "created admin must carry admin role");
assert(!createAdminResult.admin?.cardKey, "created admin must not consume or store a license card key");

const duplicateAdminResult = createSystemAdmin({
  username: "ops-admin",
  password: "ops123456",
  confirmPassword: "ops123456",
});
assert(!duplicateAdminResult.success, "duplicate admin usernames must be rejected");

const adminsAfterCreate = getSystemAdmins();
assert(
  adminsAfterCreate.some((admin) => admin.username === "111" && admin.role === SYSTEM_ROLE_SUPER_ADMIN),
  "admin list must include the built-in super admin",
);
assert(
  adminsAfterCreate.some((admin) => admin.username === "ops-admin" && admin.role === SYSTEM_ROLE_ADMIN),
  "admin list must include created normal admins",
);

const adminLogin = loginSystemUser({
  username: "ops-admin",
  password: "ops123456",
});
assert(adminLogin.success, "created normal admin must be able to log in");
assert(adminLogin.user?.role === SYSTEM_ROLE_ADMIN, "created admin login result must carry admin role");
session = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(session?.role === SYSTEM_ROLE_ADMIN, "normal admin session must persist admin role");
assert(isSystemAdminSession(), "normal admin session must be treated as an admin session");
assert(!isSystemSuperAdminSession(), "normal admin session must not be treated as super admin");

const deniedCreate = createSystemAdmin({
  username: "blocked-admin",
  password: "blocked123",
  confirmPassword: "blocked123",
});
assert(!deniedCreate.success, "normal admins must not be able to create other admins");

const registeredUser = registerSystemUser({
  username: "normal-user",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: "XYZW-MONTH-8F2K-Q7PA",
});
assert(registeredUser.success, "normal users must still be able to register with an unused card key");
assert(registeredUser.user?.role === SYSTEM_ROLE_USER, "registered users must default to the user role");

const userLogin = loginSystemUser({
  username: "normal-user",
  password: "secret123",
});
assert(userLogin.success, "registered normal user must be able to log in");
assert(userLogin.user?.role === SYSTEM_ROLE_USER, "normal user login result must carry user role");
session = JSON.parse(localStorage.getItem(SYSTEM_SESSION_KEY));
assert(session?.role === SYSTEM_ROLE_USER, "normal user session must persist user role");
assert(!isSystemAdminSession(), "normal user session must not be treated as an admin session");
assert(!isSystemSuperAdminSession(), "normal user session must not be treated as super admin");

const deniedDelete = deleteSystemAdmin("ops-admin");
assert(!deniedDelete.success, "normal users must not be able to delete admins");

loginSystemUser({
  username: "111",
  password: "111",
});
const superDeleteResult = deleteSystemAdmin("111");
assert(!superDeleteResult.success, "built-in super admin account must not be deletable");

const deleteAdminResult = deleteSystemAdmin("ops-admin");
assert(deleteAdminResult.success, "super admin must be able to delete normal admins");
assert(
  !getSystemAdmins().some((admin) => admin.username === "ops-admin"),
  "deleted normal admins must be removed from the admin list",
);

const router = read("src/router/index.js");
const layout = read("src/layout/DefaultLayout.vue");
const systemPage = read("src/views/SystemManagement.vue");

assert(
  router.includes('import { isSystemAdminSession } from "@/utils/systemManagementData"') ||
    router.includes("import { isSystemAdminSession } from '@/utils/systemManagementData'"),
  "router must import isSystemAdminSession",
);
assert(
  router.includes("to.name === 'SystemManagement'") && router.includes("!isSystemAdminSession()"),
  "router guard must block non-admin direct visits to system management",
);
assert(
  layout.includes("isSystemAdminSession") && layout.includes("canViewSystemManagement"),
  "default layout must compute system management visibility from admin session state",
);
assert(
  layout.includes('v-if="canViewSystemManagement"') && layout.includes('to="/admin/system-management"'),
  "desktop and mobile system management links must be gated by canViewSystemManagement",
);
assert(systemPage.includes("管理员管理"), "system management page must include the admin management section label");
assert(systemPage.includes("isSystemSuperAdminSession"), "system management page must check super admin session state");
assert(systemPage.includes("getSystemAdmins"), "system management page must read admins from the data layer");
assert(systemPage.includes("createSystemAdmin"), "system management page must create admins through the data layer");
assert(systemPage.includes("deleteSystemAdmin"), "system management page must delete admins through the data layer");
assert(systemPage.includes('activeSection === "admins"'), "system management page must render an admins section");

console.log("system admin permission contract is satisfied");

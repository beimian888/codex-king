import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const home = readFileSync(join(root, "src/views/Home.vue"), "utf8");
const app = readFileSync(join(root, "src/App.vue"), "utf8");

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
  home.includes("getCurrentSystemSession") &&
    home.includes("@/utils/systemManagementData"),
  "home must read login state from the system management session data layer",
);
assert(home.includes("const currentSystemSession = ref("), "home must keep current system session state");
assert(home.includes("const isSystemLoggedIn = computed("), "home must derive an isSystemLoggedIn computed value");
assert(home.includes("const loginButtonText = computed("), "home must derive login button text from session state");
assert(home.includes("const refreshSystemSession ="), "home must define a session refresh helper");
assert(home.includes("欢迎 "), "logged-in login button text must greet the user with a space");
assert(!home.includes("欢迎，"), "logged-in login button text must not use a comma");

const desktopLoginStart = home.indexOf('class="button desktop-login"');
assert(desktopLoginStart !== -1, "desktop login button must exist");
const desktopLoginEnd = home.indexOf("</button>", desktopLoginStart);
const desktopLoginButton = home.slice(desktopLoginStart, desktopLoginEnd);
assert(
  desktopLoginButton.includes('@click="handleLoginButtonClick"'),
  "desktop login button must use the shared login/logout click handler",
);
assert(
  desktopLoginButton.includes("{{ loginButtonText }}"),
  "desktop login button must render the computed login button text",
);

const mobileLoginStart = home.indexOf('class="mobile-login');
assert(mobileLoginStart !== -1, "mobile login area must exist");
const mobileLoginEnd = home.indexOf("</button>", mobileLoginStart);
const mobileLoginButton = home.slice(mobileLoginStart, mobileLoginEnd);
assert(
  mobileLoginButton.includes('@click="handleLoginButtonClick"'),
  "mobile login button must use the shared login/logout click handler",
);
assert(
  mobileLoginButton.includes("{{ loginButtonText }}"),
  "mobile login button must render the computed login button text",
);

const goToBlock = blockBetween("const goTo =", "const openLoginModal =");
assert(goToBlock.includes("!isSystemLoggedIn.value"), "home navigation must check login state before routing");
assert(
  app.includes('placement="top"') &&
    app.includes('container-class="center-message-provider"') &&
    app.includes(".center-message-provider") &&
    app.includes("height: 100vh") &&
    app.includes("justify-content: center") &&
    app.includes("align-items: center"),
  "global message provider must place warnings in the screen center",
);
assert(home.includes("const loginRequiredWarning = ref(null)"), "home must store the active login-required warning");
assert(home.includes("const showLoginRequiredWarning ="), "home must centralize the login-required warning display");
const warningHelperBlock = blockBetween("const showLoginRequiredWarning =", "const goTo =");
assert(
  warningHelperBlock.includes('message.warning("登录后体验完整内容"'),
  "home warning helper must show the exact login-required warning",
);
assert(
  warningHelperBlock.includes("loginRequiredWarning.value") &&
    warningHelperBlock.indexOf("return") < warningHelperBlock.indexOf("message.warning"),
  "home must not create another login-required warning while one is active",
);
assert(
  warningHelperBlock.includes("onAfterLeave") &&
    warningHelperBlock.includes("loginRequiredWarning.value = null"),
  "home must allow another login-required warning only after the current one disappears",
);
assert(
  goToBlock.includes("showLoginRequiredWarning()") &&
    !goToBlock.includes('message.warning("登录后体验完整内容")'),
  "home navigation must use the single-instance login warning helper",
);
assert(goToBlock.indexOf("return") < goToBlock.indexOf("router.push(path)"), "home navigation must return before router push when blocked");

const openLoginModalBlock = blockBetween("const openLoginModal =", "const handleSystemLogout =");
assert(
  openLoginModalBlock.includes("isSystemLoggedIn.value") &&
    openLoginModalBlock.includes("return"),
  "logged-in users must not be able to reopen the login modal from the welcome button",
);

const logoutBlock = blockBetween("const handleSystemLogout =", "const handleLoginButtonClick =");
assert(
  logoutBlock.includes("logoutSystemUser()") &&
    logoutBlock.includes("refreshSystemSession()"),
  "logged-in users must be able to log out from the welcome button",
);

const authSubmitBlock = blockBetween("const handleAuthSubmit =", "const handleLoginKeydown =");
assert(
  authSubmitBlock.includes("refreshSystemSession()") &&
    authSubmitBlock.indexOf("refreshSystemSession()") < authSubmitBlock.indexOf('router.push("/admin/system-management")'),
  "home must refresh login state before auth success navigation",
);

assert(
  home.includes('window.addEventListener("storage", refreshSystemSession)'),
  "home must refresh login state when local session storage changes",
);
assert(
  home.includes('window.addEventListener("focus", refreshSystemSession)'),
  "home must refresh login state when returning to the page",
);

console.log("home login state and gated navigation contract are present");

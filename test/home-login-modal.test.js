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

assert(
  home.includes('class="login-modal"'),
  "home page must render the 5176 login modal overlay",
);
assert(
  home.includes("@click=\"openLoginModal\""),
  "home login buttons must open the login modal",
);
assert(
  !home.includes("@click=\"goTo('/admin/account-management')\""),
  "home login buttons must not navigate away before opening a modal",
);
assert(
  home.includes("const openLoginModal ="),
  "home page must define a dedicated login modal opener",
);
assert(
  home.includes('class="login-form"'),
  "home login modal must render the 5176 login form",
);
assert(home.includes('class="login-title"'), "home login modal must include the login title");
assert(home.includes('name="username"'), "home login modal must include a username input");
assert(home.includes('name="password"'), "home login modal must include a password input");
assert(home.includes('class="login-submit"'), "home login modal must include the login submit button");
assert(home.includes("authMode"), "home auth modal must track login/register mode");
assert(
  home.includes('class="login-register-switch"'),
  "home login modal must include a register switch button",
);
assert(
  home.includes("@click=\"authMode = 'register'\""),
  "home register switch must change the modal to register mode",
);
assert(
  home.includes('name="confirmPassword"'),
  "home register modal must include a confirm password input",
);
assert(home.includes('name="cardKey"'), "home register modal must include a card key input");
assert(
  home.includes('isRegisterMode ? "注册" : "登录"'),
  "home auth modal title and submit text must switch between login and register",
);
assert(home.includes('class="login-close"'), "home login modal must include a close button");
assert(!home.includes('class="home-login-modal"'), "home page must not use the token import modal");
assert(!home.includes("WxQrcodeForm"), "home login modal must not import the token QR form");
assert(!home.includes("SingleBinTokenForm"), "home login modal must not import the token BIN form");

console.log("home login button opens the 5176 login modal");

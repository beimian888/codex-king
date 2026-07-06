function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function createJsonResponse(payload, ok = true) {
  return {
    ok,
    async json() {
      return payload;
    },
  };
}

globalThis.fetch = async (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  if (method === "POST" && url === "/api/auth/login") {
    return createJsonResponse({
      success: true,
      message: "登录成功",
      data: {
        user: {
          id: 1,
          username: "111",
          role: "super_admin",
          lastLoginAt: "2026-07-06 10:30",
        },
      },
    });
  }

  throw new Error(`Unexpected fetch call: ${method} ${url}`);
};

const { loginSystemUser } = await import("../src/utils/systemManagementData.js");

const superAdminLogin = await loginSystemUser({
  username: "111",
  password: "111",
});

assert(superAdminLogin.success, "built-in super admin login must succeed");
assert(
  superAdminLogin.message === "登录成功",
  "built-in super admin login success message must be readable Chinese",
);
assert(
  !/[閻ц缍嶉幋鎰]/.test(superAdminLogin.message),
  "built-in super admin login message must not contain mojibake",
);

console.log("system login success messages are readable");

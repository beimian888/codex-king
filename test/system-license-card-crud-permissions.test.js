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
      "POST /api/auth/login",
      [
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: { user: { id: 1, username: "111", role: "super_admin", lastLoginAt: "2026-07-06 10:20" } },
        }),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: { user: { id: 2, username: "quota-admin", role: "admin", lastLoginAt: "2026-07-06 10:21" } },
        }),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: { user: { id: 1, username: "111", role: "super_admin", lastLoginAt: "2026-07-06 10:22" } },
        }),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: { user: { id: 1, username: "111", role: "super_admin", lastLoginAt: "2026-07-06 10:23" } },
        }),
        createJsonResponse({
          success: true,
          message: "登录成功",
          data: { user: { id: 1, username: "111", role: "super_admin", lastLoginAt: "2026-07-06 10:24" } },
        }),
      ],
    ],
    [
      "POST /api/system/admins",
      [
        createJsonResponse({
          success: true,
          message: "管理员创建成功",
          data: {
            admin: {
              id: 2,
              username: "quota-admin",
              role: "admin",
              cardCreateQuota: { 月卡: 1, 季卡: 1, 年卡: 0 },
              cardCreateUsed: { 月卡: 0, 季卡: 0, 年卡: 0 },
            },
          },
        }),
      ],
    ],
    [
      "GET /api/system/admins",
      [
        createJsonResponse({
          success: true,
          message: "查询成功",
          data: {
            admins: [
              { id: 1, username: "111", role: "super_admin" },
              {
                id: 2,
                username: "quota-admin",
                role: "admin",
                cardCreateQuota: { 月卡: 1, 季卡: 1, 年卡: 0 },
                cardCreateUsed: { 月卡: 0, 季卡: 0, 年卡: 0 },
              },
            ],
          },
        }),
      ],
    ],
    [
      "POST /api/system/cards",
      [
        createJsonResponse({
          success: true,
          message: "卡密创建成功",
          data: {
            card: {
              cardKey: "XYZW-A1B2-C3D4",
              level: "月卡",
              remark: "管理员额度创建1",
              createdBy: "quota-admin",
            },
          },
        }),
        createJsonResponse({
          success: true,
          message: "卡密创建成功",
          data: {
            card: {
              cardKey: "XYZW-E5F6-G7H8",
              level: "季卡",
              remark: "管理员额度创建2",
              createdBy: "quota-admin",
            },
          },
        }),
        createJsonResponse({ success: false, message: "该类型卡密创建额度不足", data: {} }, false, 403),
        createJsonResponse({
          success: true,
          message: "卡密创建成功",
          data: {
            card: {
              cardKey: "XYZW-S9T0-U1V2",
              level: "季卡",
              remark: "季卡有效期测试",
              createdBy: "111",
            },
          },
        }),
        createJsonResponse({ success: false, message: "无权限", data: {} }, false, 403),
      ],
    ],
    [
      "GET /api/system/cards",
      [
        createJsonResponse({
          success: true,
          message: "查询成功",
          data: {
            licenseCards: [
              { cardKey: "XYZW-A1B2-C3D4", createdBy: "quota-admin" },
              { cardKey: "XYZW-E5F6-G7H8", createdBy: "quota-admin" },
            ],
          },
        }),
        createJsonResponse({
          success: true,
          message: "查询成功",
          data: {
            licenseCards: [
              { cardKey: "XYZW-MONTH-8F2K-Q7PA", createdBy: "111" },
              { cardKey: "XYZW-A1B2-C3D4", createdBy: "quota-admin" },
              { cardKey: "XYZW-E5F6-G7H8", createdBy: "quota-admin" },
            ],
          },
        }),
        createJsonResponse({
          success: true,
          message: "查询成功",
          data: {
            licenseCards: [
              { cardKey: "XYZW-MONTH-8F2K-Q7PA", createdBy: "111" },
              { cardKey: "XYZW-A1B2-C3D4", createdBy: "quota-admin" },
            ],
          },
        }),
      ],
    ],
    [
      "GET /api/system/users",
      [
        createJsonResponse({
          success: true,
          message: "查询成功",
          data: { users: [{ id: 9, username: "plain-user", role: "user" }] },
        }),
      ],
    ],
    [
      "PUT /api/system/cards/XYZW-A1B2-C3D4",
      [
        createJsonResponse({ success: false, message: "无权限", data: {} }, false, 403),
        createJsonResponse({
          success: true,
          message: "卡密更新成功",
          data: {
            card: {
              cardKey: "XYZW-A1B2-C3D4",
              level: "年卡",
              remark: "超级管理员修改",
            },
          },
        }),
      ],
    ],
    [
      "DELETE /api/system/cards/XYZW-A1B2-C3D4",
      [
        createJsonResponse({ success: false, message: "无权限", data: {} }, false, 403),
        createJsonResponse({
          success: true,
          message: "卡密删除成功",
          data: { card: { cardKey: "XYZW-A1B2-C3D4" } },
        }),
      ],
    ],
    [
      "DELETE /api/system/cards/XYZW-E5F6-G7H8",
      [
        createJsonResponse({
          success: true,
          message: "卡密删除成功",
          data: { card: { cardKey: "XYZW-E5F6-G7H8" } },
        }),
      ],
    ],
    [
      "PUT /api/system/admins/quota-admin/quota",
      [
        createJsonResponse({
          success: true,
          message: "额度更新成功",
          data: {
            admin: {
              username: "quota-admin",
              cardCreateQuota: { 月卡: 2, 季卡: 3, 年卡: 4 },
            },
          },
        }),
      ],
    ],
    [
      "POST /api/auth/register",
      [
        createJsonResponse({
          success: true,
          message: "注册成功",
          data: { user: { id: 9, username: "plain-user", role: "user", lastLoginAt: "2026-07-06 10:25" } },
        }),
        createJsonResponse({
          success: true,
          message: "注册成功",
          data: { user: { id: 10, username: "season-user", role: "user", lastLoginAt: "2026-07-06 10:26" } },
        }),
      ],
    ],
  ]),
);

const systemData = await import("../src/utils/systemManagementData.js");
const {
  loginSystemUser,
  registerSystemUser,
  createSystemAdmin,
  getSystemAdmins,
  createSystemLicenseCard,
  updateSystemLicenseCard,
  deleteSystemLicenseCard,
  refreshSystemManagementData,
  updateSystemAdminCardQuota,
} = systemData;

for (const [name, value] of [
  ["createSystemLicenseCard", createSystemLicenseCard],
  ["updateSystemLicenseCard", updateSystemLicenseCard],
  ["deleteSystemLicenseCard", deleteSystemLicenseCard],
  ["updateSystemAdminCardQuota", updateSystemAdminCardQuota],
]) {
  assert(typeof value === "function", `${name} must be exported as a function`);
}

await loginSystemUser({ username: "111", password: "111" });
const createAdminResult = await createSystemAdmin({
  username: "quota-admin",
  password: "quota123456",
  confirmPassword: "quota123456",
  cardCreateQuota: {
    月卡: 1,
    季卡: 1,
    年卡: 0,
  },
});

assert(createAdminResult.success, "super admin must be able to create an admin with a card quota");
assert(createAdminResult.admin.cardCreateQuota["月卡"] === 1, "created admin must store the monthly card quota");
assert(createAdminResult.admin.cardCreateQuota["季卡"] === 1, "created admin must store the season card quota");
assert(createAdminResult.admin.cardCreateQuota["年卡"] === 0, "created admin must store the yearly card quota");
assert(createAdminResult.admin.cardCreateUsed["月卡"] === 0, "created admin monthly quota usage must start at zero");
assert(createAdminResult.admin.cardCreateUsed["季卡"] === 0, "created admin season quota usage must start at zero");
assert(createAdminResult.admin.cardCreateUsed["年卡"] === 0, "created admin yearly quota usage must start at zero");

let quotaAdmin = (await getSystemAdmins()).find((admin) => admin.username === "quota-admin");
assert(quotaAdmin?.cardCreateQuota["月卡"] === 1, "admin list must expose the monthly card creation quota");
assert(quotaAdmin?.cardCreateQuota["季卡"] === 1, "admin list must expose the season card creation quota");
assert(quotaAdmin?.cardCreateQuota["年卡"] === 0, "admin list must expose the yearly card creation quota");

await loginSystemUser({ username: "quota-admin", password: "quota123456" });
const firstCard = await createSystemLicenseCard({
  cardKey: "XYZW-ADMIN-0001",
  level: "月卡",
  remark: "管理员额度创建1",
});
const secondCard = await createSystemLicenseCard({
  cardKey: "XYZW-ADMIN-0002",
  level: "季卡",
  remark: "管理员额度创建2",
});
const thirdCard = await createSystemLicenseCard({
  cardKey: "XYZW-ADMIN-0003",
  level: "年卡",
  remark: "管理员额度创建3",
});

assert(firstCard.success && secondCard.success, "normal admins must be able to add cards within quota");
assert(
  firstCard.card.cardKey !== "XYZW-ADMIN-0001" && secondCard.card.cardKey !== "XYZW-ADMIN-0002",
  "card keys must always be generated by the backend even when a cardKey is provided",
);
assert(!thirdCard.success, "normal admins must not add cards after quota is used up");
assert(thirdCard.message.includes("额度"), "quota failure must clearly mention quota");

const firstCardCall = globalThis.fetch.calls.find(
  (call) => call.url === "/api/system/cards" && call.options.method === "POST",
);
assert(firstCardCall, "creating cards must call the backend cards api");

const firstGeneratedCardKey = firstCard.card.cardKey;
const secondGeneratedCardKey = secondCard.card.cardKey;
const quotaAdminVisibleCards = await refreshSystemManagementData();
assert(
  quotaAdminVisibleCards.licenseCards.length === 2 &&
    quotaAdminVisibleCards.licenseCards.every((card) => card.createdBy === "quota-admin") &&
    quotaAdminVisibleCards.licenseCards.some((card) => card.cardKey === firstGeneratedCardKey) &&
    quotaAdminVisibleCards.licenseCards.some((card) => card.cardKey === secondGeneratedCardKey),
  "normal admins must only see license cards they created",
);
assert(quotaAdminVisibleCards.users.length === 0, "normal admin refresh must not fetch user lists");
assert(quotaAdminVisibleCards.admins.length === 0, "normal admin refresh must not fetch admin lists");

const deniedUpdate = await updateSystemLicenseCard(firstGeneratedCardKey, { remark: "管理员尝试修改" });
assert(!deniedUpdate.success, "normal admins must not be able to update cards");
const deniedDelete = await deleteSystemLicenseCard(firstGeneratedCardKey);
assert(!deniedDelete.success, "normal admins must not be able to delete cards");

await loginSystemUser({ username: "111", password: "111" });
const superAdminVisibleCards = await refreshSystemManagementData();
assert(
  superAdminVisibleCards.licenseCards.some((card) => card.cardKey === "XYZW-MONTH-8F2K-Q7PA") &&
    superAdminVisibleCards.licenseCards.some((card) => card.cardKey === firstGeneratedCardKey),
  "super admins must see all license cards, including cards created by normal admins",
);
assert(superAdminVisibleCards.users.length === 1, "super admin refresh must include users");

const quotaUpdate = await updateSystemAdminCardQuota("quota-admin", {
  月卡: 2,
  季卡: 3,
  年卡: 4,
});
assert(quotaUpdate.success, "super admin must be able to update an admin card quota");
assert(quotaUpdate.admin.cardCreateQuota["月卡"] === 2, "updated monthly admin quota must be persisted");
assert(quotaUpdate.admin.cardCreateQuota["季卡"] === 3, "updated season admin quota must be persisted");
assert(quotaUpdate.admin.cardCreateQuota["年卡"] === 4, "updated yearly admin quota must be persisted");

const updateCard = await updateSystemLicenseCard(firstGeneratedCardKey, {
  level: "年卡",
  remark: "超级管理员修改",
});
assert(updateCard.success, "super admin must be able to update cards");
assert(updateCard.card.level === "年卡", "updated card level must be persisted");
assert(updateCard.card.remark === "超级管理员修改", "updated card remark must be persisted");

const deleteCard = await deleteSystemLicenseCard(secondGeneratedCardKey);
assert(deleteCard.success, "super admin must be able to delete unused cards");

const userRegistration = await registerSystemUser({
  username: "plain-user",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: firstGeneratedCardKey,
});
assert(userRegistration.success, "normal user registration should still consume valid cards");

await loginSystemUser({ username: "111", password: "111" });
const deleteActivatedCard = await deleteSystemLicenseCard(firstGeneratedCardKey);
assert(deleteActivatedCard.success, "super admin must be able to delete used cards");

await loginSystemUser({ username: "111", password: "111" });
const seasonCard = await createSystemLicenseCard({
  level: "季卡",
  remark: "季卡有效期测试",
});
const seasonRegistration = await registerSystemUser({
  username: "season-user",
  password: "secret123",
  confirmPassword: "secret123",
  cardKey: seasonCard.card.cardKey,
});
assert(seasonRegistration.success, "season card registration should succeed");

const deniedUserCreate = await createSystemLicenseCard({
  cardKey: "XYZW-USER-0001",
  level: "月卡",
});
assert(!deniedUserCreate.success, "normal users must not be able to add cards");

console.log("system license card CRUD permissions and admin quota are enforced");

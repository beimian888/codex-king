export const SYSTEM_LICENSE_CARDS_KEY = "xyzw_system_license_cards";
export const SYSTEM_USERS_KEY = "xyzw_system_users";
export const SYSTEM_SESSION_KEY = "xyzw_system_session";
export const SYSTEM_ROLE_SUPER_ADMIN = "super_admin";
export const SYSTEM_ROLE_ADMIN = "admin";
export const SYSTEM_ROLE_USER = "user";

const ROLE_TEXT = {
  [SYSTEM_ROLE_SUPER_ADMIN]: "超级管理员",
  [SYSTEM_ROLE_ADMIN]: "管理员",
  [SYSTEM_ROLE_USER]: "普通用户",
};

const BUILT_IN_SUPER_ADMIN = {
  id: "system_super_admin",
  username: "111",
  password: "111",
  role: SYSTEM_ROLE_SUPER_ADMIN,
  roleText: ROLE_TEXT[SYSTEM_ROLE_SUPER_ADMIN],
  status: "active",
  statusText: "正常",
  cardCreateQuota: null,
  cardCreateUsed: 0,
  createdAt: "2026-07-05 00:00",
  lastLoginAt: "",
};

const LICENSE_LEVELS = ["月卡", "季卡", "年卡"];
const LICENSE_DURATION_DAYS = {
  月卡: 30,
  季卡: 90,
  年卡: 365,
};

const defaultLicenseCards = [
  {
    cardKey: "XYZW-MONTH-8F2K-Q7PA",
    level: "月卡",
    expiresAt: "2026-08-05 23:59",
    status: "unused",
    statusText: "未使用",
    user: "",
    usedAt: "",
    createdAt: "2026-07-05 09:20",
    remark: "活动赠送",
  },
  {
    cardKey: "XYZW-SEASON-J4VN-2RKC",
    level: "季卡",
    expiresAt: "2026-10-05 23:59",
    status: "used",
    statusText: "已使用",
    user: "北冕一号",
    usedAt: "2026-07-05 10:18",
    createdAt: "2026-07-04 21:42",
    remark: "老用户续期",
  },
  {
    cardKey: "XYZW-YEAR-M9HD-6LZT",
    level: "年卡",
    expiresAt: "2027-07-05 23:59",
    status: "unused",
    statusText: "未使用",
    user: "",
    usedAt: "",
    createdAt: "2026-07-03 15:06",
    remark: "管理员生成",
  },
  {
    cardKey: "XYZW-MONTH-A2PW-9XNE",
    level: "月卡",
    expiresAt: "2026-08-05 23:59",
    status: "used",
    statusText: "已使用",
    user: "盐场观察员",
    usedAt: "2026-07-04 18:33",
    createdAt: "2026-07-02 11:28",
    remark: "测试账号",
  },
];

const storage = () => globalThis.localStorage || null;

const cloneDefaultLicenseCards = () => defaultLicenseCards.map((card) => ({ ...card }));

const readJson = (key, fallback) => {
  const localStorage = storage();
  if (!localStorage) {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readObjectJson = (key, fallback = null) => {
  const localStorage = storage();
  if (!localStorage) {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  const localStorage = storage();
  if (localStorage) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const removeJson = (key) => {
  const localStorage = storage();
  if (localStorage) {
    localStorage.removeItem(key);
  }
};

const formatDateTime = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseDateTime = (value) => {
  const [dateText, timeText = "00:00"] = String(value || "").split(" ");
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day, hour || 0, minute || 0);
};

const getLicenseExpiresAt = (level, activatedAt) => {
  const days = LICENSE_DURATION_DAYS[level] || 0;
  const expiresAt = parseDateTime(activatedAt);
  expiresAt.setDate(expiresAt.getDate() + days);
  return formatDateTime(expiresAt);
};

const normalizeCardKey = (cardKey) => String(cardKey || "").trim().toUpperCase();

const normalizeUsername = (username) => String(username || "").trim();

const normalizeLicenseLevel = (level) => {
  const normalizedLevel = String(level || "").trim();
  return LICENSE_LEVELS.includes(normalizedLevel) ? normalizedLevel : "";
};

const normalizeQuota = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
};

const normalizeLevelQuota = (value) => {
  const fallbackQuota = normalizeQuota(value);
  return LICENSE_LEVELS.reduce((quota, level) => {
    const levelValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? value[level]
        : fallbackQuota;
    return {
      ...quota,
      [level]: normalizeQuota(levelValue),
    };
  }, {});
};

const createEmptyLevelQuota = () => normalizeLevelQuota(0);

const isSameUsername = (left, right) =>
  normalizeUsername(left).toLowerCase() === normalizeUsername(right).toLowerCase();

const isBuiltInSuperAdminCredentials = (username, password) =>
  isSameUsername(username, BUILT_IN_SUPER_ADMIN.username) &&
  password === BUILT_IN_SUPER_ADMIN.password;

const withRoleDefaults = (user) => {
  const role = user.role || SYSTEM_ROLE_USER;
  return {
    ...user,
    role,
    roleText: user.roleText || ROLE_TEXT[role] || ROLE_TEXT[SYSTEM_ROLE_USER],
    cardCreateQuota:
      role === SYSTEM_ROLE_ADMIN ? normalizeLevelQuota(user.cardCreateQuota) : user.cardCreateQuota,
    cardCreateUsed:
      role === SYSTEM_ROLE_ADMIN ? normalizeLevelQuota(user.cardCreateUsed) : user.cardCreateUsed || 0,
  };
};

const createSessionPayload = (user, loggedInAt) => ({
  userId: user.id,
  username: user.username,
  role: user.role,
  roleText: user.roleText,
  loggedInAt,
});

const saveSystemLicenseCards = (cards) => {
  writeJson(SYSTEM_LICENSE_CARDS_KEY, cards);
};

const saveSystemUsers = (users) => {
  writeJson(SYSTEM_USERS_KEY, users);
};

export const getSystemLicenseCards = () => {
  const storedCards = readJson(SYSTEM_LICENSE_CARDS_KEY, []);
  if (storedCards.length > 0) {
    return storedCards;
  }

  const seededCards = cloneDefaultLicenseCards();
  saveSystemLicenseCards(seededCards);
  return seededCards;
};

export const getSystemUsers = () => readJson(SYSTEM_USERS_KEY, []).map(withRoleDefaults);

export const getCurrentSystemSession = () => readObjectJson(SYSTEM_SESSION_KEY, null);

export const logoutSystemUser = () => {
  removeJson(SYSTEM_SESSION_KEY);
  return { success: true, message: "已退出登录" };
};

export const isSystemAdminSession = () => {
  const session = getCurrentSystemSession();
  return [SYSTEM_ROLE_SUPER_ADMIN, SYSTEM_ROLE_ADMIN].includes(session?.role);
};

export const isSystemSuperAdminSession = () =>
  getCurrentSystemSession()?.role === SYSTEM_ROLE_SUPER_ADMIN;

export const getSystemAdmins = () => {
  const admins = getSystemUsers().filter((user) => user.role === SYSTEM_ROLE_ADMIN);
  return [{ ...BUILT_IN_SUPER_ADMIN, password: undefined }, ...admins];
};

const getVisibleSystemLicenseCards = () => {
  const session = getCurrentSystemSession();
  const licenseCards = getSystemLicenseCards();

  if (session?.role === SYSTEM_ROLE_SUPER_ADMIN) {
    return licenseCards;
  }

  if (session?.role === SYSTEM_ROLE_ADMIN) {
    return licenseCards.filter((card) => isSameUsername(card.createdBy, session.username));
  }

  return [];
};

export const refreshSystemManagementData = () => ({
  licenseCards: getVisibleSystemLicenseCards(),
  users: getSystemUsers().filter((user) => user.role === SYSTEM_ROLE_USER),
  admins: getSystemAdmins(),
});

const generateSystemCardKey = () => {
  const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `XYZW-${segment()}-${segment()}`;
};

const generateUniqueSystemCardKey = (cards) => {
  const existingKeys = new Set(cards.map((card) => card.cardKey));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const cardKey = generateSystemCardKey();
    if (!existingKeys.has(cardKey)) {
      return cardKey;
    }
  }
  return `XYZW-${Date.now().toString(36).toUpperCase()}`;
};

const getCurrentAdminUserIndex = (users, session = getCurrentSystemSession()) =>
  users.findIndex(
    (user) =>
      user.role === SYSTEM_ROLE_ADMIN &&
      isSameUsername(user.username, session?.username),
  );

const consumeAdminCardQuota = (level) => {
  const session = getCurrentSystemSession();
  if (session?.role !== SYSTEM_ROLE_ADMIN) {
    return { success: true };
  }

  const users = getSystemUsers();
  const adminIndex = getCurrentAdminUserIndex(users, session);
  const admin = users[adminIndex];
  if (!admin) {
    return { success: false, message: "管理员账号不存在" };
  }

  const quota = normalizeLevelQuota(admin.cardCreateQuota);
  const used = normalizeLevelQuota(admin.cardCreateUsed);
  const currentLevelQuota = quota[level] || 0;
  const currentLevelUsed = used[level] || 0;
  if (currentLevelUsed >= currentLevelQuota) {
    return { success: false, message: `${level}增加额度不足，请联系超级管理员调整额度` };
  }

  users[adminIndex] = {
    ...admin,
    cardCreateQuota: quota,
    cardCreateUsed: {
      ...used,
      [level]: currentLevelUsed + 1,
    },
  };
  saveSystemUsers(users);
  return { success: true };
};

export const createSystemLicenseCard = (form) => {
  const session = getCurrentSystemSession();
  if (![SYSTEM_ROLE_SUPER_ADMIN, SYSTEM_ROLE_ADMIN].includes(session?.role)) {
    return { success: false, message: "只有管理员可以新增卡密" };
  }

  const level = normalizeLicenseLevel(form?.level);
  const remark = String(form?.remark || "").trim();

  if (!level) {
    return { success: false, message: "请选择卡密档位" };
  }

  const licenseCards = getSystemLicenseCards();
  const cardKey = generateUniqueSystemCardKey(licenseCards);

  const quotaResult = consumeAdminCardQuota(level);
  if (!quotaResult.success) {
    return quotaResult;
  }

  const now = formatDateTime();
  const card = {
    cardKey,
    level,
    expiresAt: "",
    status: "unused",
    statusText: "未使用",
    user: "",
    usedAt: "",
    createdAt: now,
    createdBy: session.username,
    remark,
  };

  saveSystemLicenseCards([card, ...licenseCards]);
  return { success: true, message: "卡密新增成功", card };
};

export const updateSystemLicenseCard = (cardKey, updates) => {
  if (!isSystemSuperAdminSession()) {
    return { success: false, message: "只有超级管理员可以修改卡密" };
  }

  const normalizedCardKey = normalizeCardKey(cardKey);
  if (!normalizedCardKey) {
    return { success: false, message: "请选择要修改的卡密" };
  }

  const licenseCards = getSystemLicenseCards();
  const cardIndex = licenseCards.findIndex((card) => card.cardKey === normalizedCardKey);
  const card = licenseCards[cardIndex];
  if (!card) {
    return { success: false, message: "卡密不存在" };
  }

  const nextLevel = updates?.level !== undefined ? normalizeLicenseLevel(updates.level) : card.level;
  const nextRemark =
    updates?.remark !== undefined ? String(updates.remark || "").trim() : card.remark;

  if (!nextLevel) {
    return { success: false, message: "请选择卡密档位" };
  }

  const updatedCard = {
    ...card,
    level: nextLevel,
    remark: nextRemark,
    updatedAt: formatDateTime(),
  };

  licenseCards[cardIndex] = updatedCard;
  saveSystemLicenseCards(licenseCards);
  return { success: true, message: "卡密已更新", card: updatedCard };
};

export const deleteSystemLicenseCard = (cardKey) => {
  if (!isSystemSuperAdminSession()) {
    return { success: false, message: "只有超级管理员可以删除卡密" };
  }

  const normalizedCardKey = normalizeCardKey(cardKey);
  if (!normalizedCardKey) {
    return { success: false, message: "请选择要删除的卡密" };
  }

  const licenseCards = getSystemLicenseCards();
  const card = licenseCards.find((item) => item.cardKey === normalizedCardKey);
  if (!card) {
    return { success: false, message: "卡密不存在" };
  }
  if (card.status === "used") {
    return { success: false, message: "已使用卡密不能删除" };
  }

  saveSystemLicenseCards(licenseCards.filter((item) => item.cardKey !== normalizedCardKey));
  return { success: true, message: "卡密已删除" };
};

export const registerSystemUser = (form) => {
  const username = normalizeUsername(form?.username);
  const password = String(form?.password || "");
  const confirmPassword = String(form?.confirmPassword || "");
  const cardKey = normalizeCardKey(form?.cardKey);

  if (!username) {
    return { success: false, message: "请输入用户名" };
  }
  if (password.length < 6) {
    return { success: false, message: "密码长度不能少于6位" };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "两次输入的密码不一致" };
  }
  if (!cardKey) {
    return { success: false, message: "请输入卡密" };
  }

  const users = getSystemUsers();
  const usernameExists = users.some(
    (user) => isSameUsername(user.username, username),
  ) || isSameUsername(username, BUILT_IN_SUPER_ADMIN.username);

  if (usernameExists) {
    return { success: false, message: "用户名已存在" };
  }

  const licenseCards = getSystemLicenseCards();
  const cardIndex = licenseCards.findIndex((card) => card.cardKey === cardKey);
  const card = licenseCards[cardIndex];

  if (!card) {
    return { success: false, message: "卡密不存在" };
  }
  if (card.status === "used") {
    return { success: false, message: "卡密已被使用" };
  }

  const now = formatDateTime();
  const expiresAt = getLicenseExpiresAt(card.level, now);
  const user = {
    id: `system_user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    password,
    cardKey,
    level: card.level,
    expiresAt,
    status: "active",
    role: SYSTEM_ROLE_USER,
    roleText: ROLE_TEXT[SYSTEM_ROLE_USER],
    statusText: "正常",
    createdAt: now,
    lastLoginAt: "",
  };

  licenseCards[cardIndex] = {
    ...card,
    status: "used",
    statusText: "已使用",
    user: username,
    usedAt: now,
    expiresAt,
  };

  const nextUsers = [user, ...users];
  saveSystemLicenseCards(licenseCards);
  saveSystemUsers(nextUsers);
  writeJson(SYSTEM_SESSION_KEY, createSessionPayload(user, now));

  return { success: true, message: "注册成功，已激活卡密", user };
};

export const loginSystemUser = (form) => {
  const username = normalizeUsername(form?.username);
  const password = String(form?.password || "");

  if (isBuiltInSuperAdminCredentials(username, password)) {
    const now = formatDateTime();
    const superAdmin = {
      ...BUILT_IN_SUPER_ADMIN,
      lastLoginAt: now,
    };
    writeJson(SYSTEM_SESSION_KEY, createSessionPayload(superAdmin, now));
    return { success: true, message: "鐧诲綍鎴愬姛", user: superAdmin };
  }

  if (!username || !password) {
    return { success: false, message: "请输入用户名和密码" };
  }

  const users = getSystemUsers();
  const userIndex = users.findIndex(
    (user) => isSameUsername(user.username, username),
  );
  const user = users[userIndex] ? withRoleDefaults(users[userIndex]) : null;

  if (!user || user.password !== password) {
    return { success: false, message: "用户名或密码错误" };
  }

  const now = formatDateTime();
  const updatedUser = {
    ...user,
    lastLoginAt: now,
  };
  users[userIndex] = updatedUser;
  saveSystemUsers(users);

  writeJson(SYSTEM_SESSION_KEY, createSessionPayload(updatedUser, now));

  return { success: true, message: "登录成功", user: updatedUser };
};

export const createSystemAdmin = (form) => {
  if (!isSystemSuperAdminSession()) {
    return { success: false, message: "只有超级管理员可以新增管理员" };
  }

  const username = normalizeUsername(form?.username);
  const password = String(form?.password || "");
  const confirmPassword = String(form?.confirmPassword || "");
  const cardCreateQuota = normalizeLevelQuota(form?.cardCreateQuota);

  if (!username) {
    return { success: false, message: "请输入管理员用户名" };
  }
  if (password.length < 6) {
    return { success: false, message: "密码长度不能少于6位" };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "两次输入的密码不一致" };
  }
  if (isSameUsername(username, BUILT_IN_SUPER_ADMIN.username)) {
    return { success: false, message: "管理员用户名已存在" };
  }

  const users = getSystemUsers();
  const usernameExists = users.some((user) => isSameUsername(user.username, username));
  if (usernameExists) {
    return { success: false, message: "管理员用户名已存在" };
  }

  const now = formatDateTime();
  const admin = {
    id: `system_admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    password,
    role: SYSTEM_ROLE_ADMIN,
    roleText: ROLE_TEXT[SYSTEM_ROLE_ADMIN],
    status: "active",
    statusText: "正常",
    cardCreateQuota,
    cardCreateUsed: createEmptyLevelQuota(),
    createdAt: now,
    lastLoginAt: "",
  };

  saveSystemUsers([admin, ...users]);
  return { success: true, message: "管理员创建成功", admin };
};

export const updateSystemAdminCardQuota = (username, quota) => {
  if (!isSystemSuperAdminSession()) {
    return { success: false, message: "只有超级管理员可以设置管理员卡密额度" };
  }

  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return { success: false, message: "请选择要设置额度的管理员" };
  }
  if (isSameUsername(normalizedUsername, BUILT_IN_SUPER_ADMIN.username)) {
    return { success: false, message: "内置超级管理员不需要设置卡密额度" };
  }

  const users = getSystemUsers();
  const adminIndex = users.findIndex(
    (user) => isSameUsername(user.username, normalizedUsername) && user.role === SYSTEM_ROLE_ADMIN,
  );
  const admin = users[adminIndex];
  if (!admin) {
    return { success: false, message: "管理员不存在" };
  }

  const updatedAdmin = {
    ...admin,
    cardCreateQuota: normalizeLevelQuota(quota),
    cardCreateUsed: normalizeLevelQuota(admin.cardCreateUsed),
  };
  users[adminIndex] = updatedAdmin;
  saveSystemUsers(users);
  return { success: true, message: "管理员卡密额度已更新", admin: updatedAdmin };
};

export const deleteSystemAdmin = (username) => {
  if (!isSystemSuperAdminSession()) {
    return { success: false, message: "只有超级管理员可以删除管理员" };
  }

  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return { success: false, message: "请选择要删除的管理员" };
  }
  if (isSameUsername(normalizedUsername, BUILT_IN_SUPER_ADMIN.username)) {
    return { success: false, message: "内置超级管理员不能删除" };
  }

  const users = getSystemUsers();
  const admin = users.find(
    (user) => isSameUsername(user.username, normalizedUsername) && user.role === SYSTEM_ROLE_ADMIN,
  );
  if (!admin) {
    return { success: false, message: "管理员不存在" };
  }

  saveSystemUsers(users.filter((user) => !isSameUsername(user.username, normalizedUsername)));
  return { success: true, message: "管理员已删除" };
};

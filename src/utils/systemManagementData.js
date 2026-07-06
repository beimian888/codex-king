export const SYSTEM_LICENSE_CARDS_KEY = "xyzw_system_license_cards";
export const SYSTEM_USERS_KEY = "xyzw_system_users";
export const SYSTEM_SESSION_KEY = "xyzw_system_session";
export const SYSTEM_BUILT_IN_SUPER_ADMIN_PASSWORD_KEY = "xyzw_system_super_admin_password";
export const SYSTEM_ROLE_SUPER_ADMIN = "super_admin";
export const SYSTEM_ROLE_ADMIN = "admin";
export const SYSTEM_ROLE_USER = "user";

const SYSTEM_API_BASE = "/api";

const ROLE_TEXT = {
  [SYSTEM_ROLE_SUPER_ADMIN]: "超级管理员",
  [SYSTEM_ROLE_ADMIN]: "管理员",
  [SYSTEM_ROLE_USER]: "普通用户",
};

const storage = () => globalThis.localStorage || null;

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

const createSessionPayload = (user) => {
  if (!user?.username || !user?.role) {
    return null;
  }

  return {
    userId: user.id ?? user.userId ?? null,
    username: user.username,
    role: user.role,
    roleText: user.roleText || ROLE_TEXT[user.role] || ROLE_TEXT[SYSTEM_ROLE_USER],
    loggedInAt: user.lastLoginAt || user.loggedInAt || "",
  };
};

const cacheSystemSession = (user) => {
  const session = createSessionPayload(user);
  const localStorage = storage();
  if (!session || !localStorage) {
    return session;
  }

  localStorage.setItem(SYSTEM_SESSION_KEY, JSON.stringify(session));
  return session;
};

const clearSystemSession = () => {
  const localStorage = storage();
  if (localStorage) {
    localStorage.removeItem(SYSTEM_SESSION_KEY);
  }
};

const normalizePayload = (payload) => ({
  success: Boolean(payload?.success),
  message: payload?.message || "",
  data: payload?.data && typeof payload.data === "object" ? payload.data : {},
});

async function requestSystemApi(path, options = {}) {
  if (typeof globalThis.fetch !== "function") {
    return {
      success: false,
      message: "当前环境不支持后端请求",
      data: {},
    };
  }

  const { body, headers, ...restOptions } = options;
  const requestOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    ...restOptions,
  };

  if (body !== undefined) {
    requestOptions.body =
      typeof body === "string" || body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${SYSTEM_API_BASE}${path}`, requestOptions);
    const payload = normalizePayload(
      await response.json().catch(() => ({
        success: false,
        message: "服务响应格式错误",
        data: {},
      })),
    );

    if (!response.ok && payload.success !== false) {
      return {
        success: false,
        message: payload.message || "请求失败",
        data: payload.data || {},
      };
    }

    return payload;
  } catch {
    return {
      success: false,
      message: "系统数据服务暂不可用",
      data: {},
    };
  }
}

const extractUserResult = (result) => ({
  success: result.success,
  message: result.message,
  user: result.data?.user || null,
});

const extractCardResult = (result) => ({
  success: result.success,
  message: result.message,
  card: result.data?.card || null,
});

const extractAdminResult = (result) => ({
  success: result.success,
  message: result.message,
  admin: result.data?.admin || null,
});

export const getCurrentSystemSession = () => readObjectJson(SYSTEM_SESSION_KEY, null);

export const isSystemAdminSession = () => {
  const session = getCurrentSystemSession();
  return [SYSTEM_ROLE_SUPER_ADMIN, SYSTEM_ROLE_ADMIN].includes(session?.role);
};

export const isSystemSuperAdminSession = () =>
  getCurrentSystemSession()?.role === SYSTEM_ROLE_SUPER_ADMIN;

export const getSystemLicenseCards = async () => {
  const result = await requestSystemApi("/system/cards");
  return result.success ? result.data?.licenseCards || [] : [];
};

export const getSystemUsers = async () => {
  const result = await requestSystemApi("/system/users");
  return result.success ? result.data?.users || [] : [];
};

export const getSystemAdmins = async () => {
  const result = await requestSystemApi("/system/admins");
  return result.success ? result.data?.admins || [] : [];
};

export const logoutSystemUser = async () => {
  const result = await requestSystemApi("/auth/logout", {
    method: "POST",
  });
  clearSystemSession();
  return {
    success: result.success,
    message: result.message,
  };
};

export const refreshSystemManagementData = async () => {
  const session = getCurrentSystemSession();
  if (!session?.role) {
    return {
      licenseCards: [],
      users: [],
      admins: [],
    };
  }

  if (session.role === SYSTEM_ROLE_SUPER_ADMIN) {
    const [cardsResult, usersResult, adminsResult] = await Promise.all([
      requestSystemApi("/system/cards"),
      requestSystemApi("/system/users"),
      requestSystemApi("/system/admins"),
    ]);

    return {
      licenseCards: cardsResult.success ? cardsResult.data?.licenseCards || [] : [],
      users: usersResult.success ? usersResult.data?.users || [] : [],
      admins: adminsResult.success ? adminsResult.data?.admins || [] : [],
    };
  }

  if (session.role === SYSTEM_ROLE_ADMIN) {
    const cardsResult = await requestSystemApi("/system/cards");
    return {
      licenseCards: cardsResult.success ? cardsResult.data?.licenseCards || [] : [],
      users: [],
      admins: [],
    };
  }

  return {
    licenseCards: [],
    users: [],
    admins: [],
  };
};

export const createSystemLicenseCard = async (form) => {
  const result = await requestSystemApi("/system/cards", {
    method: "POST",
    body: form || {},
  });
  return extractCardResult(result);
};

export const updateSystemLicenseCard = async (cardKey, updates) => {
  const result = await requestSystemApi(`/system/cards/${encodeURIComponent(cardKey || "")}`, {
    method: "PUT",
    body: updates || {},
  });
  return extractCardResult(result);
};

export const deleteSystemLicenseCard = async (cardKey) => {
  const result = await requestSystemApi(`/system/cards/${encodeURIComponent(cardKey || "")}`, {
    method: "DELETE",
  });
  return extractCardResult(result);
};

export const registerSystemUser = async (form) => {
  const result = await requestSystemApi("/auth/register", {
    method: "POST",
    body: form || {},
  });

  if (result.success && result.data?.user) {
    cacheSystemSession(result.data.user);
  }

  return extractUserResult(result);
};

export const loginSystemUser = async (form) => {
  const result = await requestSystemApi("/auth/login", {
    method: "POST",
    body: form || {},
  });

  if (result.success && result.data?.user) {
    cacheSystemSession(result.data.user);
  }

  return extractUserResult(result);
};

export const changeCurrentSystemUserPassword = async () => ({
  success: false,
  message: "后端暂未开放修改密码接口",
});

export const createSystemAdmin = async (form) => {
  const result = await requestSystemApi("/system/admins", {
    method: "POST",
    body: form || {},
  });
  return extractAdminResult(result);
};

export const updateSystemAdminCardQuota = async (username, quota) => {
  const result = await requestSystemApi(
    `/system/admins/${encodeURIComponent(username || "")}/quota`,
    {
      method: "PUT",
      body: quota || {},
    },
  );
  return extractAdminResult(result);
};

export const deleteSystemAdmin = async (username) => {
  const result = await requestSystemApi(`/system/admins/${encodeURIComponent(username || "")}`, {
    method: "DELETE",
  });
  return extractAdminResult(result);
};

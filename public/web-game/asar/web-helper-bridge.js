(function () {
  var params = new URLSearchParams(window.location.search);
  var noop = function () {};
  var DEFAULT_GAME_VERSION = "1.89.8-wx";
  var DEFAULT_MANIFEST_VERSION = "0.32.0";
  var bridgeTag = "__xyzwWebHelperBridge";

  try {
    Object.defineProperty(window, "__WEB_HELPER_BRIDGE_BOOTED", {
      value: true,
      configurable: false,
      enumerable: true,
    });
  } catch (err) {
    window.__WEB_HELPER_BRIDGE_BOOTED = true;
  }

  function parseJson(value) {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch (err) {
      return {};
    }
  }

  function decodeJsonParam(value) {
    if (!value) return {};
    try {
      var binary = atob(value);
      var encoded = Array.prototype.map
        .call(binary, function (char) {
          return "%" + char.charCodeAt(0).toString(16).padStart(2, "0");
        })
        .join("");
      return parseJson(decodeURIComponent(encoded));
    } catch (err) {
      return parseJson(value);
    }
  }

  function pick(source, keys) {
    for (var i = 0; i < keys.length; i++) {
      var value = source && source[keys[i]];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    }
    return "";
  }

  function valueOrParam(key, fallback) {
    var value = params.get(key);
    if (value !== null && String(value).trim() !== "") return value;
    var authValue = authUser[key];
    if (authValue !== undefined && authValue !== null && String(authValue).trim() !== "") {
      return authValue;
    }
    return fallback;
  }

  function normalizeInteger(value, fallback) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return fallback;
    }
    var numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }

  function compactObject(source) {
    var output = {};
    Object.keys(source || {}).forEach(function (key) {
      var value = source[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        output[key] = value;
      }
    });
    return output;
  }

  function ensureFunction(target, key, fallback) {
    if (typeof target[key] !== "function") {
      target[key] = fallback;
    }
  }

  function installDefaultMute() {
    if (params.get("muted") === "0" || window.__XYZW_WEB_HELPER_MUTED) return;
    window.__XYZW_WEB_HELPER_MUTED = true;

    try {
      var nativePlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        this.muted = true;
        this.volume = 0;
        return nativePlay.apply(this, arguments);
      };
    } catch (err) {}

    function muteExistingMedia() {
      try {
        Array.prototype.forEach.call(
          document.querySelectorAll("audio, video"),
          function (media) {
            media.muted = true;
            media.volume = 0;
          },
        );
      } catch (err) {}
    }

    function muteCocosAudio() {
      try {
        if (window.cc && window.cc.audioEngine) {
          if (typeof window.cc.audioEngine.setMusicVolume === "function") {
            window.cc.audioEngine.setMusicVolume(0);
          }
          if (typeof window.cc.audioEngine.setEffectsVolume === "function") {
            window.cc.audioEngine.setEffectsVolume(0);
          }
          if (typeof window.cc.audioEngine.setVolume === "function") {
            window.cc.audioEngine.setVolume(0);
          }
        }
      } catch (err) {}
    }

    muteExistingMedia();
    muteCocosAudio();
    setTimeout(muteExistingMedia, 0);
    setTimeout(muteCocosAudio, 0);
    setTimeout(muteCocosAudio, 500);
    setTimeout(muteCocosAudio, 1500);
    setTimeout(muteCocosAudio, 3000);
  }

  function installEmbeddedChromeHider() {
    if (params.get("hideChrome") === "0" || window.__XYZW_WEB_HELPER_CHROME_HIDER) return;
    window.__XYZW_WEB_HELPER_CHROME_HIDER = true;

    var hiddenClass = "xyzw-platform-chrome-hidden";
    var styleId = "xyzw-platform-chrome-hider-style";

    function installStyle() {
      if (document.getElementById(styleId)) return;
      var style = document.createElement("style");
      style.id = styleId;
      style.textContent = [
        "html, body { width: 100% !important; height: 100% !important; overflow: hidden !important; background: #000 !important; }",
        "#Cocos2dGameContainer, #GameCanvas { top: 0 !important; left: 0 !important; }",
        "." + hiddenClass + " { display: none !important; visibility: hidden !important; pointer-events: none !important; }",
      ].join("\n");
      (document.head || document.documentElement).appendChild(style);
    }

    function getGameCanvas() {
      return document.getElementById("GameCanvas");
    }

    function containsGameCanvas(element) {
      var gameCanvas = getGameCanvas();
      return !!gameCanvas && element !== gameCanvas && element.contains(gameCanvas);
    }

    function isGameElement(element) {
      if (!element || element.nodeType !== 1) return true;
      var id = element.id || "";
      var tag = String(element.tagName || "").toLowerCase();
      return (
        id === "GameCanvas" ||
        id === "Cocos2dGameContainer" ||
        id === "splash" ||
        tag === "canvas" ||
        tag === "script" ||
        tag === "style" ||
        tag === "link" ||
        tag === "audio" ||
        tag === "video" ||
        containsGameCanvas(element)
      );
    }

    function hasKnownChromeText(element) {
      var text = String(element.textContent || "").trim();
      var title = String(document.title || "").trim();
      var playerName = String(account.name || "").trim();
      if (!text) return false;
      return (
        (!!title && text.indexOf(title) !== -1) ||
        (!!playerName && text.indexOf(playerName) !== -1)
      );
    }

    function looksLikeTopChrome(element) {
      if (isGameElement(element)) return false;
      var rect;
      var computed;
      try {
        rect = element.getBoundingClientRect();
        computed = window.getComputedStyle(element);
      } catch (err) {
        return false;
      }

      var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      var isTopStrip =
        rect.top <= 8 &&
        rect.bottom >= 24 &&
        rect.height >= 28 &&
        rect.height <= 96 &&
        rect.width >= Math.min(viewportWidth * 0.5, 260);
      var isFloating =
        computed.position === "fixed" ||
        computed.position === "absolute" ||
        computed.position === "sticky";
      var hasControls = !!element.querySelector("button, select, img, svg");

      return isTopStrip && (hasKnownChromeText(element) || isFloating || hasControls);
    }

    function findTopChromeCandidate(element) {
      var current = element;
      var best = null;
      var depth = 0;
      while (current && current !== document.body && current !== document.documentElement && depth < 8) {
        if (current.nodeType === 1 && !containsGameCanvas(current) && looksLikeTopChrome(current)) {
          best = current;
        }
        current = current.parentElement;
        depth += 1;
      }
      return best;
    }

    function pinGameToTop() {
      var container = document.getElementById("Cocos2dGameContainer");
      var canvas = document.getElementById("GameCanvas");
      if (container) {
        container.style.top = "0px";
        container.style.left = "0px";
      }
      if (canvas) {
        canvas.style.top = "0px";
        canvas.style.left = "0px";
      }
    }

    function hideChromeElements() {
      installStyle();
      pinGameToTop();
      if (!document.body) return;
      Array.prototype.forEach.call(document.body.querySelectorAll("*"), function (element) {
        if (!looksLikeTopChrome(element)) return;
        element.classList.add(hiddenClass);
        element.setAttribute("aria-hidden", "true");
      });
      hideChromeFromTopPoints();
    }

    function hideChromeFromTopPoints() {
      if (typeof document.elementsFromPoint !== "function") return;
      var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      var xPoints = [
        8,
        Math.max(8, Math.round(viewportWidth * 0.25)),
        Math.max(8, Math.round(viewportWidth * 0.5)),
        Math.max(8, Math.round(viewportWidth * 0.75)),
        Math.max(8, viewportWidth - 8),
      ];
      var yPoints = [6, 18, 32, 44];
      xPoints.forEach(function (x) {
        yPoints.forEach(function (y) {
          Array.prototype.forEach.call(document.elementsFromPoint(x, y), function (element) {
            var candidate = findTopChromeCandidate(element);
            if (!candidate) return;
            candidate.classList.add(hiddenClass);
            candidate.setAttribute("aria-hidden", "true");
          });
        });
      });
    }

    hideChromeElements();
    setTimeout(hideChromeElements, 0);
    setTimeout(hideChromeElements, 250);
    setTimeout(hideChromeElements, 1000);
    setTimeout(hideChromeElements, 2500);

    if (window.MutationObserver && document.body) {
      var observer = new MutationObserver(hideChromeElements);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  var authUser = decodeJsonParam(params.get("authUser"));
  var token =
    params.get("token") ||
    params.get("roleToken") ||
    pick(authUser, ["roleToken", "actualToken", "token", "gameToken"]) ||
    params.get("p") ||
    pick(authUser, ["p"]);
  var name = params.get("name") || authUser.name || "";
  var server = params.get("server") || authUser.server || "";
  var version =
    params.get("version") ||
    params.get("gameVersion") ||
    authUser.loginVersion ||
    authUser.clientVersion ||
    authUser.version ||
    authUser.gameVersion ||
    DEFAULT_GAME_VERSION;
  var manifestVersion =
    params.get("manifestVersion") ||
    authUser.manifestVersion ||
    authUser.entryVersion ||
    DEFAULT_MANIFEST_VERSION;
  var roleId =
    valueOrParam("roleId", "") ||
    pick(authUser, ["openId", "platformUId", "platformUid"]);
  var userId =
    params.get("userId") ||
    params.get("uid") ||
    params.get("id") ||
    pick(authUser, ["userId", "uid", "id"]);
  var sessId = normalizeInteger(valueOrParam("sessId", Date.now() * 100), Date.now() * 100);
  var connId = normalizeInteger(valueOrParam("connId", Date.now()), Date.now());
  var isRestore = normalizeInteger(valueOrParam("isRestore", 0), 0);

  var account = Object.assign({}, authUser, {
    token: token,
    roleToken: token,
    actualToken: token,
    version: version,
    gameVersion: version,
    loginVersion: version,
    manifestVersion: manifestVersion,
    roleId: normalizeInteger(roleId, roleId),
    sessId: sessId,
    connId: connId,
    isRestore: isRestore,
    id: userId || authUser.id || "",
    uid: userId || authUser.uid || "",
    userId: userId || authUser.userId || "",
    openId: params.get("openId") || authUser.openId || "",
    name: name || userId || authUser.name || "",
    server: server,
    authed: true,
    userSdk: Object.assign({ isNewUser: false }, authUser.userSdk || {}),
  });

  function getLoginResult() {
    return Object.assign({}, account);
  }

  function buildWsLoginPayload(existingPayload) {
    var existing =
      existingPayload && typeof existingPayload === "object" ? existingPayload : {};

    return compactObject(
      Object.assign({}, existing, {
        roleToken: existing.roleToken || existing.token || account.roleToken || account.token,
        sessId: normalizeInteger(existing.sessId || account.sessId, Date.now() * 100),
        connId: normalizeInteger(existing.connId || account.connId || Date.now(), Date.now()),
        isRestore: normalizeInteger(existing.isRestore, account.isRestore || 0),
        version: existing.version || account.version || DEFAULT_GAME_VERSION,
      }),
    );
  }

  function notifyLogin(listener) {
    if (typeof listener !== "function") return;
    setTimeout(function () {
      listener(getLoginResult());
    }, 0);
  }

  function summarizeWsUrl(url) {
    try {
      var wsUrl = new URL(String(url));
      var pValue = wsUrl.searchParams.get("p") || "";
      var pData = {};
      var isJsonP = false;
      try {
        pData = JSON.parse(pValue);
        isJsonP = !!pData && typeof pData === "object";
      } catch (err) {
        pData = {};
      }

      var roleToken = isJsonP ? pData.roleToken || "" : pValue;
      return {
        host: wsUrl.host,
        path: wsUrl.pathname,
        encoding: wsUrl.searchParams.get("e") || "",
        pIsJson: isJsonP,
        hasRoleToken: !!roleToken,
        roleTokenLength: String(roleToken || "").length,
        version: pData.version || "",
        hasSessId: !!pData.sessId,
        hasConnId: !!pData.connId,
        isRestore: pData.isRestore,
        hasAck: wsUrl.searchParams.has("ack"),
      };
    } catch (err) {
      return {
        parseError: err && err.message ? err.message : String(err),
      };
    }
  }

  function normalizeAgentWsUrl(url) {
    try {
      var wsUrl = new URL(String(url));
      if (wsUrl.host !== "xxz-xyzw.hortorgames.com" || wsUrl.pathname !== "/agent") {
        return url;
      }

      var pValue = wsUrl.searchParams.get("p") || "";
      var parsedP = parseJson(pValue);
      var payload = parsedP && Object.keys(parsedP).length ? parsedP : { roleToken: pValue };
      var normalizedPayload = buildWsLoginPayload(payload);

      wsUrl.searchParams.set("p", JSON.stringify(normalizedPayload));
      if (!wsUrl.searchParams.get("e")) {
        wsUrl.searchParams.set("e", "x");
      }
      if (!wsUrl.searchParams.get("lang")) {
        wsUrl.searchParams.set("lang", "chinese");
      }

      return wsUrl.toString();
    } catch (err) {
      return url;
    }
  }

  function installWebSocketBridge() {
    if (!window.WebSocket || window.WebSocket[bridgeTag]) return;

    var NativeWebSocket = window.WebSocket;
    var WrappedWebSocket = function (url, protocols) {
      var nextUrl = normalizeAgentWsUrl(url);
      console.info("[web-helper] WebSocket connect", summarizeWsUrl(nextUrl));
      return protocols !== undefined
        ? new NativeWebSocket(nextUrl, protocols)
        : new NativeWebSocket(nextUrl);
    };

    WrappedWebSocket.prototype = NativeWebSocket.prototype;
    WrappedWebSocket.CONNECTING = NativeWebSocket.CONNECTING;
    WrappedWebSocket.OPEN = NativeWebSocket.OPEN;
    WrappedWebSocket.CLOSING = NativeWebSocket.CLOSING;
    WrappedWebSocket.CLOSED = NativeWebSocket.CLOSED;
    WrappedWebSocket[bridgeTag] = true;
    window.WebSocket = WrappedWebSocket;
  }

  function installHsdkBridge() {
    var existingHsdk = window.HSDK || {};
    window.HSDK = Object.assign(existingHsdk, {
      isOverseaH5: false,
      isOverseaH5TianYou: false,
      isOverseaH5QingCi: false,
      login: function () {
        return Promise.resolve(getLoginResult());
      },
      weakLogin: function () {
        return Promise.resolve(getLoginResult());
      },
      onLogin: function (options) {
        notifyLogin(options && options.listener);
      },
      logout: function () {
        return Promise.resolve();
      },
      gameTrack: existingHsdk.gameTrack || noop,
      middleReport: existingHsdk.middleReport || noop,
      showLoading: existingHsdk.showLoading || noop,
      hideLoading: existingHsdk.hideLoading || noop,
      showModal: function (options) {
        options && options.success && options.success();
        return Promise.resolve();
      },
      getNotice: function () {
        return Promise.resolve({});
      },
      checkSwitches: function () {
        return Promise.resolve({});
      },
      setGameUserInfo: existingHsdk.setGameUserInfo || noop,
      reportLoginState: existingHsdk.reportLoginState || noop,
    });
  }

  function installHortorSdkBridge() {
    var sdk = window.__HORTOR_SDK__ || {};
    var tga = sdk.tga && typeof sdk.tga === "object" ? sdk.tga : {};
    ensureFunction(tga, "login", noop);
    ensureFunction(tga, "track", noop);
    sdk.tga = tga;

    ensureFunction(sdk, "pay", function () {
      return Promise.reject(null);
    });
    ensureFunction(sdk, "saveImage", function (callback) {
      callback && callback({ errCode: 0 });
    });
    ensureFunction(sdk, "getBrightness", function (callback) {
      callback && callback({ brightness: 1 });
    });
    ensureFunction(sdk, "getNetworkType", function (callback) {
      callback && callback({ networkType: "wifi" });
    });
    ensureFunction(sdk, "getBattery", function (callback) {
      callback && callback({ level: 100, isCharging: true });
    });
    ensureFunction(sdk, "setBrightness", function () {
      return Promise.resolve();
    });
    ensureFunction(sdk, "setVibrate", function () {
      return Promise.resolve();
    });
    ensureFunction(sdk, "chooseImage", function (callback) {
      callback && callback({ tempFilePaths: [] });
    });
    ensureFunction(sdk, "setClipboard", function (options) {
      options && options.success && options.success();
    });
    ensureFunction(sdk, "getClientVersion", function (callback) {
      callback && callback(account.version || DEFAULT_GAME_VERSION);
    });
    ensureFunction(sdk, "exitGame", function () {
      console.warn("[web-helper] exitGame intercepted");
    });

    window.__HORTOR_SDK__ = sdk;
    return sdk;
  }

  function tryRequire(moduleName) {
    try {
      if (typeof window.__require !== "function") return null;
      return window.__require(moduleName);
    } catch (err) {
      return null;
    }
  }

  function sanitizeLogin(loginData) {
    var data = loginData || {};
    var roleToken = data.roleToken || data.token || "";
    return {
      hasToken: !!roleToken,
      tokenLength: String(roleToken || "").length,
      roleId: data.roleId || data.userId || data.uid || "",
      version: data.version || data.gameVersion || "",
      hasSessId: !!data.sessId,
      hasConnId: !!data.connId,
    };
  }

  function buildRuntimeLogin(overrides) {
    var runtimeAccount = Object.assign({}, getLoginResult(), overrides || {});
    runtimeAccount.token = runtimeAccount.token || runtimeAccount.roleToken;
    runtimeAccount.roleToken = runtimeAccount.roleToken || runtimeAccount.token;
    runtimeAccount.version = runtimeAccount.version || DEFAULT_GAME_VERSION;
    runtimeAccount.gameVersion = runtimeAccount.gameVersion || runtimeAccount.version;
    runtimeAccount.loginVersion = runtimeAccount.loginVersion || runtimeAccount.version;
    runtimeAccount.sessId = normalizeInteger(runtimeAccount.sessId, Date.now() * 100);
    runtimeAccount.connId = normalizeInteger(runtimeAccount.connId, Date.now());
    runtimeAccount.isRestore = normalizeInteger(runtimeAccount.isRestore, 0);
    return runtimeAccount;
  }

  function buildAuthUserResult(loginData) {
    var loginResult = buildRuntimeLogin(loginData);
    return {
      code: 0,
      error: "",
      rawData: compactObject({
        roleToken: loginResult.roleToken || loginResult.token,
        roleId: loginResult.roleId,
        sessId: loginResult.sessId,
        connId: loginResult.connId,
        isRestore: loginResult.isRestore,
      }),
      getData: function () {
        return this.rawData;
      },
    };
  }

  function installGameRuntimePatch() {
    if (typeof window.__require !== "function") return false;

    var runtimeLogin = buildRuntimeLogin();
    var patched = false;

    var h5Module = tryRequire("platform-h5");
    if (
      h5Module &&
      h5Module.PlatformH5 &&
      h5Module.PlatformH5.prototype &&
      !h5Module.PlatformH5.prototype.__xyzwWebHelperPatched
    ) {
      h5Module.PlatformH5.prototype.login = function () {
        var loginResult = buildRuntimeLogin();
        if (loginResult.userId && window.__HORTOR_SDK__ && window.__HORTOR_SDK__.tga) {
          window.__HORTOR_SDK__.tga.login(loginResult.userId);
        }
        console.info("[web-helper] PlatformH5.login", sanitizeLogin(loginResult));
        return Promise.resolve(loginResult);
      };
      h5Module.PlatformH5.prototype.__xyzwWebHelperPatched = true;
      patched = true;
    }

    var platformManagerModule = tryRequire("PlatformManager");
    var PlatformManager =
      platformManagerModule &&
      (platformManagerModule.PlatformManager || platformManagerModule.default);
    var manager = null;
    try {
      manager = PlatformManager && PlatformManager.instance;
    } catch (err) {
      manager = null;
    }
    if (manager && !manager.__xyzwWebHelperPatched) {
      var originalManagerLogin =
        typeof manager.login === "function" ? manager.login.bind(manager) : null;
      manager.login = function () {
        var args = arguments;
        var loginResult = buildRuntimeLogin();
        var applyFallback = function (value) {
          if (!value || !(value.token || value.roleToken)) {
            value = loginResult;
          }
          manager.encryptUserInfo = value;
          try {
            manager.authorizeDeferred && manager.authorizeDeferred.resolve(value);
          } catch (err) {}
          console.info("[web-helper] PlatformManager.login", sanitizeLogin(value));
          return value;
        };

        if (!originalManagerLogin) {
          return Promise.resolve(applyFallback(loginResult));
        }

        try {
          return Promise.resolve(originalManagerLogin.apply(manager, args))
            .then(applyFallback)
            .catch(function () {
              return applyFallback(loginResult);
            });
        } catch (err) {
          return Promise.resolve(applyFallback(loginResult));
        }
      };
      if (!manager.encryptUserInfo) {
        manager.encryptUserInfo = loginResult;
      }
      try {
        manager.authorizeDeferred && manager.authorizeDeferred.resolve(loginResult);
      } catch (err) {}
      manager.__xyzwWebHelperPatched = true;
      patched = true;
    }

    var coreModule = tryRequire("@o4e/core");
    var delegate =
      coreModule &&
      coreModule.WebSocketDelegate &&
      coreModule.WebSocketDelegate.current;
    if (delegate && typeof delegate.connect === "function" && !delegate.__xyzwWebHelperPatched) {
      var originalConnect = delegate.connect.bind(delegate);
      delegate.connect = function (options) {
        var loginResult = buildRuntimeLogin();
        var nextOptions = Object.assign({}, options || {}, {
          token: (options && options.token) || loginResult.token || loginResult.roleToken,
          version: (options && options.version) || loginResult.version || DEFAULT_GAME_VERSION,
          encoding: (options && options.encoding) || "x",
        });
        console.info("[web-helper] WebSocketDelegate.connect", sanitizeLogin(nextOptions));
        return originalConnect(nextOptions);
      };
      delegate.__xyzwWebHelperPatched = true;
      patched = true;
    }

    if (
      coreModule &&
      coreModule.WebSocketDelegate &&
      coreModule.WebSocketDelegate.prototype &&
      typeof coreModule.WebSocketDelegate.prototype.connect === "function" &&
      !coreModule.WebSocketDelegate.prototype.__xyzwWebHelperPatched
    ) {
      var originalProtoConnect = coreModule.WebSocketDelegate.prototype.connect;
      coreModule.WebSocketDelegate.prototype.connect = function (options) {
        var loginResult = buildRuntimeLogin();
        var nextOptions = Object.assign({}, options || {}, {
          token: (options && options.token) || loginResult.token || loginResult.roleToken,
          version: (options && options.version) || loginResult.version || DEFAULT_GAME_VERSION,
          encoding: (options && options.encoding) || "x",
        });
        console.info(
          "[web-helper] WebSocketDelegate.prototype.connect",
          sanitizeLogin(nextOptions),
        );
        return originalProtoConnect.call(this, nextOptions);
      };
      coreModule.WebSocketDelegate.prototype.__xyzwWebHelperPatched = true;
      patched = true;
    }

    var networkManagerModule = tryRequire("NetworkManager");
    var NetworkManager = networkManagerModule && networkManagerModule.NetworkManager;
    if (
      NetworkManager &&
      typeof NetworkManager.connect === "function" &&
      !NetworkManager.__xyzwWebHelperPatched
    ) {
      var originalNetworkConnect = NetworkManager.connect.bind(NetworkManager);
      NetworkManager.connect = function (serverData, roleToken, encoding) {
        var loginResult = buildRuntimeLogin();
        var nextToken = roleToken || loginResult.roleToken || loginResult.token;
        console.info("[web-helper] NetworkManager.connect", {
          hasToken: !!nextToken,
          tokenLength: String(nextToken || "").length,
          encoding: encoding || "x",
        });
        return originalNetworkConnect(serverData, nextToken, encoding || "x");
      };
      NetworkManager.__xyzwWebHelperPatched = true;
      patched = true;
    }

    var loginManagerModule = tryRequire("LoginManager");
    var LoginManager = loginManagerModule && loginManagerModule.LoginManager;
    if (
      LoginManager &&
      LoginManager.prototype &&
      typeof LoginManager.prototype._authUser === "function" &&
      !LoginManager.prototype.__xyzwWebHelperPatched
    ) {
      LoginManager.prototype._authUser = function () {
        var loginResult = buildRuntimeLogin();
        var roleToken = loginResult.roleToken || loginResult.token;
        if (!roleToken) {
          return Promise.reject("roleToken is empty");
        }

        var authUserResult = buildAuthUserResult(loginResult);
        this.superAuthUser = false;
        this._authUserResult = authUserResult;
        console.info("[web-helper] LoginManager._authUser bypass", sanitizeLogin(loginResult));
        return Promise.resolve(authUserResult);
      };
      LoginManager.prototype.__xyzwWebHelperPatched = true;
      patched = true;
    }

    return patched;
  }

  try {
    Object.defineProperty(window, "__XYZW_WEB_HELPER_ACCOUNT", {
      value: account,
      configurable: false,
      enumerable: true,
    });
  } catch (err) {
    window.__XYZW_WEB_HELPER_ACCOUNT = account;
  }
  window.__XYZW_WEB_HELPER_LOGIN_RESULT = getLoginResult;
  window.__XYZW_WEB_HELPER_WS_PAYLOAD = buildWsLoginPayload;
  window.__XYZW_INSTALL_GAME_RUNTIME_PATCH = installGameRuntimePatch;

  installDefaultMute();
  installEmbeddedChromeHider();
  installWebSocketBridge();
  installHortorSdkBridge();
  installHsdkBridge();
  setTimeout(installHortorSdkBridge, 0);
  setTimeout(installHsdkBridge, 0);
  setTimeout(installHortorSdkBridge, 500);
  setTimeout(installHsdkBridge, 500);
  setTimeout(installHortorSdkBridge, 1500);
  setTimeout(installWebSocketBridge, 500);
  setTimeout(installGameRuntimePatch, 0);
  setTimeout(installGameRuntimePatch, 500);
  setTimeout(installGameRuntimePatch, 1500);

  console.info("[web-helper] H5 login prepared", {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    version: version,
    manifestVersion: manifestVersion,
    roleId: roleId ? "present" : "empty",
    hasSessId: !!account.sessId,
    hasConnId: !!account.connId,
  });
})();

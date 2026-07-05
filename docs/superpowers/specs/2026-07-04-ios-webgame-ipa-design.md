# iOS 网页游戏 IPA 封装设计

## 背景

当前项目 `xyzw_web_helper-main` 是 Vue/Vite 网页工具工程，已经包含从 Electron `asar` 提取出的网页游戏静态资源：

- `public/web-game/asar/index.html`
- `public/web-game/asar/cocos2d-js-min.a5841.js`
- `public/web-game/asar/main.2a00e.js`
- `public/web-game/asar/web-helper-bridge.js`
- 其他游戏资源与配置文件

用户选择的目标是：只封装网页游戏本体为 iOS App，不包含现有账号管理、Token 导入、任务辅助等 Web Helper 后台界面。

当前 Windows 环境没有 `xcodebuild` 和 Apple 签名材料，因此本阶段不直接产出可安装 `.ipa`。交付目标是准备一个可迁移到 macOS/Xcode 环境继续签名、归档、导出 IPA 的 Capacitor iOS 工程模板。

## 范围

本设计包含：

- 增加 Capacitor 配置与 iOS 封装入口。
- 准备独立的 iOS 网页游戏静态输出目录。
- 构建脚本检查并复制网页游戏核心资源。
- App 启动后直接加载网页游戏入口。
- 提供 macOS/Xcode 上补证书、同步 iOS 工程、导出 IPA 的文档。

本设计不包含：

- Apple Developer 账号、证书、描述文件的创建或托管。
- Windows 本机直接签名生成 IPA。
- 上架 App Store、TestFlight 或企业分发配置。
- 重新实现游戏登录、账号管理或自动化功能。
- 绕过 iOS、Apple 签名或游戏服务端限制。

## 推荐方案

采用 Capacitor 本地资源封装。

理由：

- 与现有 Vue/Vite 资产组织兼容，后续可以复用 `pnpm` 脚本。
- Capacitor 会生成标准 iOS 工程，便于在 Xcode 中补签名和导出 IPA。
- 相比 Cordova 生态更新；相比纯 WKWebView 原生壳，资源同步、构建命令和后续扩展更清晰。

## 架构

新增或修改：

```text
xyzw_web_helper-main/
  capacitor.config.ts
  package.json
  scripts/
    prepare-ios-webgame.mjs
  docs/
    ios-ipa-build.md
  ios-webgame/
    index.html
    web-game/asar/...
  ios/
    App/...
```

`ios-webgame/` 是 Capacitor 的 Web 目录。它不会承载完整 Web Helper 后台，而是只承载 iOS App 需要打开的游戏入口与游戏资源。

`ios/` 目录由 `pnpm exec cap add ios` 或 `pnpm exec cap sync ios` 在 macOS 环境生成/维护。Windows 环境可以准备配置和静态文件，但不能完成 Xcode 归档和签名。

## 启动行为

App 启动流程：

```text
iOS App 启动
  -> Capacitor 创建 WKWebView
  -> 加载 ios-webgame/index.html
  -> 入口跳转到 /web-game/asar/index.html
  -> 游戏脚本与 web-helper-bridge.js 初始化运行环境
```

`ios-webgame/index.html` 作为轻量启动页，职责是跳转或嵌入加载本地网页游戏入口。初版不展示账号选择或工具导航。

如果游戏依赖 URL query 中的 token 参数，初版保留入口参数透传能力：`ios-webgame/index.html` 可以读取自身 query，并拼接到 `/web-game/asar/index.html`。默认不内置真实 token，避免把敏感账号信息写入 App 包。

## 数据流

静态资源流：

```text
public/web-game/asar/*
  -> scripts/prepare-ios-webgame.mjs
  -> ios-webgame/web-game/asar/*
  -> Capacitor sync
  -> iOS App bundle
```

运行时数据流：

```text
WKWebView
  -> 本地 Capacitor Web 服务
  -> ios-webgame/index.html
  -> web-game/asar/index.html
  -> 游戏远程接口和 WebSocket
```

游戏远程接口、WebSocket 和登录流程沿用游戏自身逻辑。若真机运行出现跨域、ATS 或域名绑定问题，后续根据 Xcode 控制台日志补充 `Info.plist` 网络配置或原生代理方案。

## 错误处理

构建时错误：

- `prepare-ios-webgame.mjs` 检查 `public/web-game/asar/index.html` 是否存在。
- 检查至少一个 `main.*.js` 和 `cocos2d-js-min.*.js` 是否存在。
- 核心资源缺失时脚本以非 0 状态退出。
- 复制前清理并重建 `ios-webgame/`，避免旧资源残留。

环境错误：

- 如果没有安装 Capacitor 依赖，脚本提示先执行 `pnpm install`。
- 如果当前不是 macOS 或没有 Xcode，文档说明只能准备 Web 资源，不能导出 IPA。
- 如果没有 Apple 证书，Xcode 可以打开工程但不能导出可安装 IPA。

运行时错误：

- 初版使用游戏原有加载界面和错误表现。
- 若网络请求失败，优先通过真机 Safari Web Inspector 或 Xcode console 定位。
- 后续可根据失败域名补 `NSAppTransportSecurity`、`WKAppBoundDomains` 或代理。

## 构建命令设计

新增脚本建议：

```json
{
  "prepare:ios-webgame": "node scripts/prepare-ios-webgame.mjs",
  "cap:add:ios": "pnpm run prepare:ios-webgame && cap add ios",
  "cap:sync:ios": "pnpm run prepare:ios-webgame && cap sync ios",
  "cap:open:ios": "pnpm run cap:sync:ios && cap open ios"
}
```

Windows 上可执行：

```bash
pnpm install
pnpm run prepare:ios-webgame
```

macOS 上可继续执行：

```bash
pnpm run cap:add:ios
pnpm run cap:open:ios
```

若 `ios/` 已存在，改用：

```bash
pnpm run cap:sync:ios
```

## iOS 签名与 IPA 导出

文档 `docs/ios-ipa-build.md` 需要覆盖：

- 安装 Node.js、pnpm、Xcode。
- 执行 `pnpm install`。
- 执行 `pnpm run cap:add:ios` 或 `pnpm run cap:sync:ios`。
- 在 Xcode 中设置 Team、Bundle Identifier、Signing Certificate、Provisioning Profile。
- 使用 `Product > Archive` 归档。
- 使用 Organizer 导出 Development、Ad Hoc 或 App Store Connect IPA。
- 无证书时只能打开工程或模拟器调试，不能安装到真机。

默认 Bundle ID 使用占位值，例如 `com.example.xyzw.webgame`，实际打包前必须替换成用户 Apple Developer 账号下可用的 Bundle ID。

## 测试计划

本阶段在 Windows 环境验证：

- `pnpm install` 能安装依赖。
- `pnpm run prepare:ios-webgame` 能生成 `ios-webgame/`。
- `ios-webgame/index.html` 存在。
- `ios-webgame/web-game/asar/index.html` 存在。
- 核心 JS 资源被复制。

macOS 环境追加验证：

- `pnpm run cap:add:ios` 能生成 iOS 工程。
- `pnpm run cap:sync:ios` 能同步资源。
- `pnpm run cap:open:ios` 能打开 Xcode。
- iOS 模拟器启动后直接进入网页游戏加载流程。
- 配置 Apple 证书后可以 Archive 并导出 IPA。

## 风险

- 游戏资源来自 Electron/网页环境，可能依赖 Electron 或浏览器特定 API。若 `web-helper-bridge.js` 未覆盖 iOS WebView 差异，真机可能黑屏或卡加载。
- 游戏登录可能依赖外部 Token 注入。只封装游戏本体时，初版不会提供账号管理界面。
- iOS 对混合内容、非 HTTPS、跨域请求和 WebSocket 有额外限制，可能需要真机日志后再补配置。
- 没有 Apple 证书时无法验证最终 IPA 安装链路。

## 验收标准

- 项目包含 Capacitor 配置。
- 项目包含 iOS 网页游戏静态资源准备脚本。
- 项目包含 iOS/IPA 构建说明文档。
- 准备脚本能在当前环境生成完整 `ios-webgame/` 输出。
- App 设计为启动后直接进入网页游戏，不进入 Web Helper 后台。
- 文档明确说明无证书时不能直接生成可安装 IPA，以及后续在 macOS/Xcode 的签名步骤。

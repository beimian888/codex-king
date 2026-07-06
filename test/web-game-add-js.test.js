import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  webGame.includes("showJsInjectorModal") &&
    webGame.includes('class="js-injector-modal"'),
  "web game page must provide an add-JS modal",
);

assert(
  webGame.includes('type="primary"') &&
    webGame.includes("删除JS") &&
    !webGame.includes(':disabled="!gameInstances.length"'),
  "add-JS entry should stay highlighted and JS deletion should be available from the dock",
);

assert(
  webGame.includes("添加JS") &&
    webGame.includes("选择文件") &&
    webGame.includes(".js,.txt"),
  "add-JS modal must expose a file picker for .js and .txt scripts",
);

assert(
  !webGame.includes('class="js-injector-target"') &&
    !webGame.includes('class="js-injector-editor"') &&
    !webGame.includes('type="textarea"') &&
    !webGame.includes("生效范围") &&
    !webGame.includes("所有游戏窗口"),
  "add-JS modal must remove the target hint and paste editor from the dialog body",
);

assert(
  webGame.includes("MAX_INLINE_JS_EDITOR_LENGTH") &&
    webGame.includes("setJsInjectorPendingContent") &&
    !webGame.includes("updateJsEditorContent") &&
    !webGame.includes("scriptContent: `${reader.result || \"\"}`"),
  "large JS content must be stored outside the visible modal controls to avoid freezing the modal",
);

assert(
  /<n-button[\s\S]*?@click="injectJsToAllGameFrames"[\s\S]*?>\s*添加\s*<\/n-button>/.test(
    webGame,
  ) &&
    !webGame.includes("应用到所有窗口"),
  "add-JS modal primary action must be labeled 添加",
);

assert(
  webGame.includes(":data-instance-id=\"instance.id\"") &&
    webGame.includes("@load=\"injectStoredJsToGameFrame\"") &&
    webGame.includes("storedJsSnippets"),
  "web game page must keep injected scripts active for every game iframe load",
);

assert(
  webGame.includes('STORED_JS_SNIPPETS_STORAGE_KEY = "xyzw-web-game-stored-js-snippets"') &&
    webGame.includes("loadStoredJsSnippets") &&
    webGame.includes("saveStoredJsSnippets") &&
    webGame.includes("localStorage.getItem(STORED_JS_SNIPPETS_STORAGE_KEY)") &&
    webGame.includes("localStorage.setItem(STORED_JS_SNIPPETS_STORAGE_KEY") &&
    /onMounted\(\(\) => \{[\s\S]*?loadStoredJsSnippets\(\);/.test(webGame) &&
    /storedJsSnippets\.value = \[\.\.\.storedJsSnippets\.value, snippet\];[\s\S]*?saveStoredJsSnippets\(\);/.test(
      webGame,
    ) &&
    /storedJsSnippets\.value = storedJsSnippets\.value\.filter\([\s\S]*?saveStoredJsSnippets\(\);/.test(
      webGame,
    ),
  "added JS snippets must be saved locally and restored when the web game page is opened again",
);

assert(
  webGame.includes("showJsManagerModal") &&
    webGame.includes('class="js-manager-modal"') &&
    webGame.includes('class="stored-js-list"') &&
    webGame.includes("storedJsSnippets.length") &&
    webGame.includes("confirmDeleteStoredJs"),
  "delete-JS action must open a modal listing all added JS snippets with delete actions",
);

assert(
  webGame.includes("const dialog = useDialog()") &&
    webGame.includes("dialog.warning") &&
    webGame.includes('title: "删除JS"') &&
    webGame.includes('positiveText: "确认删除"') &&
    webGame.includes("removeStoredJsSnippet") &&
    webGame.includes("removeInjectedJsSnippetFromFrames") &&
    webGame.includes('script[data-injected-by="xyzw-web-helper"]'),
  "deleting an added JS snippet must require confirmation and remove future plus injected script tags",
);

assert(
  webGame.includes("injectJsToAllGameFrames") &&
    webGame.includes("document.querySelectorAll(\".game-frame\")") &&
    webGame.includes("iframe.contentDocument") &&
    webGame.includes('script.type = "text/javascript"') &&
    webGame.includes("script.textContent = snippet.content") &&
    webGame.includes("waitForJsInjectionTurn"),
  "web game page must inject JavaScript into all same-origin game iframes without one long blocking task",
);

assert(
  webGame.includes("readJsFile") &&
    webGame.includes("new FileReader()") &&
    webGame.includes("reader.readAsText(file)"),
  "web game page must read selected script files as text",
);

console.log("web game add-JS injector UI and iframe injection behavior exist");

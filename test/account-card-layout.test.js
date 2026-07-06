import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const cardStart = tokenImport.indexOf('class="{\n              \'token-card\': true');
assert(cardStart !== -1, "account cards must keep the token-card class binding");

const cardEnd = tokenImport.indexOf("</a-card>", cardStart);
assert(cardEnd !== -1, "account card markup must close with </a-card>");

const cardBlock = tokenImport.slice(cardStart, cardEnd);
const titleStart = cardBlock.indexOf("<template #title>");
const extraStart = cardBlock.indexOf("<template #extra>");
const defaultStart = cardBlock.indexOf("<template #default>");
const actionsStart = cardBlock.indexOf("<template #actions>");

assert(titleStart !== -1, "account card must keep a title slot");
assert(defaultStart !== -1, "account card must keep a body/default slot");
assert(extraStart === -1, "account card edit/delete actions must not live in the independent extra slot");
assert(actionsStart === -1, "account card actions must not live in the card actions footer");

const titleBlock = cardBlock.slice(titleStart, defaultStart);
const bodyBlock = cardBlock.slice(defaultStart);
const nameIndex = titleBlock.indexOf('class="token-title-text"');
const serverIndex = titleBlock.indexOf(':color="getServerTagColor(token.id)"');
const storageIndex = titleBlock.indexOf('class="token-card-storage-inline"');
const identityRowStart = titleBlock.indexOf('class="token-card-identity-row"');
const statusRowStart = titleBlock.indexOf('class="token-card-status-row"');
const commandRowStart = titleBlock.indexOf('class="token-card-command-row"');
const editActionIndex = titleBlock.indexOf('@click.stop="editToken(token)"');
const deleteActionIndex = titleBlock.indexOf('@click.stop="deleteToken(token)"');

assert(nameIndex !== -1, "account card must render the account name");
assert(serverIndex !== -1, "account card must render the server tag in the title area");
assert(identityRowStart !== -1, "account card must render account identity in a dedicated row");
assert(statusRowStart === -1, "account card must not render the storage or connection status row");
assert(storageIndex === -1, "account card must not render the storage type badge");
assert(commandRowStart !== -1, "account card controls must share a single command row");

assert(
  nameIndex < serverIndex && serverIndex < commandRowStart,
  "server tag must sit immediately after the account name before command controls",
);

assert(
  identityRowStart < nameIndex &&
    nameIndex < serverIndex &&
    serverIndex < commandRowStart,
  "account identity and command controls must render in separate stable rows",
);

assert(
  commandRowStart < editActionIndex && editActionIndex < deleteActionIndex,
  "edit and delete controls must be ordered inside the same command row",
);

assert(
  !cardBlock.includes('class="token-card-primary-action"') &&
    !cardBlock.includes("startTaskManagement(token)"),
  "account cards must not render the game feature entry action",
);

assert(
  !titleBlock.includes("getConnectionStatusText(token.id)") &&
    !titleBlock.includes('class="token-card-storage-inline"') &&
    tokenImport.includes("text-overflow: ellipsis;") &&
    tokenImport.includes('class="token-title-text" :title="token.name"'),
  "account cards must keep a compact header without storage or connection status badges",
);

assert(
  !bodyBlock.includes('class="storage-info"'),
  "storage type must no longer render in the old card body panel",
);

console.log("account cards hide storage and connection status badges");

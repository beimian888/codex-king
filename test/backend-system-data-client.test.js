import fs from "node:fs";
import path from "node:path";

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const dataLayerPath = path.join(process.cwd(), "src/utils/systemManagementData.js");
const source = fs.readFileSync(dataLayerPath, "utf8");

assert(source.includes('const SYSTEM_API_BASE = "/api";'), "data layer must use the backend /api prefix");
assert(
  source.includes("async function requestSystemApi") || source.includes("const requestSystemApi = async"),
  "data layer must expose an async API request helper",
);
assert(source.includes('requestSystemApi("/auth/login"'), "loginSystemUser must call /api/auth/login");
assert(source.includes('requestSystemApi("/auth/register"'), "registerSystemUser must call /api/auth/register");
assert(source.includes('requestSystemApi("/system/cards"'), "card list and create calls must use /api/system/cards");
assert(
  source.includes("localStorage.setItem(SYSTEM_SESSION_KEY"),
  "successful auth must cache session for router and nav guards",
);
assert(!source.includes("const defaultLicenseCards = ["), "frontend must not seed license cards after backend migration");
assert(
  !source.includes("saveSystemLicenseCards([card, ...licenseCards])"),
  "frontend must not write license cards directly after backend migration",
);

console.log("system management data layer uses backend api");

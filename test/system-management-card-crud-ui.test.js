import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const systemPage = readFileSync(join(root, "src/views/SystemManagement.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

for (const text of [
  "handleCreateLicenseCard",
  "handleStartEditLicenseCard",
  "handleUpdateLicenseCard",
  "handleDeleteLicenseCard",
  "createSystemLicenseCard",
  "updateSystemLicenseCard",
  "deleteSystemLicenseCard",
]) {
  assert(systemPage.includes(text), `system management card UI must include ${text}`);
}

assert(
  systemPage.includes("adminMenuItems") &&
    systemPage.includes("superAdminMenuItems") &&
    systemPage.includes("isSuperAdmin.value ? superAdminMenuItems : adminMenuItems"),
  "system management menu must use a card-only menu for normal admins",
);

assert(
  systemPage.includes('key: "cards"') &&
    systemPage.includes('label: "卡密管理"'),
  "normal admin menu must still expose card management",
);

assert(
  systemPage.includes("canManageLicenseCards") &&
    systemPage.includes("v-if=\"canManageLicenseCards\""),
  "card edit and delete controls must be gated to super admins",
);

assert(
  systemPage.includes("<th v-if=\"isSuperAdmin\">生成人</th>") &&
    systemPage.includes("<td v-if=\"isSuperAdmin\">{{ card.createdBy || \"系统\" }}</td>"),
  "super admin card table must show the card creator",
);

assert(
  systemPage.includes("licenseCardForm") &&
    systemPage.includes('v-model:value="licenseCardForm.level"') &&
    systemPage.includes('v-model:value="licenseCardForm.remark"'),
  "card management must render a create/edit form for level and remark",
);

assert(
  !systemPage.includes('v-model:value="licenseCardForm.cardKey"') &&
    !systemPage.includes('v-model:value="licenseCardForm.expiresAt"') &&
    !systemPage.includes("expiresAt: licenseCardForm.expiresAt") &&
    !systemPage.includes("cardKey: licenseCardForm.cardKey") &&
    !systemPage.includes("留空自动生成"),
  "card management must not render or submit manual card key or expiry inputs",
);

assert(
  systemPage.includes("cardCreateQuota") &&
    systemPage.includes("updateSystemAdminCardQuota") &&
    systemPage.includes("handleUpdateAdminCardQuota"),
  "admin management must expose card creation quota editing",
);

assert(
  systemPage.includes("<th>卡密额度</th>") &&
    systemPage.includes("quotaLevelOptions") &&
    systemPage.includes("getQuotaValue") &&
    systemPage.includes("getQuotaDraftValue") &&
    systemPage.includes("admin.cardCreateUsed") &&
    systemPage.includes("admin.cardCreateQuota") &&
    systemPage.includes("月卡额度") &&
    systemPage.includes("季卡额度") &&
    systemPage.includes("年卡额度"),
  "admin table and create form must show separate monthly, season, and yearly card quota usage",
);

assert(
  systemPage.includes("openUnusedCardsModal") &&
    systemPage.includes("@click=\"openUnusedCardsModal(item.key)\"") &&
    systemPage.includes("unusedCardsModalVisible") &&
    systemPage.includes("selectedUnusedCards") &&
    systemPage.includes('card.status === "unused"') &&
    systemPage.includes("<n-modal") &&
    systemPage.includes("未使用卡密") &&
    systemPage.includes("生成时间") &&
    systemPage.includes("备注"),
  "summary cards must open a modal listing unused card key, created time, and remark",
);

console.log("system management card CRUD UI and quota controls are present");

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const component = readFileSync(
  join(root, "src/components/Common/IdentityCard.vue"),
  "utf8",
);

const requiredResources = [
  "金币",
  "金砖",
  "普通鱼竿",
  "金鱼竿",
  "珍珠",
  "复活丹",
  "招募令",
  "精铁",
  "彩玉",
  "进阶石",
  "蓝玉",
  "红玉",
  "四圣宝珠碎片",
  "金币袋子",
  "金砖袋子",
  "紫色随机碎片",
  "橙色随机碎片",
  "红色随机碎片",
  "精铁袋子",
  "进阶袋子",
  "梦魇袋子",
  "白玉袋子",
  "扳手袋子",
  "聚宝盆",
  "豪华聚宝盆",
  "红色万能碎片",
  "橙色万能碎片",
  "盐靛",
  "晶石",
  "皮肤币",
  "扫荡魔毯",
  "白玉",
  "贝壳",
  "金盐靛",
  "竞技场门票",
  "木制宝箱",
  "青铜宝箱",
  "黄金宝箱",
  "铂金宝箱",
  "钻石宝箱",
  "刷新券",
  "零件",
  "木柴火把",
  "青铜火把",
  "咸神火把",
  "军团币",
  "扳手",
  "助威币",
];

const failures = [];

if (component.includes('<span class="label">{{ res.label }}</span>')) {
  failures.push("identity card still renders resource labels as visible text");
}

for (const pattern of [
  'class="resource-icon"',
  ':src="res.icon"',
  ':alt="res.label"',
  ':title="res.label"',
]) {
  if (!component.includes(pattern)) {
    failures.push(`identity card is missing ${pattern}`);
  }
}

for (const label of requiredResources) {
  const resourcePattern = new RegExp(
    `label:\\s*"${label}"[\\s\\S]*?icon:\\s*resourceIconMap\\.`,
  );
  if (!resourcePattern.test(component)) {
    failures.push(`${label} does not declare a resource icon`);
  }
}

for (const key of [
  "gold",
  "diamond",
  "normal-rod",
  "gold-rod",
  "recruit",
  "refresh-coupon",
  "wood-chest",
  "diamond-chest",
]) {
  if (!existsSync(join(root, "public/game-icons/identity", `${key}.png`))) {
    failures.push(`missing copied icon public/game-icons/identity/${key}.png`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("identity card resources render as icons");

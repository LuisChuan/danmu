"use strict";
const common_vendor = require("../common/vendor.js");
const PLAY_CONFIG_KEY = "barrage_play_config_v1";
const HISTORY_KEY = "barrage_history_v1";
const HISTORY_MAX = 10;
const PREMIUM_UNLOCK_KEY = "barrage_premium_unlock_v1";
const DEFAULT_CONFIG = {
  text: "输入手持弹幕~~",
  textColor: "#FF0000",
  bgColor: "#000000",
  bgTransparent: false,
  fontSizeRpx: 120,
  speedSec: 12,
  direction: "ltr",
  effect: "neon",
  bgImage: "",
  waterfallMode: false,
  waterfallLines: 3,
  keepScreenOn: true,
  maxBrightness: true
};
const TEXT_COLOR_PRESETS = [
  "#FFFFFF",
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#FF00FF",
  "#FFA500"
];
const BG_COLOR_PRESETS = [
  "#000000",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#2d132c"
];
const QUICK_PHRASES = [
  "生日快乐",
  "加油！",
  "欢迎回家",
  "我爱你",
  "必胜",
  "谢谢",
  "新店开业",
  "全场八折"
];
const PRESET_TEMPLATES = [
  {
    id: "concert",
    name: "演唱会",
    text: "加油！你最棒！",
    textColor: "#FF00FF",
    bgColor: "#0a0a0a",
    bgTransparent: false,
    fontSizeRpx: 140,
    speedSec: 10,
    direction: "ltr",
    effect: "neon"
  },
  {
    id: "airport",
    name: "接机",
    text: "欢迎回家",
    textColor: "#FFFF00",
    bgColor: "#000000",
    bgTransparent: false,
    fontSizeRpx: 160,
    speedSec: 14,
    direction: "ltr",
    effect: "stroke"
  },
  {
    id: "birthday",
    name: "生日快乐",
    text: "生日快乐 🎂",
    textColor: "#FFB6C1",
    bgColor: "#2d132c",
    bgTransparent: false,
    fontSizeRpx: 130,
    speedSec: 12,
    direction: "ltr",
    effect: "blink"
  },
  {
    id: "shop",
    name: "店铺促销",
    text: "新店开业 全场八折",
    textColor: "#FFFFFF",
    bgColor: "#8B0000",
    bgTransparent: false,
    fontSizeRpx: 110,
    speedSec: 15,
    direction: "ltr",
    effect: "neon"
  }
];
const EFFECT_OPTIONS = [
  { value: "none", label: "无" },
  { value: "blink", label: "闪烁" },
  { value: "neon", label: "霓虹" },
  { value: "stroke", label: "描边" }
];
function utf8Bytes(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++)
    arr[i] = utf8.charCodeAt(i);
  return arr;
}
function utf8FromBytes(uint8) {
  let s = "";
  for (let i = 0; i < uint8.length; i++)
    s += String.fromCharCode(uint8[i]);
  return decodeURIComponent(escape(s));
}
function utf8ToBase64(str) {
  const arr = utf8Bytes(str);
  const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.arrayBufferToBase64) {
    return common_vendor.wx$1.arrayBufferToBase64(buf);
  }
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}
function base64ToUtf8(b64) {
  if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.base64ToArrayBuffer) {
    const buf = common_vendor.wx$1.base64ToArrayBuffer(b64);
    return utf8FromBytes(new Uint8Array(buf));
  }
  if (typeof atob !== "undefined") {
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
      arr[i] = binary.charCodeAt(i);
    return utf8FromBytes(arr);
  }
  return "";
}
function mergeConfig(partial) {
  return { ...DEFAULT_CONFIG, ...partial };
}
function loadPlayConfig() {
  try {
    const raw = common_vendor.index.getStorageSync(PLAY_CONFIG_KEY);
    if (!raw)
      return { ...DEFAULT_CONFIG };
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return mergeConfig(obj);
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}
function savePlayConfig(config) {
  common_vendor.index.setStorageSync(PLAY_CONFIG_KEY, JSON.stringify(config));
}
function loadHistory() {
  try {
    const raw = common_vendor.index.getStorageSync(HISTORY_KEY);
    if (!raw)
      return [];
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch (e) {
    return [];
  }
}
function pushHistory(text) {
  const t = (text || "").trim();
  if (!t)
    return;
  let list = loadHistory().filter((x) => x !== t);
  list.unshift(t);
  if (list.length > HISTORY_MAX)
    list = list.slice(0, HISTORY_MAX);
  common_vendor.index.setStorageSync(HISTORY_KEY, JSON.stringify(list));
}
function encodeTemplateShare(config) {
  const payload = JSON.stringify({
    v: 1,
    ...mergeConfig(config)
  });
  return utf8ToBase64(payload);
}
function loadPremiumUnlock() {
  try {
    const raw = common_vendor.index.getStorageSync(PREMIUM_UNLOCK_KEY);
    if (!raw)
      return { bgImage: false, waterfall: false };
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      bgImage: !!obj.bgImage,
      waterfall: !!obj.waterfall
    };
  } catch (e) {
    return { bgImage: false, waterfall: false };
  }
}
function savePremiumUnlock(data) {
  const merged = {
    bgImage: !!data.bgImage,
    waterfall: !!data.waterfall
  };
  common_vendor.index.setStorageSync(PREMIUM_UNLOCK_KEY, JSON.stringify(merged));
}
function decodeTemplateShare(b64) {
  if (!b64 || typeof b64 !== "string")
    return null;
  try {
    const json = base64ToUtf8(b64);
    const obj = JSON.parse(json);
    if (!obj || obj.v !== 1)
      return null;
    delete obj.v;
    return mergeConfig(obj);
  } catch (e) {
    return null;
  }
}
exports.BG_COLOR_PRESETS = BG_COLOR_PRESETS;
exports.EFFECT_OPTIONS = EFFECT_OPTIONS;
exports.PRESET_TEMPLATES = PRESET_TEMPLATES;
exports.QUICK_PHRASES = QUICK_PHRASES;
exports.TEXT_COLOR_PRESETS = TEXT_COLOR_PRESETS;
exports.decodeTemplateShare = decodeTemplateShare;
exports.encodeTemplateShare = encodeTemplateShare;
exports.loadHistory = loadHistory;
exports.loadPlayConfig = loadPlayConfig;
exports.loadPremiumUnlock = loadPremiumUnlock;
exports.mergeConfig = mergeConfig;
exports.pushHistory = pushHistory;
exports.savePlayConfig = savePlayConfig;
exports.savePremiumUnlock = savePremiumUnlock;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/barrage.js.map

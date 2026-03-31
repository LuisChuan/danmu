/** 弹幕配置与本地存储（不上传服务器） */

export const PLAY_CONFIG_KEY = 'barrage_play_config_v1';
export const HISTORY_KEY = 'barrage_history_v1';
export const HISTORY_MAX = 10;
export const PREMIUM_UNLOCK_KEY = 'barrage_premium_unlock_v1';

export const DEFAULT_CONFIG = {
  text: '输入手持弹幕~~',
  textColor: '#FF0000',
  bgColor: '#000000',
  bgTransparent: false,
  fontSizeRpx: 120,
  speedSec: 12,
  direction: 'ltr',
  effect: 'neon',
  bgImage: '',
  waterfallMode: false,
  waterfallLines: 3,
  keepScreenOn: true,
  maxBrightness: true
};

export const TEXT_COLOR_PRESETS = [
  '#FFFFFF',
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#FF00FF',
  '#FFA500'
];

export const BG_COLOR_PRESETS = [
  '#000000',
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#533483',
  '#2d132c'
];

export const QUICK_PHRASES = [
  '生日快乐',
  '加油！',
  '欢迎回家',
  '我爱你',
  '必胜',
  '谢谢',
  '新店开业',
  '全场八折'
];

export const PRESET_TEMPLATES = [
  {
    id: 'concert',
    name: '演唱会',
    text: '加油！你最棒！',
    textColor: '#FF00FF',
    bgColor: '#0a0a0a',
    bgTransparent: false,
    fontSizeRpx: 140,
    speedSec: 10,
    direction: 'ltr',
    effect: 'neon'
  },
  {
    id: 'airport',
    name: '接机',
    text: '欢迎回家',
    textColor: '#FFFF00',
    bgColor: '#000000',
    bgTransparent: false,
    fontSizeRpx: 160,
    speedSec: 14,
    direction: 'ltr',
    effect: 'stroke'
  },
  {
    id: 'birthday',
    name: '生日快乐',
    text: '生日快乐 🎂',
    textColor: '#FFB6C1',
    bgColor: '#2d132c',
    bgTransparent: false,
    fontSizeRpx: 130,
    speedSec: 12,
    direction: 'ltr',
    effect: 'blink'
  },
  {
    id: 'shop',
    name: '店铺促销',
    text: '新店开业 全场八折',
    textColor: '#FFFFFF',
    bgColor: '#8B0000',
    bgTransparent: false,
    fontSizeRpx: 110,
    speedSec: 15,
    direction: 'ltr',
    effect: 'neon'
  }
];

export const EFFECT_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'blink', label: '闪烁' },
  { value: 'neon', label: '霓虹' },
  { value: 'stroke', label: '描边' }
];

function utf8Bytes(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
  return arr;
}

function utf8FromBytes(uint8) {
  let s = '';
  for (let i = 0; i < uint8.length; i++) s += String.fromCharCode(uint8[i]);
  return decodeURIComponent(escape(s));
}

export function utf8ToBase64(str) {
  const arr = utf8Bytes(str);
  const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
    return wx.arrayBufferToBase64(buf);
  }
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== 'undefined' ? btoa(binary) : '';
}

export function base64ToUtf8(b64) {
  if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    const buf = wx.base64ToArrayBuffer(b64);
    return utf8FromBytes(new Uint8Array(buf));
  }
  if (typeof atob !== 'undefined') {
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return utf8FromBytes(arr);
  }
  return '';
}

export function mergeConfig(partial) {
  return { ...DEFAULT_CONFIG, ...partial };
}

export function loadPlayConfig() {
  try {
    const raw = uni.getStorageSync(PLAY_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return mergeConfig(obj);
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

export function savePlayConfig(config) {
  uni.setStorageSync(PLAY_CONFIG_KEY, JSON.stringify(config));
}

export function loadHistory() {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY);
    if (!raw) return [];
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch (e) {
    return [];
  }
}

export function pushHistory(text) {
  const t = (text || '').trim();
  if (!t) return;
  let list = loadHistory().filter((x) => x !== t);
  list.unshift(t);
  if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX);
  uni.setStorageSync(HISTORY_KEY, JSON.stringify(list));
}

export function encodeTemplateShare(config) {
  const payload = JSON.stringify({
    v: 1,
    ...mergeConfig(config)
  });
  return utf8ToBase64(payload);
}

export function loadPremiumUnlock() {
  try {
    const raw = uni.getStorageSync(PREMIUM_UNLOCK_KEY);
    if (!raw) return { bgImage: false, waterfall: false };
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      bgImage: !!obj.bgImage,
      waterfall: !!obj.waterfall
    };
  } catch (e) {
    return { bgImage: false, waterfall: false };
  }
}

export function savePremiumUnlock(data) {
  const merged = {
    bgImage: !!data.bgImage,
    waterfall: !!data.waterfall
  };
  uni.setStorageSync(PREMIUM_UNLOCK_KEY, JSON.stringify(merged));
}

export function decodeTemplateShare(b64) {
  if (!b64 || typeof b64 !== 'string') return null;
  try {
    const json = base64ToUtf8(b64);
    const obj = JSON.parse(json);
    if (!obj || obj.v !== 1) return null;
    delete obj.v;
    return mergeConfig(obj);
  } catch (e) {
    return null;
  }
}

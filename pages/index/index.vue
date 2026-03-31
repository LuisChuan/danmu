<template>
  <view class="page">
    <view class="topbar">
      <text class="app-title">手持弹幕</text>
      <text class="app-sub">输入一句话，一键横屏全屏展示</text>
    </view>

    <view class="card preview-card">
      <view class="card-head">
        <text class="card-title">预览</text>
        <text class="card-meta"
          >{{ effectLabels[effectIndex] }} ·
          {{ config.direction === 'rtl' ? '右→左' : '左→右' }}</text
        >
      </view>
      <view
        class="preview-stage"
        :style="{
          backgroundColor: previewBg
        }"
      >
        <view class="preview-marquee">
          <view
            class="preview-track"
            :class="[previewDirClass, previewEffectClass]"
            :style="previewTrackStyle"
          >
            <text class="preview-text" :style="previewTextStyle">{{
              previewText
            }}</text>
            <text class="preview-text" :style="previewTextStyle">{{
              previewText
            }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">文案</text>
        <text class="card-meta">{{ (config.text || '').length }}/200</text>
      </view>
      <textarea
        class="text-input"
        v-model="config.text"
        maxlength="200"
        :auto-height="true"
        placeholder="输入要显示的文字，支持 Emoji"
        placeholder-style="color: rgba(0,0,0,0.42);"
      />
      <scroll-view class="quick-row" scroll-x enable-flex>
        <button
          v-for="(p, i) in quickPhrases"
          :key="i"
          class="chip"
          type="default"
          @tap="applyQuick(p)"
        >
          <text class="chip-text">{{ p }}</text>
        </button>
      </scroll-view>
    </view>

    <view class="card">
      <view class="card-head">
        <text class="card-title">场景模板</text>
        <text class="card-meta">一键套用</text>
      </view>
      <view class="tpl-grid">
        <view
          v-for="t in presetTemplates"
          :key="t.id"
          class="tpl-card"
          @tap="applyTemplate(t)"
        >
          <text class="tpl-name">{{ t.name }}</text>
          <text class="tpl-sub">{{ t.text }}</text>
        </view>
      </view>
    </view>

    <view v-if="customOpen" class="custom-wrap" id="settings-anchor">
      <view class="card">
        <view class="card-head">
          <text class="card-title">设置</text>
          <text class="card-meta">播放页也可调</text>
        </view>

        <view class="group">
          <text class="group-title">文字颜色</text>
          <view class="color-row">
            <view
              v-for="c in textColorPresets"
              :key="c"
              class="color-dot"
              :class="{ active: config.textColor === c }"
              :style="{ backgroundColor: c }"
              @tap="config.textColor = c"
            />
          </view>
        </view>

        <view class="divider" />

        <view class="group">
          <view class="row-between">
            <text class="group-title">背景</text>
            <view class="switch-wrap">
              <text class="hint">透明</text>
              <switch
                :checked="config.bgTransparent"
                @change="onBgTransparent"
                color="#81D8D0"
              />
            </view>
          </view>
          <view class="color-row">
            <view
              v-for="c in bgColorPresets"
              :key="c"
              class="color-dot ring"
              :class="{ active: config.bgColor === c && !config.bgTransparent }"
              :style="{ backgroundColor: c }"
              @tap="setBg(c)"
            />
          </view>
        </view>

        <view class="divider" />

        <view class="group">
          <text class="group-title">字体大小 {{ config.fontSizeRpx }} rpx</text>
          <slider
            :value="config.fontSizeRpx"
            min="48"
            max="220"
            step="4"
            activeColor="#81D8D0"
            @changing="onFontSize"
            @change="onFontSize"
          />
        </view>

        <view class="divider" />

        <view class="group">
          <view class="row-between">
            <text class="group-title">滚动速度</text>
            <text class="group-meta">{{ speedLabel }}</text>
          </view>
          <slider
            :value="displaySpeedSec"
            min="4"
            max="32"
            step="1"
            activeColor="#81D8D0"
            @changing="onSpeed"
            @change="onSpeed"
          />
          <text class="hint">左边慢，右边快</text>
        </view>

        <view class="divider" />

        <view class="group">
          <text class="group-title">滚动方向</text>
          <view class="seg">
            <view
              class="seg-item"
              :class="{ on: config.direction === 'ltr' }"
              @tap="config.direction = 'ltr'"
              >从左到右</view
            >
            <view
              class="seg-item"
              :class="{ on: config.direction === 'rtl' }"
              @tap="config.direction = 'rtl'"
              >从右到左</view
            >
          </view>
        </view>

        <view class="divider" />

        <view class="group">
          <text class="group-title">弹幕特效</text>
          <picker
            mode="selector"
            :range="effectLabels"
            :value="effectIndex"
            @change="onEffectPick"
          >
            <view class="picker-line">{{ effectLabels[effectIndex] }}</view>
          </picker>
        </view>

        <view class="divider" />

        <view class="group">
          <text class="group-title">历史记录</text>
          <view v-if="!history.length" class="empty"
            >暂无，播放时会自动保存最近文案</view
          >
          <scroll-view v-else class="history-row" scroll-x enable-flex>
            <button
              v-for="(h, i) in history"
              :key="i"
              class="history-chip"
              type="default"
              @tap="config.text = h"
            >
              <text class="history-chip-text">{{ h }}</text>
            </button>
          </scroll-view>
        </view>

        <view class="divider" />

        <view class="group">
          <text class="group-title">高级</text>
          <view class="row-between row-pad">
            <text>常亮锁定</text>
            <switch
              :checked="config.keepScreenOn"
              @change="onKeepScreen"
              color="#81D8D0"
            />
          </view>
          <view class="row-between row-pad">
            <text>最高亮度</text>
            <switch
              :checked="config.maxBrightness"
              @change="onMaxBright"
              color="#81D8D0"
            />
          </view>
          <view class="divider slim" />
          <view class="row-between row-pad">
            <text>自定义背景图（高级）</text>
            <text class="premium-state">{{
              premium.bgImage ? '' : rewardedOn ? '' : ''
            }}</text>
          </view>
          <view class="row-inline">
            <button class="mini-btn" @tap="pickBgImage">上传背景图</button>
            <button class="mini-btn ghost-mini" @tap="clearBgImage">
              清除
            </button>
          </view>

          <view class="divider slim" />
          <view class="row-between row-pad">
            <text>多行瀑布流（高级）</text>
            <switch
              :checked="config.waterfallMode"
              @change="onWaterfallToggle"
              color="#81D8D0"
            />
          </view>
          <view v-if="config.waterfallMode" class="row-between row-pad">
            <text>行数：{{ config.waterfallLines }}</text>
            <slider
              class="line-slider"
              :value="config.waterfallLines"
              min="2"
              max="6"
              step="1"
              activeColor="#81D8D0"
              @changing="onWaterfallLines"
              @change="onWaterfallLines"
            />
          </view>
          <text class="hint">亮屏需系统授权；数据仅存本机，不上传。</text>
        </view>
      </view>
    </view>
    <text class="landscape-tip">播放页默认横屏全屏，便于手持展示</text>
  </view>

  <view class="actions actions-fixed">
    <button class="btn primary start-play" type="primary" @tap="goPlay">
      全屏播放
    </button>
    <button class="btn ghost more-settings" @tap="toggleCustomOpen">
      {{ customOpen ? '收起设置' : '更多设置' }}
    </button>
    <button class="btn share" open-type="share">分享</button>
  </view>
</template>

<script setup>
import { computed, ref, reactive, onMounted, nextTick } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import {
  DEFAULT_CONFIG,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
  QUICK_PHRASES,
  PRESET_TEMPLATES,
  EFFECT_OPTIONS,
  loadHistory,
  loadPlayConfig,
  loadPremiumUnlock,
  savePremiumUnlock,
  savePlayConfig,
  pushHistory,
  mergeConfig,
  encodeTemplateShare,
  decodeTemplateShare
} from '../../utils/barrage.js';
import {
  REWARDED_VIDEO_AD_UNIT,
  isRewardAdConfigured
} from '../../config/ad.config.js';

const config = reactive(loadPlayConfig());
const history = ref([]);
const customOpen = ref(false);
const premium = reactive(loadPremiumUnlock());

const quickPhrases = QUICK_PHRASES;
const textColorPresets = TEXT_COLOR_PRESETS;
const bgColorPresets = BG_COLOR_PRESETS;
const presetTemplates = PRESET_TEMPLATES;
const effectLabels = EFFECT_OPTIONS.map((e) => e.label);
const rewardedOn = computed(() => isRewardAdConfigured());

function persistPartial() {
  savePlayConfig({ ...config });
}

function persistPremium() {
  savePremiumUnlock({ ...premium });
}

function getRewardedUnitId() {
  return REWARDED_VIDEO_AD_UNIT || '';
}

function scrollToSettingsAnchor() {
  const query = uni.createSelectorQuery();
  query.selectViewport().scrollOffset();
  query.select('#settings-anchor').boundingClientRect();
  query.select('.preview-card').boundingClientRect();
  query.exec((res) => {
    const viewport = res && res[0];
    const anchor = res && res[1];
    const preview = res && res[2];

    const currentScrollTop = viewport ? viewport.scrollTop || 0 : 0;
    const anchorTop = anchor ? anchor.top || 0 : 0;
    const previewHeight = preview ? preview.height || 0 : 0;

    // 让设置区域紧贴“置顶预览卡片”的下边缘
    const desiredTopInViewport = previewHeight;
    const delta = anchorTop - desiredTopInViewport;
    const target = Math.max(0, currentScrollTop + delta);

    uni.pageScrollTo({
      scrollTop: target,
      duration: 420
    });
  });
}

function toggleCustomOpen() {
  const next = !customOpen.value;
  customOpen.value = next;
  if (!next) return;
  nextTick(() => {
    scrollToSettingsAnchor();
  });
}

onLoad((options) => {
  if (options && options.d) {
    let raw = String(options.d);
    try {
      raw = decodeURIComponent(raw);
    } catch (e) {}
    const decoded = decodeTemplateShare(raw);
    if (decoded) {
      Object.assign(config, decoded);
      savePlayConfig({ ...config });
      customOpen.value = true;
      nextTick(() => {
        scrollToSettingsAnchor();
      });
    }
  }
});

onMounted(() => {
  history.value = loadHistory();
});

const effectIndex = computed(() => {
  const i = EFFECT_OPTIONS.findIndex((e) => e.value === config.effect);
  return i < 0 ? 0 : i;
});

const previewText = computed(() => {
  const t = (config.text || '').trim();
  return t || '预览文字';
});

const previewBg = computed(() => {
  if (config.bgTransparent) return '#000000';
  return config.bgColor || '#000000';
});

const previewTextStyle = computed(() => ({
  color: config.textColor,
  fontSize: Math.min(config.fontSizeRpx, 72) + 'rpx'
}));

const previewTrackStyle = computed(() => ({
  animationDuration: Math.max(4, config.speedSec) * 0.35 + 's'
}));

const previewDirClass = computed(() =>
  config.direction === 'rtl' ? 'dir-rtl' : ''
);

const previewEffectClass = computed(() => {
  const m = {
    none: '',
    blink: 'fx-blink',
    neon: 'fx-neon',
    stroke: 'fx-stroke'
  };
  return m[config.effect] || '';
});

const speedLabel = computed(() => {
  const s = config.speedSec;
  if (s <= 8) return '快';
  if (s <= 18) return '中';
  return '慢';
});

const SPEED_MIN = 4;
const SPEED_MAX = 32;

// Slider 默认是“min在左、max在右”，而本项目中数值越大越慢。
// 为了让交互表现为“从慢到快”，需要把滑块值做反转映射。
const displaySpeedSec = computed(() => SPEED_MIN + SPEED_MAX - config.speedSec);

function onBgTransparent(e) {
  config.bgTransparent = !!(e.detail && e.detail.value);
  persistPartial();
}

function setBg(c) {
  config.bgColor = c;
  config.bgTransparent = false;
  persistPartial();
}

function onFontSize(e) {
  const v = Number(e.detail.value);
  config.fontSizeRpx = v;
  persistPartial();
}

function onSpeed(e) {
  const v = Number(e.detail.value);
  config.speedSec = SPEED_MIN + SPEED_MAX - v;
  persistPartial();
}

function onEffectPick(e) {
  const idx = Number(e.detail.value);
  const opt = EFFECT_OPTIONS[idx];
  if (opt) {
    config.effect = opt.value;
    persistPartial();
  }
}

function applyQuick(p) {
  config.text = p;
  persistPartial();
}

function applyTemplate(t) {
  const { id, name, ...rest } = t;
  Object.assign(config, mergeConfig(rest));
  persistPartial();
}

function onKeepScreen(e) {
  config.keepScreenOn = !!(e.detail && e.detail.value);
  persistPartial();
}

function onMaxBright(e) {
  config.maxBrightness = !!(e.detail && e.detail.value);
  persistPartial();
}

function pickBgImage() {
  ensurePremium('bgImage', () => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        config.bgImage = path;
        config.bgTransparent = false;
        persistPartial();
        uni.showToast({ title: '背景图已应用', icon: 'success' });
      }
    });
  });
}

function clearBgImage() {
  config.bgImage = '';
  persistPartial();
}

function onWaterfallToggle(e) {
  const on = !!(e.detail && e.detail.value);
  if (!on) {
    config.waterfallMode = false;
    persistPartial();
    return;
  }
  ensurePremium('waterfall', () => {
    config.waterfallMode = true;
    persistPartial();
  });
}

function onWaterfallLines(e) {
  const v = Number(e.detail.value);
  config.waterfallLines = Math.max(2, Math.min(6, v));
  persistPartial();
}

function ensurePremium(feature, cb) {
  if (premium[feature]) {
    cb && cb();
    return;
  }
  if (!isRewardAdConfigured()) {
    premium[feature] = true;
    persistPremium();
    cb && cb();
    return;
  }
  uni.showModal({
    title: '高级功能',
    content: '该功能需观看激励广告解锁，是否继续？',
    confirmText: '去解锁',
    success: (ret) => {
      if (!ret.confirm) return;
      unlockByAd(feature, cb);
    }
  });
}

function unlockByAd(feature, cb) {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
    const unitId = getRewardedUnitId();
    if (!unitId) return;
    const ad = wx.createRewardedVideoAd({ adUnitId: unitId });
    ad.show().catch(() => ad.load().then(() => ad.show()));
    ad.onClose((res) => {
      const ended = !!(res && (res.isEnded || res === undefined));
      if (!ended) {
        uni.showToast({ title: '请完整观看广告', icon: 'none' });
        return;
      }
      premium[feature] = true;
      persistPremium();
      cb && cb();
      uni.showToast({ title: '解锁成功', icon: 'success' });
    });
    ad.onError(() => {
      uni.showToast({ title: '广告暂不可用', icon: 'none' });
    });
    return;
  }
  // #endif
  premium[feature] = true;
  persistPremium();
  cb && cb();
}

function clearAll() {
  Object.assign(config, DEFAULT_CONFIG);
  persistPartial();
  uni.showToast({ title: '已清空', icon: 'none' });
}

function goPlay() {
  const text = (config.text || '').trim();
  if (!text) {
    uni.showToast({ title: '请先输入文字', icon: 'none' });
    return;
  }
  savePlayConfig({ ...config });
  pushHistory(text);
  history.value = loadHistory();
  uni.navigateTo({ url: '/pages/play/play' });
}

function copyTemplateCode() {
  const code = encodeTemplateShare({ ...config });
  uni.setClipboardData({
    data: code,
    success: () => uni.showToast({ title: '模板码已复制', icon: 'success' })
  });
}

onShareAppMessage(() => {
  const d = encodeTemplateShare({ ...config });
  return {
    title: '手持弹幕',
    path: '/pages/index/index?d=' + encodeURIComponent(d)
  };
});
</script>

<style scoped>
.page {
  --bg1: #fbeea0;
  --bg2: #f6e58f;
  --card: #dff6ff;
  --card-glass: rgba(221, 245, 255, 0.78);
  --border: #070707;
  --text: #080808;
  --muted: rgba(8, 8, 8, 0.66);
  --accent: #8dd8ff;
  --accent2: #5cbef2;
  --yellow-glow: #fff3a6;
  padding: 26rpx 32rpx 220rpx;
  box-sizing: border-box;
  min-height: 100vh;
  background:
    radial-gradient(
      960rpx 560rpx at 12% 5%,
      rgba(255, 255, 255, 0.38),
      transparent 62%
    ),
    radial-gradient(
      760rpx 520rpx at 90% 16%,
      rgba(141, 216, 255, 0.34),
      transparent 66%
    ),
    linear-gradient(180deg, var(--bg1), var(--bg2));
  color: var(--text);
}

.topbar {
  padding: 6rpx 2rpx 18rpx;
}

.app-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
  text-shadow: 0 4rpx 0 rgba(255, 255, 255, 0.55);
}

.app-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--muted);
}

.card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, var(--card), var(--card-glass));
  border: 7rpx solid var(--border);
  border-radius: 34rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
  box-shadow:
    0 16rpx 0 rgba(0, 0, 0, 0.85),
    0 28rpx 48rpx rgba(56, 124, 164, 0.24);
  backdrop-filter: blur(9px);
  animation: card-float 5.2s ease-in-out infinite;
}

.preview-card {
  position: sticky;
  top: 0;
  z-index: 20;
}

.card::before {
  content: '';
  position: absolute;
  left: -16%;
  right: -16%;
  top: -30%;
  height: 46%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.72),
    rgba(255, 255, 255, 0)
  );
  pointer-events: none;
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 28rpx;
  box-shadow:
    inset 0 2rpx 0 rgba(255, 255, 255, 0.92),
    inset 0 0 0 2rpx rgba(8, 8, 8, 0.16);
  pointer-events: none;
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #080808;
}

.card-meta {
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.62);
  white-space: nowrap;
}

.preview-stage {
  height: 160rpx;
  border-radius: 26rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  position: relative;
  border: 6rpx solid #070707;
  box-shadow:
    inset 0 0 0 2rpx rgba(255, 255, 255, 0.72),
    0 10rpx 28rpx rgba(84, 153, 193, 0.34);
}

.preview-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(141, 216, 255, 0.2),
    rgba(255, 243, 166, 0.26)
  );
  mix-blend-mode: screen;
  pointer-events: none;
}

.preview-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.16) 1px,
    transparent 1px
  );
  background-size: 18rpx 18rpx;
  opacity: 0.12;
  pointer-events: none;
}

.preview-marquee {
  width: 100%;
  overflow: hidden;
}

.preview-track {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  white-space: nowrap;
  animation: preview-marquee linear infinite;
  will-change: transform;
  position: relative;
}

@keyframes preview-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.preview-track.dir-rtl {
  animation-direction: reverse;
}

.preview-text {
  flex-shrink: 0;
  padding-right: 48rpx;
  font-weight: 700;
  text-shadow: 0 2rpx 0 rgba(255, 255, 255, 0.56);
}

.fx-blink .preview-text {
  animation: preview-blink 1.2s ease infinite;
}

@keyframes preview-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.fx-neon .preview-text {
  text-shadow:
    0 0 8rpx #fff,
    0 0 18rpx var(--yellow-glow),
    0 0 30rpx currentColor;
}

.fx-stroke .preview-text {
  -webkit-text-stroke: 2.2rpx #000;
}

.text-input {
  width: 100%;
  min-height: 160rpx;
  padding: 18rpx;
  box-sizing: border-box;
  font-size: 34rpx;
  line-height: 1.55;
  color: #090909;
  background: rgba(255, 255, 255, 0.56);
  border-radius: 20rpx;
  border: 4rpx solid #080808;
  box-shadow: inset 0 4rpx 0 rgba(255, 255, 255, 0.72);
}

.quick-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-top: 14rpx;
  white-space: nowrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  min-height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  margin-right: 12rpx;
  border: 4rpx solid #070707;
  background: linear-gradient(135deg, #d9f4ff, #bde9ff);
  color: #050505;
  border-radius: 999rpx;
  font-size: 24rpx;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 180rpx;
  max-width: 320rpx;
  box-shadow: 0 7rpx 0 rgba(0, 0, 0, 0.86);
}

.chip-text {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip:active {
  transform: translateY(4rpx);
  box-shadow: 0 3rpx 0 rgba(0, 0, 0, 0.86);
}

.chip::after,
.history-chip::after {
  border: none;
}

.chip::before,
.history-chip::before {
  border: none;
}

.group {
  padding: 2rpx 0;
}

.group-title {
  font-size: 26rpx;
  font-weight: 650;
  color: #050505;
  display: block;
  margin-bottom: 14rpx;
}

.group-meta {
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.7);
}

.divider {
  height: 1rpx;
  background: rgba(8, 8, 8, 0.16);
  margin: 18rpx 0;
}

.color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.color-dot {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  box-sizing: border-box;
  border: 4rpx solid transparent;
}

.color-dot.active {
  border-color: #070707;
  box-shadow: 0 0 0 8rpx rgba(141, 216, 255, 0.22);
}

.color-dot.ring {
  border: 3rpx solid rgba(8, 8, 8, 0.58);
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #060606;
}

.switch-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hint {
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.62);
  margin-top: 8rpx;
  display: block;
}

.seg {
  display: flex;
  border-radius: 16rpx;
  overflow: hidden;
  border: 4rpx solid #070707;
}

.seg-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 26rpx;
  background: rgba(255, 255, 255, 0.44);
  color: rgba(8, 8, 8, 0.72);
}

.seg-item.on {
  background: linear-gradient(135deg, #a9e4ff, #73c7f8);
  color: #050505;
  text-shadow: 0 0 14rpx rgba(255, 249, 196, 0.72);
}

.picker-line {
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.54);
  border: 4rpx solid #070707;
  border-radius: 18rpx;
  font-size: 28rpx;
  color: #050505;
}

.history-row {
  display: flex;
  flex-direction: row;
  white-space: nowrap;
  margin-top: 8rpx;
}

.history-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  min-height: 56rpx;
  line-height: 56rpx;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 20rpx;
  margin-right: 12rpx;
  background: rgba(255, 255, 255, 0.56);
  border: 4rpx solid #070707;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: rgba(8, 8, 8, 0.86);
  box-sizing: border-box;
  white-space: nowrap;
}

.history-chip-text {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  font-size: 24rpx;
  color: rgba(8, 8, 8, 0.62);
}

.tpl-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tpl-card {
  width: calc(50% - 8rpx);
  box-sizing: border-box;
  padding: 20rpx;
  background: linear-gradient(135deg, #daf3ff, #c0eaff);
  border: 5rpx solid #070707;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 0 rgba(0, 0, 0, 0.86);
}

.tpl-card:active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 0 rgba(0, 0, 0, 0.86);
}

.tpl-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #080808;
  display: block;
  margin-bottom: 8rpx;
}

.tpl-sub {
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.8);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 16rpx;
  margin: 20rpx 0 12rpx;
}

.actions-fixed {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 0;
  z-index: 50;
  margin: 0 !important;
  padding-top: 16rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(246, 229, 143, 0.88);
  backdrop-filter: blur(8px);
  border-top: 3rpx solid rgba(8, 8, 8, 0.22);
  box-sizing: border-box;
}

.custom-wrap {
  padding-top: 10rpx;
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-6rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.row-pad {
  padding: 12rpx 0;
}

.divider.slim {
  margin: 14rpx 0;
}

.premium-state {
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.8);
}

.row-inline {
  display: flex;
  gap: 14rpx;
  margin-top: 10rpx;
}

.mini-btn {
  height: 62rpx;
  line-height: 62rpx;
  padding: 0 18rpx;
  font-size: 24rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #d8f2ff, #b6e6ff);
  color: #0b0b0b;
  border: 4rpx solid #070707;
  box-shadow: 0 6rpx 0 rgba(0, 0, 0, 0.86);
}

.mini-btn::after {
  border: none;
}

.mini-btn.ghost-mini {
  background: rgba(255, 255, 255, 0.52);
  border: 4rpx solid #070707;
}

.line-slider {
  flex: 1;
  margin-left: 24rpx;
}

.landscape-tip {
  display: block;
  font-size: 22rpx;
  color: rgba(8, 8, 8, 0.65);
  text-align: center;
  margin-top: 24rpx;
  margin-bottom: 8rpx;
}

.btn {
  position: relative;
  overflow: hidden;
  flex: 1;
  font-size: 28rpx;
  border-radius: 24rpx;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 18rpx;
  border: 5rpx solid #070707;
  box-shadow: 0 10rpx 0 rgba(0, 0, 0, 0.86);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.start-play {
  flex: 1.6;
}

.btn::after {
  border: none;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.58);
  color: rgba(8, 8, 8, 0.88);
}

.btn.primary {
  background: linear-gradient(135deg, #abebff, #73c8f8);
  color: rgba(8, 8, 8, 0.96);
  box-shadow:
    0 12rpx 0 rgba(0, 0, 0, 0.86),
    0 14rpx 34rpx rgba(116, 196, 244, 0.34);
  animation: pulse-main 1.8s ease-in-out infinite;
}

.btn.primary::before {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  top: -70%;
  height: 150%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.62),
    rgba(255, 255, 255, 0)
  );
  pointer-events: none;
}

.btn.share {
  background: linear-gradient(135deg, #fff8cb, #f8e988);
  color: rgba(8, 8, 8, 0.9);
}

.btn:active {
  transform: translateY(4rpx);
  box-shadow: 0 5rpx 0 rgba(0, 0, 0, 0.86);
}

@keyframes pulse-main {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(255, 250, 199, 0));
  }
  50% {
    filter: drop-shadow(0 0 16rpx rgba(255, 250, 199, 0.92));
  }
}

@keyframes card-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3rpx);
  }
}
</style>

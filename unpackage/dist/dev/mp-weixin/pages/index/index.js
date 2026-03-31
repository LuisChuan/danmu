"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_barrage = require("../../utils/barrage.js");
const config_ad_config = require("../../config/ad.config.js");
const SPEED_MIN = 4;
const SPEED_MAX = 32;
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const config = common_vendor.reactive(utils_barrage.loadPlayConfig());
    const history = common_vendor.ref([]);
    const customOpen = common_vendor.ref(false);
    const premium = common_vendor.reactive(utils_barrage.loadPremiumUnlock());
    const quickPhrases = utils_barrage.QUICK_PHRASES;
    const textColorPresets = utils_barrage.TEXT_COLOR_PRESETS;
    const bgColorPresets = utils_barrage.BG_COLOR_PRESETS;
    const presetTemplates = utils_barrage.PRESET_TEMPLATES;
    const effectLabels = utils_barrage.EFFECT_OPTIONS.map((e) => e.label);
    const rewardedOn = common_vendor.computed(() => config_ad_config.isRewardAdConfigured());
    function persistPartial() {
      utils_barrage.savePlayConfig({ ...config });
    }
    function persistPremium() {
      utils_barrage.savePremiumUnlock({ ...premium });
    }
    function scrollToSettingsAnchor() {
      const query = common_vendor.index.createSelectorQuery();
      query.selectViewport().scrollOffset();
      query.select("#settings-anchor").boundingClientRect();
      query.select(".preview-card").boundingClientRect();
      query.exec((res) => {
        const viewport = res && res[0];
        const anchor = res && res[1];
        const preview = res && res[2];
        const currentScrollTop = viewport ? viewport.scrollTop || 0 : 0;
        const anchorTop = anchor ? anchor.top || 0 : 0;
        const previewHeight = preview ? preview.height || 0 : 0;
        const desiredTopInViewport = previewHeight;
        const delta = anchorTop - desiredTopInViewport;
        const target = Math.max(0, currentScrollTop + delta);
        common_vendor.index.pageScrollTo({
          scrollTop: target,
          duration: 420
        });
      });
    }
    function toggleCustomOpen() {
      const next = !customOpen.value;
      customOpen.value = next;
      if (!next)
        return;
      common_vendor.nextTick$1(() => {
        scrollToSettingsAnchor();
      });
    }
    common_vendor.onLoad((options) => {
      if (options && options.d) {
        let raw = String(options.d);
        try {
          raw = decodeURIComponent(raw);
        } catch (e) {
        }
        const decoded = utils_barrage.decodeTemplateShare(raw);
        if (decoded) {
          Object.assign(config, decoded);
          utils_barrage.savePlayConfig({ ...config });
          customOpen.value = true;
          common_vendor.nextTick$1(() => {
            scrollToSettingsAnchor();
          });
        }
      }
    });
    common_vendor.onMounted(() => {
      history.value = utils_barrage.loadHistory();
    });
    const effectIndex = common_vendor.computed(() => {
      const i = utils_barrage.EFFECT_OPTIONS.findIndex((e) => e.value === config.effect);
      return i < 0 ? 0 : i;
    });
    const previewText = common_vendor.computed(() => {
      const t = (config.text || "").trim();
      return t || "预览文字";
    });
    const previewBg = common_vendor.computed(() => {
      if (config.bgTransparent)
        return "#000000";
      return config.bgColor || "#000000";
    });
    const previewTextStyle = common_vendor.computed(() => ({
      color: config.textColor,
      fontSize: Math.min(config.fontSizeRpx, 72) + "rpx"
    }));
    const previewTrackStyle = common_vendor.computed(() => ({
      animationDuration: Math.max(4, config.speedSec) * 0.35 + "s"
    }));
    const previewDirClass = common_vendor.computed(
      () => config.direction === "rtl" ? "dir-rtl" : ""
    );
    const previewEffectClass = common_vendor.computed(() => {
      const m = {
        none: "",
        blink: "fx-blink",
        neon: "fx-neon",
        stroke: "fx-stroke"
      };
      return m[config.effect] || "";
    });
    const speedLabel = common_vendor.computed(() => {
      const s = config.speedSec;
      if (s <= 8)
        return "快";
      if (s <= 18)
        return "中";
      return "慢";
    });
    const displaySpeedSec = common_vendor.computed(() => SPEED_MIN + SPEED_MAX - config.speedSec);
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
      const opt = utils_barrage.EFFECT_OPTIONS[idx];
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
      Object.assign(config, utils_barrage.mergeConfig(rest));
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
      ensurePremium("bgImage", () => {
        common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album"],
          success: (res) => {
            const path = res.tempFilePaths && res.tempFilePaths[0];
            if (!path)
              return;
            config.bgImage = path;
            config.bgTransparent = false;
            persistPartial();
            common_vendor.index.showToast({ title: "背景图已应用", icon: "success" });
          }
        });
      });
    }
    function clearBgImage() {
      config.bgImage = "";
      persistPartial();
    }
    function onWaterfallToggle(e) {
      const on = !!(e.detail && e.detail.value);
      if (!on) {
        config.waterfallMode = false;
        persistPartial();
        return;
      }
      ensurePremium("waterfall", () => {
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
      if (!config_ad_config.isRewardAdConfigured()) {
        premium[feature] = true;
        persistPremium();
        cb && cb();
        return;
      }
      common_vendor.index.showModal({
        title: "高级功能",
        content: "该功能需观看激励广告解锁，是否继续？",
        confirmText: "去解锁",
        success: (ret) => {
          if (!ret.confirm)
            return;
          unlockByAd(feature, cb);
        }
      });
    }
    function unlockByAd(feature, cb) {
      if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.createRewardedVideoAd) {
        return;
      }
      premium[feature] = true;
      persistPremium();
      cb && cb();
    }
    function goPlay() {
      const text = (config.text || "").trim();
      if (!text) {
        common_vendor.index.showToast({ title: "请先输入文字", icon: "none" });
        return;
      }
      utils_barrage.savePlayConfig({ ...config });
      utils_barrage.pushHistory(text);
      history.value = utils_barrage.loadHistory();
      common_vendor.index.navigateTo({ url: "/pages/play/play" });
    }
    common_vendor.onShareAppMessage(() => {
      const d = utils_barrage.encodeTemplateShare({ ...config });
      return {
        title: "手持弹幕",
        path: "/pages/index/index?d=" + encodeURIComponent(d)
      };
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(effectLabels)[effectIndex.value]),
        b: common_vendor.t(config.direction === "rtl" ? "右→左" : "左→右"),
        c: common_vendor.t(previewText.value),
        d: common_vendor.s(previewTextStyle.value),
        e: common_vendor.t(previewText.value),
        f: common_vendor.s(previewTextStyle.value),
        g: common_vendor.n(previewDirClass.value),
        h: common_vendor.n(previewEffectClass.value),
        i: common_vendor.s(previewTrackStyle.value),
        j: previewBg.value,
        k: common_vendor.t((config.text || "").length),
        l: config.text,
        m: common_vendor.o(($event) => config.text = $event.detail.value),
        n: common_vendor.f(common_vendor.unref(quickPhrases), (p, i, i0) => {
          return {
            a: common_vendor.t(p),
            b: i,
            c: common_vendor.o(($event) => applyQuick(p), i)
          };
        }),
        o: common_vendor.f(common_vendor.unref(presetTemplates), (t, k0, i0) => {
          return {
            a: common_vendor.t(t.name),
            b: common_vendor.t(t.text),
            c: t.id,
            d: common_vendor.o(($event) => applyTemplate(t), t.id)
          };
        }),
        p: customOpen.value
      }, customOpen.value ? common_vendor.e({
        q: common_vendor.f(common_vendor.unref(textColorPresets), (c, k0, i0) => {
          return {
            a: c,
            b: config.textColor === c ? 1 : "",
            c,
            d: common_vendor.o(($event) => config.textColor = c, c)
          };
        }),
        r: config.bgTransparent,
        s: common_vendor.o(onBgTransparent),
        t: common_vendor.f(common_vendor.unref(bgColorPresets), (c, k0, i0) => {
          return {
            a: c,
            b: config.bgColor === c && !config.bgTransparent ? 1 : "",
            c,
            d: common_vendor.o(($event) => setBg(c), c)
          };
        }),
        v: common_vendor.t(config.fontSizeRpx),
        w: config.fontSizeRpx,
        x: common_vendor.o(onFontSize),
        y: common_vendor.o(onFontSize),
        z: common_vendor.t(speedLabel.value),
        A: displaySpeedSec.value,
        B: common_vendor.o(onSpeed),
        C: common_vendor.o(onSpeed),
        D: config.direction === "ltr" ? 1 : "",
        E: common_vendor.o(($event) => config.direction = "ltr"),
        F: config.direction === "rtl" ? 1 : "",
        G: common_vendor.o(($event) => config.direction = "rtl"),
        H: common_vendor.t(common_vendor.unref(effectLabels)[effectIndex.value]),
        I: common_vendor.unref(effectLabels),
        J: effectIndex.value,
        K: common_vendor.o(onEffectPick),
        L: !history.value.length
      }, !history.value.length ? {} : {
        M: common_vendor.f(history.value, (h, i, i0) => {
          return {
            a: common_vendor.t(h),
            b: i,
            c: common_vendor.o(($event) => config.text = h, i)
          };
        })
      }, {
        N: config.keepScreenOn,
        O: common_vendor.o(onKeepScreen),
        P: config.maxBrightness,
        Q: common_vendor.o(onMaxBright),
        R: common_vendor.t(premium.bgImage ? "" : rewardedOn.value ? "" : ""),
        S: common_vendor.o(pickBgImage),
        T: common_vendor.o(clearBgImage),
        U: config.waterfallMode,
        V: common_vendor.o(onWaterfallToggle),
        W: config.waterfallMode
      }, config.waterfallMode ? {
        X: common_vendor.t(config.waterfallLines),
        Y: config.waterfallLines,
        Z: common_vendor.o(onWaterfallLines),
        aa: common_vendor.o(onWaterfallLines)
      } : {}) : {}, {
        ab: common_vendor.o(goPlay),
        ac: common_vendor.t(customOpen.value ? "收起设置" : "更多设置"),
        ad: common_vendor.o(toggleCustomOpen)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map

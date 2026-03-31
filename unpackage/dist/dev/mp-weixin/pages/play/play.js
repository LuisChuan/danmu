"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_barrage = require("../../utils/barrage.js");
const _sfc_main = {
  __name: "play",
  setup(__props) {
    const cfg = common_vendor.reactive(utils_barrage.mergeConfig({}));
    const playing = common_vendor.ref(true);
    const showHud = common_vendor.ref(false);
    const displayText = common_vendor.ref("手持弹幕");
    let hudTimer = null;
    const savedBrightness = common_vendor.ref(0.55);
    let brightnessSaved = false;
    const canvasW = common_vendor.ref(300);
    const canvasH = common_vendor.ref(500);
    const stageOuterStyle = common_vendor.computed(() => {
      const bg = cfg.bgTransparent ? "#000000" : cfg.bgColor;
      return { backgroundColor: bg };
    });
    const textStyle = common_vendor.computed(() => ({
      color: cfg.textColor,
      fontSize: cfg.fontSizeRpx + "rpx",
      fontWeight: "700"
    }));
    const trackStyle = common_vendor.computed(() => ({
      animationDuration: Math.max(4, cfg.speedSec) + "s"
    }));
    const lineCount = common_vendor.computed(() => Math.max(2, Math.min(6, Number(cfg.waterfallLines) || 3)));
    const dirClass = common_vendor.computed(() => cfg.direction === "rtl" ? "dir-rtl" : "");
    function rowDirClass(rowIndex) {
      const reverseByRow = rowIndex % 2 === 0;
      if (cfg.direction === "rtl")
        return reverseByRow ? "" : "dir-rtl";
      return reverseByRow ? "dir-rtl" : "";
    }
    function rowTrackStyle(rowIndex) {
      const base = Math.max(4, Number(cfg.speedSec) || 12);
      const offset = (rowIndex - 1) % 3 * 1.2;
      return {
        animationDuration: base + offset + "s"
      };
    }
    const effectClass = common_vendor.computed(() => {
      const m = {
        none: "",
        blink: "fx-blink",
        neon: "fx-neon",
        stroke: "fx-stroke"
      };
      return m[cfg.effect] || "";
    });
    function applyHardware() {
      if (cfg.keepScreenOn) {
        common_vendor.index.setKeepScreenOn({ keepScreenOn: true });
      } else {
        common_vendor.index.setKeepScreenOn({ keepScreenOn: false });
      }
      if (cfg.maxBrightness) {
        if (!brightnessSaved) {
          common_vendor.index.getScreenBrightness({
            success: (res) => {
              if (typeof res.value === "number")
                savedBrightness.value = res.value;
              brightnessSaved = true;
              common_vendor.index.setScreenBrightness({ value: 1 });
            },
            fail: () => {
              brightnessSaved = true;
              common_vendor.index.setScreenBrightness({ value: 1 });
            }
          });
        } else {
          common_vendor.index.setScreenBrightness({ value: 1 });
        }
      } else if (brightnessSaved) {
        common_vendor.index.setScreenBrightness({ value: savedBrightness.value });
      }
    }
    function syncWindowSize() {
      const sys = common_vendor.index.getSystemInfoSync();
      canvasW.value = sys.windowWidth || 375;
      canvasH.value = sys.windowHeight || 667;
    }
    common_vendor.onLoad((options) => {
      syncWindowSize();
      if (options && options.d) {
        let raw = String(options.d);
        try {
          raw = decodeURIComponent(raw);
        } catch (e) {
        }
        const decoded = utils_barrage.decodeTemplateShare(raw);
        if (decoded) {
          Object.assign(cfg, decoded);
          utils_barrage.savePlayConfig({ ...cfg });
        }
      } else {
        Object.assign(cfg, utils_barrage.loadPlayConfig());
      }
      const t = (cfg.text || "").trim();
      displayText.value = t || " ";
      applyHardware();
    });
    common_vendor.onReady(() => {
      syncWindowSize();
    });
    common_vendor.onShow(() => {
      syncWindowSize();
      applyHardware();
    });
    common_vendor.onHide(() => {
      common_vendor.index.setKeepScreenOn({ keepScreenOn: false });
    });
    common_vendor.onUnload(() => {
      common_vendor.index.setKeepScreenOn({ keepScreenOn: false });
      if (brightnessSaved) {
        common_vendor.index.setScreenBrightness({ value: savedBrightness.value });
      }
    });
    common_vendor.onUnmounted(() => {
      if (hudTimer)
        clearTimeout(hudTimer);
    });
    function onStageTap() {
      showHud.value = !showHud.value;
      if (hudTimer)
        clearTimeout(hudTimer);
      if (showHud.value) {
        hudTimer = setTimeout(() => {
          showHud.value = false;
          hudTimer = null;
        }, 5e3);
      }
    }
    function togglePlay() {
      playing.value = !playing.value;
    }
    function clearScreen() {
      displayText.value = " ";
      cfg.text = " ";
      utils_barrage.savePlayConfig({ ...cfg });
      common_vendor.index.showToast({ title: "已清屏", icon: "none" });
    }
    function exitPlay() {
      const stack = typeof getCurrentPages === "function" ? getCurrentPages() : [];
      if (stack.length > 1) {
        common_vendor.index.navigateBack({ delta: 1 });
      } else {
        common_vendor.index.reLaunch({ url: "/pages/index/index" });
      }
    }
    function toggleKeepScreen() {
      cfg.keepScreenOn = !cfg.keepScreenOn;
      utils_barrage.savePlayConfig({ ...cfg });
      applyHardware();
      common_vendor.index.showToast({ title: cfg.keepScreenOn ? "已常亮" : "已关闭常亮", icon: "none" });
    }
    function toggleBrightness() {
      cfg.maxBrightness = !cfg.maxBrightness;
      utils_barrage.savePlayConfig({ ...cfg });
      applyHardware();
      common_vendor.index.showToast({ title: cfg.maxBrightness ? "已调至最亮" : "已恢复亮度", icon: "none" });
    }
    function snapshot() {
      const inst = common_vendor.getCurrentInstance();
      const ctx = common_vendor.index.createCanvasContext("snapCanvas", inst == null ? void 0 : inst.proxy);
      const w = canvasW.value;
      const h = canvasH.value;
      const bg = cfg.bgTransparent ? "#000000" : cfg.bgColor;
      const fs = Math.max(14, Math.round(cfg.fontSizeRpx * w / 750));
      const txt = (displayText.value || "").trim() || "手持弹幕";
      ctx.setFillStyle(bg);
      ctx.fillRect(0, 0, w, h);
      if (cfg.bgImage) {
        try {
          ctx.drawImage(cfg.bgImage, 0, 0, w, h);
        } catch (e) {
        }
        ctx.setFillStyle("rgba(0,0,0,0.25)");
        ctx.fillRect(0, 0, w, h);
      }
      ctx.setFillStyle(cfg.textColor);
      ctx.setFontSize(fs);
      ctx.setTextAlign("center");
      ctx.setTextBaseline("middle");
      ctx.fillText(txt, w / 2, h / 2);
      ctx.draw(false, () => {
        common_vendor.index.canvasToTempFilePath(
          {
            canvasId: "snapCanvas",
            success: (res) => {
              const p = res.tempFilePath;
              if (typeof common_vendor.wx$1 !== "undefined" && common_vendor.wx$1.showShareImageMenu) {
                common_vendor.wx$1.showShareImageMenu({
                  path: p,
                  success: () => {
                  },
                  fail: () => fallbackShareImage(p)
                });
                return;
              }
              fallbackShareImage(p);
            },
            fail: () => {
              common_vendor.index.showToast({ title: "截图失败", icon: "none" });
            }
          },
          inst == null ? void 0 : inst.proxy
        );
      });
    }
    function fallbackShareImage(path) {
      common_vendor.index.saveImageToPhotosAlbum({
        filePath: path,
        success: () => common_vendor.index.showToast({ title: "已保存到相册", icon: "success" }),
        fail: () => {
          common_vendor.index.previewImage({ urls: [path] });
        }
      });
    }
    common_vendor.onShareAppMessage(() => ({
      title: "手持弹幕",
      path: "/pages/play/play?d=" + encodeURIComponent(utils_barrage.encodeTemplateShare({ ...cfg }))
    }));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: cfg.bgImage
      }, cfg.bgImage ? {
        b: cfg.bgImage
      } : {}, {
        c: !cfg.waterfallMode
      }, !cfg.waterfallMode ? {
        d: common_vendor.t(displayText.value),
        e: common_vendor.s(textStyle.value),
        f: common_vendor.t(displayText.value),
        g: common_vendor.s(textStyle.value),
        h: common_vendor.n(dirClass.value),
        i: common_vendor.n(effectClass.value),
        j: common_vendor.n(playing.value ? "playing" : "paused"),
        k: common_vendor.s(trackStyle.value)
      } : {
        l: common_vendor.f(lineCount.value, (n, k0, i0) => {
          return {
            a: common_vendor.n(rowDirClass(n)),
            b: common_vendor.s(rowTrackStyle(n)),
            c: n
          };
        }),
        m: common_vendor.t(displayText.value),
        n: common_vendor.s(textStyle.value),
        o: common_vendor.t(displayText.value),
        p: common_vendor.s(textStyle.value),
        q: common_vendor.n(effectClass.value),
        r: common_vendor.n(playing.value ? "playing" : "paused")
      }, {
        s: showHud.value
      }, showHud.value ? {
        t: common_vendor.t(playing.value ? "暂停" : "播放"),
        v: common_vendor.o(togglePlay),
        w: common_vendor.o(clearScreen),
        x: common_vendor.o(snapshot),
        y: common_vendor.t(cfg.keepScreenOn ? "已常亮" : "常亮"),
        z: common_vendor.o(toggleKeepScreen),
        A: common_vendor.t(cfg.maxBrightness ? "恢复亮度" : "最亮"),
        B: common_vendor.o(toggleBrightness),
        C: common_vendor.o(exitPlay),
        D: common_vendor.o(() => {
        })
      } : {}, {
        E: canvasW.value + "px",
        F: canvasH.value + "px",
        G: canvasW.value,
        H: canvasH.value,
        I: common_vendor.s(stageOuterStyle.value),
        J: common_vendor.o(onStageTap)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-edf5a525"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/play/play.js.map

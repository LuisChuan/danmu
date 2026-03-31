"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "about",
  setup(__props) {
    function copyWeixin() {
      common_vendor.index.setClipboardData({
        data: "Obsession-0214",
        success: () => common_vendor.index.showToast({ title: "微信号已复制", icon: "success" })
      });
    }
    function goIndex() {
      common_vendor.index.navigateBack({
        fail() {
          common_vendor.index.reLaunch({ url: "/pages/index/index" });
        }
      });
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(copyWeixin),
        b: common_assets._imports_0,
        c: common_vendor.o(goIndex)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-13a78ac6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/about/about.js.map

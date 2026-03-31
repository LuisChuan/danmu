"use strict";
function isRewardAdConfigured() {
  const id = String("").trim().toLowerCase();
  if (!id)
    return false;
  if (id.includes("xxxx"))
    return false;
  if (id === "adunit-placeholder" || id === "adunit-test")
    return false;
  return true;
}
exports.isRewardAdConfigured = isRewardAdConfigured;
//# sourceMappingURL=../../.sourcemap/mp-weixin/config/ad.config.js.map

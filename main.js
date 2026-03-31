import App from './App';
import { REWARDED_VIDEO_AD_UNIT } from './config/ad.config.js';

const REWARDED_AD_UNIT_ID = REWARDED_VIDEO_AD_UNIT;
if (REWARDED_AD_UNIT_ID) {
  try {
    uni.setStorageSync('rewarded_ad_unit_id', REWARDED_AD_UNIT_ID);
  } catch (e) {}
}

// #ifndef VUE3
import Vue from 'vue';
import './uni.promisify.adaptor';
Vue.config.productionTip = false;
App.mpType = 'app';
const app = new Vue({
  ...App
});
app.$mount();
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue';
export function createApp() {
  const app = createSSRApp(App);
  return {
    app
  };
}
// #endif

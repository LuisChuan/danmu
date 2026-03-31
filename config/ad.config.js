export const REWARDED_VIDEO_AD_UNIT = '';
export function isRewardAdConfigured() {
  const id = String(REWARDED_VIDEO_AD_UNIT || '')
    .trim()
    .toLowerCase();
  if (!id) return false;
  if (id.includes('xxxx')) return false;
  if (id === 'adunit-placeholder' || id === 'adunit-test') return false;
  return true;
}

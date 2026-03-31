<template>
	<view class="play-root" :style="stageOuterStyle" @tap="onStageTap">
		<view v-if="cfg.bgImage" class="bg-image-layer">
			<image :src="cfg.bgImage" mode="aspectFill" class="bg-image"></image>
		</view>
		<view v-if="!cfg.waterfallMode" class="marquee-layer">
			<view class="marquee-box">
				<view
					class="marquee-track"
					:class="[dirClass, effectClass, playing ? 'playing' : 'paused']"
					:style="trackStyle"
				>
					<text class="marquee-txt" :style="textStyle">{{ displayText }}</text>
					<text class="marquee-txt" :style="textStyle">{{ displayText }}</text>
				</view>
			</view>
		</view>
		<view v-else class="waterfall-layer">
			<view v-for="n in lineCount" :key="n" class="wf-row">
				<view
					class="marquee-track"
					:class="[rowDirClass(n), effectClass, playing ? 'playing' : 'paused']"
					:style="rowTrackStyle(n)"
				>
					<text class="marquee-txt" :style="textStyle">{{ displayText }}</text>
					<text class="marquee-txt" :style="textStyle">{{ displayText }}</text>
				</view>
			</view>
		</view>

		<view v-if="showHud" class="hud safe-area" @tap.stop>
			<view class="hud-row">
				<button class="hud-btn" size="mini" @tap="togglePlay">{{ playing ? '暂停' : '播放' }}</button>
				<button class="hud-btn" size="mini" @tap="clearScreen">清屏</button>
				<button class="hud-btn" size="mini" @tap="snapshot">截图分享</button>
			</view>
			<view class="hud-row">
				<button class="hud-btn" size="mini" @tap="toggleKeepScreen">
					{{ cfg.keepScreenOn ? '已常亮' : '常亮' }}
				</button>
				<button class="hud-btn" size="mini" @tap="toggleBrightness">
					{{ cfg.maxBrightness ? '恢复亮度' : '最亮' }}
				</button>
				<button class="hud-btn" size="mini" type="warn" @tap="exitPlay">退出</button>
			</view>
			<text class="hud-tip">轻触屏幕显示/隐藏控制条</text>
		</view>

		<canvas
			canvas-id="snapCanvas"
			id="snapCanvas"
			class="snap-canvas"
			:style="{ width: canvasW + 'px', height: canvasH + 'px' }"
			:width="canvasW"
			:height="canvasH"
		/>
	</view>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { onLoad, onReady, onShow, onHide, onUnload, onShareAppMessage } from '@dcloudio/uni-app'
import { getCurrentInstance } from 'vue'
import {
	loadPlayConfig,
	savePlayConfig,
	mergeConfig,
	decodeTemplateShare,
	encodeTemplateShare
} from '../../utils/barrage.js'

const cfg = reactive(mergeConfig({}))
const playing = ref(true)
const showHud = ref(false)
const displayText = ref('手持弹幕')

let hudTimer = null
const savedBrightness = ref(0.55)
let brightnessSaved = false

const canvasW = ref(300)
const canvasH = ref(500)

const stageOuterStyle = computed(() => {
	const bg = cfg.bgTransparent ? '#000000' : cfg.bgColor
	return { backgroundColor: bg }
})

const textStyle = computed(() => ({
	color: cfg.textColor,
	fontSize: cfg.fontSizeRpx + 'rpx',
	fontWeight: '700'
}))

const trackStyle = computed(() => ({
	animationDuration: Math.max(4, cfg.speedSec) + 's'
}))
const lineCount = computed(() => Math.max(2, Math.min(6, Number(cfg.waterfallLines) || 3)))

const dirClass = computed(() => (cfg.direction === 'rtl' ? 'dir-rtl' : ''))

function rowDirClass(rowIndex) {
	const reverseByRow = rowIndex % 2 === 0
	if (cfg.direction === 'rtl') return reverseByRow ? '' : 'dir-rtl'
	return reverseByRow ? 'dir-rtl' : ''
}

function rowTrackStyle(rowIndex) {
	const base = Math.max(4, Number(cfg.speedSec) || 12)
	const offset = ((rowIndex - 1) % 3) * 1.2
	return {
		animationDuration: base + offset + 's'
	}
}

const effectClass = computed(() => {
	const m = {
		none: '',
		blink: 'fx-blink',
		neon: 'fx-neon',
		stroke: 'fx-stroke'
	}
	return m[cfg.effect] || ''
})

function applyHardware() {
	if (cfg.keepScreenOn) {
		uni.setKeepScreenOn({ keepScreenOn: true })
	} else {
		uni.setKeepScreenOn({ keepScreenOn: false })
	}
	if (cfg.maxBrightness) {
		if (!brightnessSaved) {
			uni.getScreenBrightness({
				success: (res) => {
					if (typeof res.value === 'number') savedBrightness.value = res.value
					brightnessSaved = true
					uni.setScreenBrightness({ value: 1 })
				},
				fail: () => {
					brightnessSaved = true
					uni.setScreenBrightness({ value: 1 })
				}
			})
		} else {
			uni.setScreenBrightness({ value: 1 })
		}
	} else if (brightnessSaved) {
		uni.setScreenBrightness({ value: savedBrightness.value })
	}
}

function syncWindowSize() {
	const sys = uni.getSystemInfoSync()
	canvasW.value = sys.windowWidth || 375
	canvasH.value = sys.windowHeight || 667
}

onLoad((options) => {
	syncWindowSize()

	if (options && options.d) {
		let raw = String(options.d)
		try {
			raw = decodeURIComponent(raw)
		} catch (e) {}
		const decoded = decodeTemplateShare(raw)
		if (decoded) {
			Object.assign(cfg, decoded)
			savePlayConfig({ ...cfg })
		}
	} else {
		Object.assign(cfg, loadPlayConfig())
	}
	const t = (cfg.text || '').trim()
	displayText.value = t || ' '
	applyHardware()
})

onReady(() => {
	syncWindowSize()
})

onShow(() => {
	syncWindowSize()
	applyHardware()
})

onHide(() => {
	uni.setKeepScreenOn({ keepScreenOn: false })
})

onUnload(() => {
	uni.setKeepScreenOn({ keepScreenOn: false })
	if (brightnessSaved) {
		uni.setScreenBrightness({ value: savedBrightness.value })
	}
})

onUnmounted(() => {
	if (hudTimer) clearTimeout(hudTimer)
})

function onStageTap() {
	showHud.value = !showHud.value
	if (hudTimer) clearTimeout(hudTimer)
	if (showHud.value) {
		hudTimer = setTimeout(() => {
			showHud.value = false
			hudTimer = null
		}, 5000)
	}
}

function togglePlay() {
	playing.value = !playing.value
}

function clearScreen() {
	displayText.value = ' '
	cfg.text = ' '
	savePlayConfig({ ...cfg })
	uni.showToast({ title: '已清屏', icon: 'none' })
}

function exitPlay() {
	const stack = typeof getCurrentPages === 'function' ? getCurrentPages() : []
	if (stack.length > 1) {
		uni.navigateBack({ delta: 1 })
	} else {
		uni.reLaunch({ url: '/pages/index/index' })
	}
}

function toggleKeepScreen() {
	cfg.keepScreenOn = !cfg.keepScreenOn
	savePlayConfig({ ...cfg })
	applyHardware()
	uni.showToast({ title: cfg.keepScreenOn ? '已常亮' : '已关闭常亮', icon: 'none' })
}

function toggleBrightness() {
	cfg.maxBrightness = !cfg.maxBrightness
	savePlayConfig({ ...cfg })
	applyHardware()
	uni.showToast({ title: cfg.maxBrightness ? '已调至最亮' : '已恢复亮度', icon: 'none' })
}

function snapshot() {
	const inst = getCurrentInstance()
	const ctx = uni.createCanvasContext('snapCanvas', inst?.proxy)
	const w = canvasW.value
	const h = canvasH.value
	const bg = cfg.bgTransparent ? '#000000' : cfg.bgColor
	const fs = Math.max(14, Math.round((cfg.fontSizeRpx * w) / 750))
	const txt = (displayText.value || '').trim() || '手持弹幕'

	ctx.setFillStyle(bg)
	ctx.fillRect(0, 0, w, h)
	if (cfg.bgImage) {
		try {
			ctx.drawImage(cfg.bgImage, 0, 0, w, h)
		} catch (e) {}
		ctx.setFillStyle('rgba(0,0,0,0.25)')
		ctx.fillRect(0, 0, w, h)
	}
	ctx.setFillStyle(cfg.textColor)
	ctx.setFontSize(fs)
	ctx.setTextAlign('center')
	ctx.setTextBaseline('middle')
	ctx.fillText(txt, w / 2, h / 2)
	ctx.draw(false, () => {
		uni.canvasToTempFilePath(
			{
				canvasId: 'snapCanvas',
				success: (res) => {
					const p = res.tempFilePath
					// #ifdef MP-WEIXIN
					if (typeof wx !== 'undefined' && wx.showShareImageMenu) {
						wx.showShareImageMenu({
							path: p,
							success: () => {},
							fail: () => fallbackShareImage(p)
						})
						return
					}
					// #endif
					fallbackShareImage(p)
				},
				fail: () => {
					uni.showToast({ title: '截图失败', icon: 'none' })
				}
			},
			inst?.proxy
		)
	})
}

function fallbackShareImage(path) {
	uni.saveImageToPhotosAlbum({
		filePath: path,
		success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
		fail: () => {
			uni.previewImage({ urls: [path] })
		}
	})
}

onShareAppMessage(() => ({
	title: '手持弹幕',
	path: '/pages/play/play?d=' + encodeURIComponent(encodeTemplateShare({ ...cfg }))
}))
</script>

<style scoped>
.play-root {
	--ink: #080808;
	--panel: rgba(222, 245, 255, 0.88);
	--panel-border: #080808;
	--yellow-glow: #fff3a6;
	--blue-main: #9ee2ff;
	--blue-deep: #70c8f8;
	position: relative;
	width: 100%;
	min-height: 100vh;
	overflow: hidden;
}

.bg-image-layer {
	position: absolute;
	inset: 0;
}

.bg-image {
	width: 100%;
	height: 100%;
}

.marquee-layer {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.waterfall-layer {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	overflow: hidden;
}

.wf-row {
	width: 100%;
	overflow: hidden;
}

.marquee-box {
	width: 100%;
	overflow: hidden;
}

.marquee-track {
	display: inline-flex;
	flex-direction: row;
	flex-wrap: nowrap;
	white-space: nowrap;
	animation: marquee-scroll linear infinite;
	position: relative;
}

.marquee-track.paused {
	animation-play-state: paused;
}

@keyframes marquee-scroll {
	0% {
		transform: translateX(0);
	}
	100% {
		transform: translateX(-50%);
	}
}

.marquee-track.dir-rtl {
	animation-direction: reverse;
}

.marquee-txt {
	flex-shrink: 0;
	padding-right: 100rpx;
	text-shadow: 0 2rpx 0 rgba(255, 255, 255, 0.62);
}

.fx-blink .marquee-txt {
	animation: txt-blink 1.2s ease infinite;
}

@keyframes txt-blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.35;
	}
}

.fx-neon .marquee-txt {
	text-shadow: 0 0 10rpx #fff, 0 0 22rpx var(--yellow-glow), 0 0 40rpx currentColor;
}

.fx-stroke .marquee-txt {
	-webkit-text-stroke: 3rpx #000;
}

.hud {
	position: absolute;
	left: 0;
	right: 0;
	padding: 16rpx 24rpx 32rpx;
	background: linear-gradient(180deg, rgba(250, 234, 146, 0.9), rgba(250, 234, 146, 0));
}

.safe-area {
	padding-top: calc(16rpx + env(safe-area-inset-top));
	padding-left: calc(16rpx + env(safe-area-inset-left));
	padding-right: calc(16rpx + env(safe-area-inset-right));
}

.hud-row {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-bottom: 12rpx;
}

.hud-btn {
	min-width: 160rpx;
	background: linear-gradient(135deg, var(--blue-main), var(--blue-deep));
	color: #0a0a0a;
	border: 5rpx solid var(--panel-border);
	border-radius: 20rpx;
	box-shadow: 0 8rpx 0 rgba(0, 0, 0, 0.86), 0 10rpx 22rpx rgba(112, 200, 248, 0.28);
	animation: hud-breathe 1.8s ease-in-out infinite;
}

.hud-btn[type='warn'] {
	background: linear-gradient(135deg, #ffe7ad, #ffd577);
	border: 5rpx solid var(--panel-border);
	box-shadow: 0 8rpx 0 rgba(0, 0, 0, 0.86), 0 10rpx 22rpx rgba(255, 211, 112, 0.24);
}

.hud-tip {
	font-size: 22rpx;
	color: rgba(8, 8, 8, 0.85);
	font-weight: 600;
}

.hud-btn:active {
	transform: translateY(4rpx);
	box-shadow: 0 4rpx 0 rgba(0, 0, 0, 0.86);
}

.snap-canvas {
	position: fixed;
	left: -9999px;
	top: 0;
}

@keyframes hud-breathe {
	0%,
	100% {
		filter: drop-shadow(0 0 0 rgba(255, 248, 184, 0));
	}
	50% {
		filter: drop-shadow(0 0 16rpx rgba(255, 248, 184, 0.88));
	}
}
</style>

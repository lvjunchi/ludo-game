// 情侣飞行棋 - 音效系统

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playOsc(freq, type, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.08;
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const SOUND_CONFIG = {
  dice:  { freq: 800, type: "square",   dur: 0.12 },
  move:  { freq: 500, type: "sine",     dur: 0.08 },
  event: { freq: 600, type: "triangle", dur: 0.25 },
  win:   { freq: 523, type: "sine",     dur: 0.6, followUp: { freq: 659, type: "sine", dur: 0.5, delay: 200 } },
};

function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const cfg = SOUND_CONFIG[type];
    if (!cfg) return;
    playOsc(cfg.freq, cfg.type, cfg.dur);
    if (cfg.followUp) {
      const f = cfg.followUp;
      setTimeout(() => playOsc(f.freq, f.type, f.dur), f.delay);
    }
  } catch (e) {}
}

// 骰子滚动嘀嗒声 — 噪声+带通滤波模拟塑料碰撞声
let tickInterval = null;

function playDiceTick() {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * 0.035;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.2));
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500 + Math.random() * 2000;
    filter.Q.value = 2;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.06;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
  } catch (e) {}
}

function startDiceTicks(count) {
  let i = 0;
  tickInterval = setInterval(() => {
    if (i >= count) { clearInterval(tickInterval); tickInterval = null; return; }
    playDiceTick();
    i++;
  }, 85);
}

function stopDiceTicks() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
}

function vibrate(pattern) {
  try { navigator.vibrate(pattern); } catch (e) {}
}

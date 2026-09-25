// 声の解析
//
// 録音した音は端末の中だけで処理する。どこにも送らない。
// 判定に使うのは「時間の情報」だけ（高さ・抑揚・テンポ・間）。
// マイクの性能で値が変わってしまう音色の情報は、参考値の「通りやすさ」にとどめる。

// ── 判定の境目（実データを見ながらここだけ直せばよい） ─────────
export const THRESHOLDS = {
  highHz: 170, // これより高ければ H、低ければ L
  dynamicSemitone: 3.5, // 声の高さの振れ幅（半音）。超えれば D、下回れば E
  fastRate: 5.4, // 1秒あたりの音節数。超えれば F、下回れば S
  continuousPause: 0.18, // 無音の割合。下回れば C（詰める）、超えれば B（間を置く）
};

const SR = 16000; // 解析用に16kHzへ落とす
const FRAME = 1024; // 64ms
const HOP = 256; // 16ms
const MIN_HZ = 70;
const MAX_HZ = 500;

/** 任意のサンプリングレートのモノラル波形を16kHzへ落とす */
function downsample(input, inputRate) {
  if (inputRate === SR) return input;
  const ratio = inputRate / SR;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

/** AudioBuffer をモノラルの配列にする */
function toMono(buffer) {
  const ch = buffer.numberOfChannels;
  if (ch === 1) return buffer.getChannelData(0);
  const a = buffer.getChannelData(0);
  const b = buffer.getChannelData(1);
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) / 2;
  return out;
}

/** 自己相関で1フレームの高さを取る。倍音を拾わないよう最初のピークを採る */
function detectPitch(x, offset) {
  let power = 0;
  for (let i = 0; i < FRAME; i++) power += x[offset + i] * x[offset + i];
  if (power < 1e-6) return 0;

  const minLag = Math.floor(SR / MAX_HZ);
  const maxLag = Math.floor(SR / MIN_HZ);
  const n = FRAME - maxLag;
  if (n < 256) return 0;

  const corr = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0;
    let d1 = 0;
    let d2 = 0;
    for (let i = 0; i < n; i++) {
      const a = x[offset + i];
      const b = x[offset + i + lag];
      num += a * b;
      d1 += a * a;
      d2 += b * b;
    }
    const den = Math.sqrt(d1 * d2);
    corr[lag] = den > 0 ? num / den : 0;
  }

  let best = 0;
  let bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (corr[lag] > best) {
      best = corr[lag];
      bestLag = lag;
    }
  }
  if (best < 0.62) return 0; // 声として扱わない

  // 最初にしきい値を超えた山を採って、1オクターブ下に落ちるのを防ぐ
  const limit = best * 0.87;
  for (let lag = minLag; lag <= maxLag - 1; lag++) {
    if (corr[lag] >= limit && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) {
      bestLag = lag;
      break;
    }
  }
  return SR / bestLag;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function quantile(arr, q) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** 値を0〜100の点数に直す */
function score(value, lo, hi) {
  return Math.round(clamp01((value - lo) / (hi - lo)) * 100);
}

/**
 * 境目がちょうど50になるように0〜100へ直す。
 * 境目の左右で別々に伸ばすので、バーの向きと判定（高め／低めなど）が必ず一致する。
 */
function scoreAround(value, lo, mid, hi) {
  if (value < mid) return Math.min(49, Math.round(clamp01((value - lo) / (mid - lo)) * 50));
  return Math.max(50, Math.round(50 + clamp01((value - mid) / (hi - mid)) * 50));
}

/**
 * 録音を解析する
 * @param {AudioBuffer} buffer 録音した音
 * @param {number} noiseFloor 録音前に測った部屋の騒音（0〜1）
 */
export function analyze(buffer, noiseFloor = 0.002) {
  const x = downsample(toMono(buffer), buffer.sampleRate);
  const frames = Math.max(0, Math.floor((x.length - FRAME) / HOP));
  if (frames < 30) return null; // 短すぎる

  const rms = new Float32Array(frames);
  const zcr = new Float32Array(frames);
  const f0 = new Float32Array(frames);

  for (let f = 0; f < frames; f++) {
    const off = f * HOP;
    let sum = 0;
    let cross = 0;
    for (let i = 0; i < FRAME; i++) {
      const v = x[off + i];
      sum += v * v;
      if (i > 0 && (v >= 0) !== (x[off + i - 1] >= 0)) cross++;
    }
    rms[f] = Math.sqrt(sum / FRAME);
    zcr[f] = cross / FRAME;
    f0[f] = f % 2 === 0 ? detectPitch(x, off) : 0; // 32msごとに高さを測る
  }

  // 声が出ている区間のしきい値
  const peakRms = Math.max(...rms);
  const voiceGate = Math.max(noiseFloor * 2.5, peakRms * 0.12);

  const voicedRms = [];
  for (let f = 0; f < frames; f++) if (rms[f] > voiceGate) voicedRms.push(rms[f]);
  if (voicedRms.length < 20) return null; // 声が入っていない

  const pitches = [];
  for (let f = 0; f < frames; f++) if (f0[f] > 0 && rms[f] > voiceGate) pitches.push(f0[f]);
  if (pitches.length < 10) return null;

  // 前後の無音を除いた長さ
  let first = 0;
  let last = frames - 1;
  while (first < frames && rms[first] <= voiceGate) first++;
  while (last > first && rms[last] <= voiceGate) last--;
  const usedFrames = last - first + 1;
  const totalSec = (usedFrames * HOP) / SR;

  // ── 高さ ──────────────────────────────
  const f0Median = median(pitches);

  // ── 抑揚（高さの振れ幅を半音で見る） ────────
  const lo = quantile(pitches, 0.1);
  const hi = quantile(pitches, 0.9);
  const spreadSemitone = lo > 0 ? 12 * Math.log2(hi / lo) : 0;

  // ── 間（250ms以上の無音が占める割合） ───────
  const pauseMinFrames = Math.round(0.25 * SR / HOP);
  let pauseFrames = 0;
  let run = 0;
  for (let f = first; f <= last; f++) {
    if (rms[f] <= voiceGate) {
      run++;
    } else {
      if (run >= pauseMinFrames) pauseFrames += run;
      run = 0;
    }
  }
  if (run >= pauseMinFrames) pauseFrames += run;
  const pauseRatio = pauseFrames / usedFrames;

  // ── テンポ（音節の山を数えて、話している時間で割る） ──
  const smooth = new Float32Array(frames);
  const win = 3;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    let cnt = 0;
    for (let k = -win; k <= win; k++) {
      const idx = f + k;
      if (idx >= 0 && idx < frames) {
        sum += rms[idx];
        cnt++;
      }
    }
    smooth[f] = sum / cnt;
  }
  const meanVoiced = voicedRms.reduce((a, b) => a + b, 0) / voicedRms.length;
  const peakGate = Math.max(voiceGate, meanVoiced * 0.55);
  const minDistance = Math.round(0.1 * SR / HOP); // 100ms以内の山は数えない
  let syllables = 0;
  let lastPeak = -minDistance;
  for (let f = first + 1; f < last; f++) {
    if (
      smooth[f] > peakGate &&
      smooth[f] >= smooth[f - 1] &&
      smooth[f] > smooth[f + 1] &&
      f - lastPeak >= minDistance
    ) {
      syllables++;
      lastPeak = f;
    }
  }
  const speechSec = Math.max(0.5, totalSec * (1 - pauseRatio));
  const syllableRate = syllables / speechSec;

  // ── 通りやすさ（参考値。マイクの影響を受ける） ──
  let zcrSum = 0;
  let zcrCount = 0;
  for (let f = first; f <= last; f++) {
    if (rms[f] > voiceGate) {
      zcrSum += zcr[f];
      zcrCount++;
    }
  }
  const brightness = zcrCount ? zcrSum / zcrCount : 0;

  // ── 声の揺れ（デバッグ用。判定には使わない） ──
  const seq = [];
  for (let f = 0; f < frames; f++) if (f0[f] > 0 && rms[f] > voiceGate) seq.push(f0[f]);
  let jitter = 0;
  for (let i = 1; i < seq.length; i++) jitter += Math.abs(1200 * Math.log2(seq[i] / seq[i - 1]));
  jitter = seq.length > 1 ? jitter / (seq.length - 1) : 0;

  const axes = {
    high: f0Median >= THRESHOLDS.highHz,
    dynamic: spreadSemitone >= THRESHOLDS.dynamicSemitone,
    fast: syllableRate >= THRESHOLDS.fastRate,
    continuous: pauseRatio < THRESHOLDS.continuousPause,
  };

  return {
    axes,
    raw: {
      f0Median: Math.round(f0Median),
      spreadSemitone: Number(spreadSemitone.toFixed(2)),
      syllableRate: Number(syllableRate.toFixed(2)),
      pauseRatio: Number(pauseRatio.toFixed(3)),
      brightness: Number(brightness.toFixed(4)),
      jitterCents: Math.round(jitter),
      noiseFloor: Number(noiseFloor.toFixed(5)),
      durationSec: Number(totalSec.toFixed(1)),
      syllables,
    },
    scores: {
      高さ: scoreAround(Math.log2(Math.max(60, f0Median)), Math.log2(90), Math.log2(THRESHOLDS.highHz), Math.log2(330)),
      抑揚: scoreAround(spreadSemitone, 0.5, THRESHOLDS.dynamicSemitone, 8),
      テンポ: scoreAround(syllableRate, 3.0, THRESHOLDS.fastRate, 8.5),
      間: scoreAround(pauseRatio, 0, THRESHOLDS.continuousPause, 0.4),
      通りやすさ: score(brightness, 0.03, 0.16),
    },
  };
}

/** 部屋の騒音を測る（録音の冒頭1秒を渡す） */
export function measureNoise(buffer) {
  const x = toMono(buffer);
  const n = Math.min(x.length, buffer.sampleRate);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += x[i] * x[i];
  return Math.sqrt(sum / Math.max(1, n));
}

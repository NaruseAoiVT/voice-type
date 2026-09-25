// 画面の進行
//
// はじめに → 部屋の音を測る → 録音 → 聞き返す → 質問（1問ずつ）→ 結果

import { TYPES, GROUPS, AXES, CODES, toCode, label } from './types.js';
import { analyze } from './analyze.js';
import { QUESTIONS, GOAL_ADVICE, goalFit } from './questions.js';
import { ALL_SCRIPTS, WORKS, toRubyHtml, toPlain } from './scripts.js';
import { shareText } from './share.js';
import { art } from './art.js';
import {
  decideCapsule,
  decidePattern,
  pickGear,
  storeLinks,
  amazonLink,
  BANDS,
  CAPSULE_GUIDE,
} from './gear.js';

const SITE = 'https://naruseaoivt.github.io/voice-type';
const DEBUG = new URLSearchParams(location.search).has('debug');

const state = {
  stream: null,
  ctx: null,
  noiseFloor: 0.002,
  samples: null, // Float32Array（録音した波形）
  sampleRate: 48000,
  answers: {},
  qIndex: 0,
  advancing: false,
  scriptId: 'stream', // 読み上げる文章
  result: null,
};

const $ = (id) => document.getElementById(id);

// 画面ごとの進み具合（％）
const PROGRESS = {
  's-intro': 0,
  's-noise': 12,
  's-record': 28,
  's-review': 40,
  's-questions': 50,
  's-result': 100,
};

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.removeAttribute('data-active'));
  $(id).setAttribute('data-active', '');
  $('progress-bar').style.width = PROGRESS[id] + '%';
  window.scrollTo(0, 0);
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

// ── マイクを開く ────────────────────────────
async function openMic() {
  // 端末側の自動補正を切る。音量を勝手に均されると抑揚が測れなくなる。
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
  });
  state.ctx = new (window.AudioContext || window.webkitAudioContext)();
  await state.ctx.resume();
  state.sampleRate = state.ctx.sampleRate;
}

/** 指定した秒数ぶん波形を集める。onLevel は0〜1の音量を返す */
function capture(seconds, onLevel, stopSignal) {
  return new Promise((resolve) => {
    const ctx = state.ctx;
    const source = ctx.createMediaStreamSource(state.stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0; // 自分の声がスピーカーに返らないようにする

    const chunks = [];
    let total = 0;
    const limit = Math.floor(seconds * ctx.sampleRate);

    const finish = () => {
      processor.onaudioprocess = null;
      try {
        source.disconnect();
        processor.disconnect();
        mute.disconnect();
      } catch (e) {
        /* すでに外れている場合は何もしない */
      }
      const out = new Float32Array(total);
      let pos = 0;
      for (const c of chunks) {
        out.set(c, pos);
        pos += c.length;
      }
      resolve(out);
    };

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(input));
      total += input.length;

      if (onLevel) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        onLevel(Math.sqrt(sum / input.length));
      }
      if (total >= limit || (stopSignal && stopSignal.stopped)) finish();
    };

    source.connect(processor);
    processor.connect(mute);
    mute.connect(ctx.destination);
  });
}

function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}

// ── ① はじめに ─────────────────────────────
$('btn-start').addEventListener('click', async () => {
  const err = $('intro-error');
  err.hidden = true;
  try {
    await openMic();
    show('s-noise');
    measureRoom();
  } catch (e) {
    err.hidden = false;
    err.textContent =
      'マイクを使えませんでした。ブラウザの設定でマイクを許可してから、もう一度お試しください。';
  }
});

// ── ② 部屋の音 ─────────────────────────────
async function measureRoom() {
  $('noise-result').hidden = true;
  $('btn-noise-next').hidden = true;
  $('btn-noise-retry').hidden = true;
  $('noise-title').textContent = '環境音を測定します';

  const samples = await capture(2, (level) => {
    $('noise-bar').style.width = Math.min(100, level * 900) + '%';
  });
  // 最初の0.3秒はマイクが安定しないので捨てる
  const skip = Math.floor(state.sampleRate * 0.3);
  state.noiseFloor = rms(samples.subarray(skip));

  const line = $('noise-result');
  line.hidden = false;
  if (state.noiseFloor >= 0.02) {
    line.className = 'result-line warn';
    line.textContent =
      'まわりの音がかなり大きいようです。エアコンや換気扇を止められるなら止めて、測り直すと結果が安定します。';
  } else if (state.noiseFloor >= 0.008) {
    line.className = 'result-line';
    line.textContent = '少し生活音があります。このまま進めても診断はできます。';
  } else {
    line.className = 'result-line ok';
    line.textContent = '静かな環境です。このまま進みましょう。';
  }
  $('noise-title').textContent = '環境音の測定が完了しました';
  $('btn-noise-next').hidden = false;
  $('btn-noise-retry').hidden = false;
}

$('btn-noise-next').addEventListener('click', () => show('s-record'));
$('btn-noise-retry').addEventListener('click', measureRoom);

// ── ③ 録音 ────────────────────────────────

/** 読み上げる文章を表示する */
function setScript(id) {
  const sc = ALL_SCRIPTS.find((x) => x.id === id) || ALL_SCRIPTS[0];
  state.scriptId = sc.id;
  const isWork = sc.id !== 'stream';
  // 配信のあいさつは一文ずつ改行、作品は原文どおり続けて表示する
  $('script-text').innerHTML = isWork
    ? toRubyHtml(sc.text)
    : toRubyHtml(sc.text).replace(/。(?!$)/g, '。<br>');
  $('script-text').classList.toggle('work', isWork);
  $('script-label').textContent = isWork ? `『${sc.title}』${sc.author}` : sc.title;
  $('script-hint').textContent = sc.hint;
  const credit = $('script-credit');
  credit.hidden = !isWork;
  if (isWork) {
    credit.innerHTML = '';
    credit.appendChild(document.createTextNode('出典：'));
    const a = el('a', null, `青空文庫『${sc.title}』（${sc.author}）`);
    a.href = sc.url;
    a.target = '_blank';
    a.rel = 'noopener';
    credit.appendChild(a);
  }
}

/** 文章を選ぶポップアップ */
function openScriptPicker() {
  if (recording) return; // 録音中は切り替えない
  showModal((box, hide) => {
    box.appendChild(el('p', 'modal-title', '読み上げる文章を選ぶ'));
    box.appendChild(
      el('p', 'modal-lead', '青空文庫から、声に出して読みやすい作品の冒頭を選びました。漢字にはふりがなを振っています。')
    );
    const list = el('div', 'script-list');
    ALL_SCRIPTS.forEach((sc) => {
      const isWork = sc.id !== 'stream';
      const on = sc.id === state.scriptId;
      const item = el(
        'button',
        'script-item' + (on ? ' on' : ''),
        `<span class="si-title"><span>${isWork ? sc.title : 'はじめの文章（' + sc.title + '）'}</span>` +
          `${on ? '<span class="si-mark">選択中</span>' : ''}</span>` +
          `<span class="si-author">${isWork ? sc.author : '配信の話し方でそのまま読める文章'}</span>` +
          `<span class="si-preview">${toPlain(sc.text).slice(0, 28)}…</span>`
      );
      item.type = 'button';
      item.dataset.id = sc.id;
      item.addEventListener('click', () => {
        setScript(sc.id);
        hide();
      });
      list.appendChild(item);
    });
    box.appendChild(list);
  });
}

$('btn-pick-script').addEventListener('click', openScriptPicker);
setScript(state.scriptId);

let recording = false;
let stopSignal = null;

function setTimerText(sec) {
  $('timer').innerHTML = `${sec}<span> 秒</span>`;
}

$('btn-record').addEventListener('click', async () => {
  if (recording) {
    stopSignal.stopped = true;
    return;
  }
  recording = true;
  stopSignal = { stopped: false };
  $('btn-record').classList.add('on');
  $('record-label').textContent = '録音を止める';
  $('record-hint').textContent = '読み終えたら「録音を止める」を押してください';

  const started = performance.now();
  const tick = setInterval(() => {
    setTimerText(((performance.now() - started) / 1000).toFixed(1));
  }, 100);

  const samples = await capture(20, (level) => {
    $('level-bar').style.width = Math.min(100, level * 400) + '%';
  }, stopSignal);

  clearInterval(tick);
  recording = false;
  $('btn-record').classList.remove('on');
  $('record-label').textContent = '録音する';
  $('level-bar').style.width = '0%';

  const seconds = samples.length / state.sampleRate;
  if (seconds < 8) {
    $('record-hint').textContent = `${seconds.toFixed(1)}秒しか録れていません。8秒以上、最後まで読んでください。`;
    return;
  }

  state.samples = samples;
  $('player').src = URL.createObjectURL(toWav(samples, state.sampleRate));
  $('review-warn').hidden = true;
  show('s-review');
});

/** 聞き返し用に WAV を作る */
function toWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

// ── ④ 聞き返す ─────────────────────────────
$('btn-retake').addEventListener('click', () => {
  $('player').pause();
  setTimerText('0.0');
  $('record-hint').textContent = '8秒以上録ってください';
  show('s-record');
});

$('btn-accept').addEventListener('click', () => {
  const ctx = state.ctx;
  const buffer = ctx.createBuffer(1, state.samples.length, state.sampleRate);
  buffer.getChannelData(0).set(state.samples);

  const result = analyze(buffer, state.noiseFloor);
  if (!result) {
    const warn = $('review-warn');
    warn.hidden = false;
    warn.className = 'result-line warn';
    warn.textContent =
      '声をうまく拾えませんでした。マイクに少し近づいて、もう一度録り直してください。';
    return;
  }
  state.result = result;
  state.stream.getTracks().forEach((t) => t.stop());
  state.qIndex = 0;
  renderQuestion();
  show('s-questions');
});

// ── ⑤ 質問（1問ずつ） ───────────────────────
function renderQuestion() {
  const i = state.qIndex;
  const q = QUESTIONS[i];
  const card = $('question-card');
  card.innerHTML = '';
  card.appendChild(el('p', 'q-count', `質問 ${i + 1} / ${QUESTIONS.length}`));
  card.appendChild(el('p', 'q-title', q.q));

  const opts = el('div', 'options');
  q.options.forEach((o) => {
    const btn = el('button', 'option' + (state.answers[q.id] === o.v ? ' on' : ''), o.label);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      if (state.advancing) return; // 素早く2回押しても、進むのは1問
      state.answers[q.id] = o.v;
      opts.querySelectorAll('.option').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      state.advancing = true;
      setTimeout(() => {
        state.advancing = false;
        next();
      }, 220); // 押した手応えを見せてから進む
    });
    opts.appendChild(btn);
  });
  card.appendChild(opts);

  $('btn-back').hidden = i === 0;
  // 質問の進み具合もバーに反映する（50%から100%手前まで）
  $('progress-bar').style.width = 50 + (i / QUESTIONS.length) * 45 + '%';
}

function next() {
  if (state.qIndex < QUESTIONS.length - 1) {
    state.qIndex++;
    renderQuestion();
    window.scrollTo(0, 0);
  } else {
    renderResult();
    saveResult();
    show('s-result');
  }
}

$('btn-back').addEventListener('click', () => {
  if (state.advancing) return; // 選んだ直後は自動で次へ進むので、戻る操作は受け付けない
  if (state.qIndex > 0) {
    state.qIndex--;
    renderQuestion();
  }
});

// ── ⑥ 結果 ────────────────────────────────

/** マイクの説明を開く */
/**
 * ポップアップを開く。中身は fill(box, hide) で組み立てる。
 * 背景・×・Escキーのどれでも閉じる。開いている間は後ろをスクロールさせない。
 */
function showModal(fill, { accent, tint } = {}) {
  const back = el('div', 'modal-back');
  if (accent) back.style.setProperty('--accent', accent);
  if (tint) back.style.setProperty('--tint', tint);
  const box = el('div', 'modal');

  const close = el('button', 'modal-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', '閉じる');
  box.appendChild(close);

  const hide = () => {
    back.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') hide();
  };
  close.addEventListener('click', hide);
  back.addEventListener('click', (e) => {
    if (e.target === back) hide();
  });
  document.addEventListener('keydown', onKey);

  fill(box, hide);

  back.appendChild(box);
  document.body.appendChild(back);
  document.body.style.overflow = 'hidden';
}

/** マイクの説明を開く */
function openModal(guide, accent, tint) {
  showModal(
    (box, hide) => {
      box.appendChild(el('p', 'modal-title', guide.name));
      box.appendChild(el('p', 'modal-lead', guide.lead));
      guide.detail.forEach((d) => {
        box.appendChild(el('h4', 'modal-h', d.h));
        box.appendChild(el('p', 'modal-p', d.p));
      });
      box.appendChild(
        el(
          'p',
          'modal-fit',
          '向いている人：' + guide.fit.split('、').map((t, i, a) => `<span class="nb">${t}${i < a.length - 1 ? '、' : ''}</span>`).join('')
        )
      );
      const done = el('button', 'ghost', '閉じる');
      done.type = 'button';
      done.addEventListener('click', hide);
      box.appendChild(done);
    },
    { accent, tint }
  );
}

/** 4軸の特性バー */
function traits(scores, axes) {
  const box = el('div', 'traits');
  AXES.forEach((a) => {
    const raw = scores[a.score];
    // 「間」だけは値が大きいほど右（間を置く）になるよう見せ方を合わせる
    const pct = Math.round(raw);
    const side = a.invert
      ? axes[a.flag] ? a.left : a.right
      : axes[a.flag] ? a.right : a.left;
    const strength = a.invert
      ? axes[a.flag] ? 100 - pct : pct
      : axes[a.flag] ? pct : 100 - pct;

    const row = el('div', 'trait');
    row.style.setProperty('--c', a.color);
    row.appendChild(
      el(
        'div',
        'trait-top',
        `<span class="name">${a.key}</span><span class="value">${side} ${Math.max(50, strength)}%</span>`
      )
    );
    const bar = el('div', 'trait-bar', '<div></div>');
    bar.firstChild.style.width = pct + '%';
    row.appendChild(bar);
    const leftWins = side === a.left; // 濃いほうの言葉を太字にする
    row.appendChild(
      el(
        'div',
        'trait-poles',
        `<span>${leftWins ? `<b>${a.left}</b>` : a.left}</span>` +
          `<span>${leftWins ? a.right : `<b>${a.right}</b>`}</span>`
      )
    );
    box.appendChild(row);
  });

  // 参考値
  const ref = el('div', 'trait');
  ref.style.setProperty('--c', '#9aa2ae');
  ref.appendChild(
    el(
      'div',
      'trait-top',
      `<span class="name">通りやすさ</span><span class="value">${Math.round(scores['通りやすさ'])}%</span>`
    )
  );
  const refBar = el('div', 'trait-bar', '<div></div>');
  refBar.firstChild.style.width = scores['通りやすさ'] + '%';
  ref.appendChild(refBar);
  ref.appendChild(
    el('div', 'trait-poles', '<span>やわらかい</span><span>よく通る</span>')
  );
  box.appendChild(ref);
  return box;
}

/** コードの読み方。4文字が何を指しているかを並べる */
function codeKey(mine) {
  const card = el('div', 'card code-key');
  card.appendChild(el('h3', null, 'コードの読み方'));
  card.appendChild(
    el('p', 'key-lead', '4文字は左から、高さ・抑揚・テンポ・間を表しています。')
  );
  AXES.forEach((a, i) => {
    const row = el('div', 'key-row');
    row.style.setProperty('--c', a.color);
    row.appendChild(el('span', 'key-axis', a.key));
    a.letters.forEach((l) => {
      const on = mine && mine[i] === l.c;
      row.appendChild(
        el(
          'span',
          'key-side',
          `<span class="letter${on ? '' : ' off'}">${l.c}</span>` +
            `<span><b>${l.ja}</b><small>${l.en}</small></span>`
        )
      );
    });
    card.appendChild(row);
  });
  return card;
}

/** 16タイプの一覧。自分のタイプは色を塗って目立たせる */
function allTypes(mine) {
  const wrapper = el('div', 'all-types');
  wrapper.appendChild(codeKey(mine));
  wrapper.appendChild(el('h3', null, '16タイプ一覧'));
  wrapper.appendChild(
    el('p', 'fine', `<span class="nb">押すとそれぞれの説明が読めます。</span><span class="nb">${label(mine)}があなたのタイプです。</span>`)
  );

  Object.entries(GROUPS).forEach(([key, g]) => {
    const block = el('div', 'group-block');
    block.style.setProperty('--c', g.accent);
    block.appendChild(el('div', 'group-label', `<i></i><b>${g.name}</b><span>${g.axis}</span>`));
    const grid = el('div', 'type-grid');
    CODES.filter((c) => TYPES[c].group === key).forEach((c) => {
      const t = TYPES[c];
      const cell = el(
        'a',
        'type-cell' + (c === mine ? ' mine' : ''),
        `<span class="cell-code">${c}</span><span class="cell-name">${t.name}</span><span class="cell-catch">${t.catch}</span>`
      );
      cell.href = `r/${c}/`; // 新しいタブで開きたい人のためにリンクは残す
      cell.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault(); // 移動すると診断結果が消えるので、その場で開く
        openTypeModal(c, c === mine);
      });
      grid.appendChild(cell);
    });
    block.appendChild(grid);
    wrapper.appendChild(block);
  });
  return wrapper;
}

/** 16タイプ一覧から、そのタイプの説明を開く（結果画面はそのまま残る） */
function openTypeModal(code, isMine) {
  const t = TYPES[code];
  const g = GROUPS[t.group];
  showModal(
    (box, hide) => {
      box.appendChild(el('div', 'modal-art', art(code, 'modal')));
      box.appendChild(el('p', 'modal-eyebrow', `${g.name}　${g.axis}`));
      box.appendChild(
        el('p', 'modal-title', `${t.name}<span class="modal-code">${code}</span>` + (isMine ? '<span class="modal-mine">あなたのタイプ</span>' : ''))
      );
      box.appendChild(el('p', 'modal-lead', t.catch));
      box.appendChild(el('h4', 'modal-h', `${t.name}とは`));
      box.appendChild(el('p', 'modal-p', t.body));
      box.appendChild(el('h4', 'modal-h', '強い配信'));
      box.appendChild(el('p', 'tags modal-tags', t.strong.map((x) => `<span>${x}</span>`).join('')));
      box.appendChild(el('h4', 'modal-h', '気をつける点'));
      box.appendChild(el('p', 'modal-p', t.caution));
      box.appendChild(el('h4', 'modal-h', '合うマイク'));
      box.appendChild(el('p', 'modal-p', t.micWhy));
      const back = el('button', 'primary', '閉じて結果に戻る');
      back.type = 'button';
      back.addEventListener('click', hide);
      box.appendChild(back);
    },
    { accent: g.accent, tint: g.tint }
  );
}

// ── 結果を覚えておく ───────────────────────
// ブラウザの「戻る」や再読み込みでも結果画面に戻れるように、同じタブの中でだけ保存する。
// 録音した音声は保存しない（判定結果と質問の答えだけ）。
const SAVE_KEY = 'voice-type-result';

function saveResult() {
  try {
    sessionStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ result: state.result, answers: state.answers, noiseFloor: state.noiseFloor })
    );
    if (location.hash !== '#result') history.replaceState(null, '', location.pathname + location.search + '#result');
  } catch (e) {
    /* 保存できない環境でも、診断そのものは続けられる */
  }
}

function restoreResult() {
  if (location.hash !== '#result') return false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || 'null');
    if (!saved || !saved.result) return false;
    state.result = saved.result;
    state.answers = saved.answers || {};
    state.noiseFloor = saved.noiseFloor ?? state.noiseFloor;
    renderResult();
    show('s-result');
    return true;
  } catch (e) {
    return false;
  }
}

function clearResult() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* 何もしない */
  }
}

function renderResult() {
  const { axes, scores, raw } = state.result;
  const code = toCode(axes);
  const type = TYPES[code];
  const group = GROUPS[type.group];
  const outer = $('result-body');
  outer.innerHTML = '';

  const body = el('div', 'wrap step');
  outer.appendChild(body);
  outer.style.setProperty('--accent', group.accent);
  outer.style.setProperty('--tint', group.tint);

  // タイプ
  const head = el('div', 'type-hero');
  head.appendChild(el('div', 'type-art', art(code, 'hero'))); // Xのカード画像と同じ絵
  head.appendChild(el('p', 'group-name', `${group.name}　${group.axis}`));
  head.appendChild(el('h1', 'type-name', type.name));
  head.appendChild(el('p', 'code-pill', code));
  head.appendChild(el('p', 'type-catch', type.catch));
  body.appendChild(head);

  // 特性バー
  const chart = el('div', 'card');
  chart.appendChild(el('h3', null, '声の4つの軸'));
  chart.appendChild(traits(scores, axes));
  body.appendChild(chart);

  // 本文
  const about = el('div', 'card');
  about.appendChild(el('h3', null, `${type.name}とは`));
  about.appendChild(el('p', 'type-body', type.body));
  about.appendChild(el('h3', null, '強い配信'));
  about.appendChild(el('p', 'tags', type.strong.map((s) => `<span>${s}</span>`).join('')));
  about.appendChild(el('h3', null, '気をつける点'));
  about.appendChild(el('p', null, type.caution));

  // なりたい印象へのひとこと
  const goal = state.answers.goal;
  if (goal && GOAL_ADVICE[goal]) {
    const fit = goalFit(goal, axes) ? '近い' : '遠い';
    about.appendChild(el('h3', null, 'なりたい印象に近づくには'));
    about.appendChild(el('p', 'advice', GOAL_ADVICE[goal][fit]));
  }
  body.appendChild(about);

  // マイク
  const decision = decideCapsule(type, state.answers, state.noiseFloor);
  const pattern = decidePattern(state.answers, state.noiseFloor);
  const capsuleName = decision.capsule === 'condenser' ? 'コンデンサー' : 'ダイナミック';

  const mic = el('div', 'card gear');
  mic.appendChild(el('h3', null, 'あなたに向くマイク'));
  mic.appendChild(el('p', 'verdict', `${capsuleName}マイク`));
  mic.appendChild(el('p', 'verdict-sub', `指向性：${pattern.name}`));
  mic.appendChild(
    el('ul', 'reasons', [...decision.reasons, pattern.why].map((r) => `<li>${r}</li>`).join(''))
  );

  // マイクの種類の説明。選ばれたほうに印を付ける
  const guide = el('div', 'mic-guide');
  ['dynamic', 'condenser'].forEach((key) => {
    const c = CAPSULE_GUIDE[key];
    const on = key === decision.capsule;
    const box = el('div', 'guide-card' + (on ? ' on' : ''));
    box.appendChild(
      el(
        'p',
        'guide-title',
        `${c.name}${on ? '<span class="guide-mark">あなた向き</span>' : ''}`
      )
    );
    box.appendChild(el('p', 'guide-lead', c.lead));
    box.appendChild(el('ul', 'guide-points', c.points.map((t) => `<li>${t}</li>`).join('')));
    box.appendChild(
      el(
        'p',
        'guide-fit',
        '向いている人：' + c.fit.split('、').map((t, i, a) => `<span class="nb">${t}${i < a.length - 1 ? '、' : ''}</span>`).join('')
      )
    );
    const btn = el('button', 'guide-link', 'くわしく知る');
    btn.type = 'button';
    btn.addEventListener('click', () => openModal(c, group.accent, group.tint));
    box.appendChild(btn);
    guide.appendChild(box);
  });
  mic.appendChild(guide);

  // 最初に見せるのは、予算帯の1枚（予算未定なら「一般」）と、それに一緒に必要なものだけ。
  // ほかの価格帯・あると安心・別の選び方は「他の機材もチェックする」で開く。
  const budget = state.answers.budget;
  const primaryBand = ['entry', 'standard', 'pro'].includes(budget) ? budget : 'standard';
  const gears = pickGear(decision.capsule);
  const ordered = [
    gears.find((g) => g.band === primaryBand),
    ...gears.filter((g) => g.band !== primaryBand),
  ];
  const toggle = el('button', 'more-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  let hiddenExtras = 0;

  ordered.forEach((g, idx) => {
    const primary = idx === 0;
    const card = el('div', 'gear-card' + (primary ? ' pick' : ' more-only'));
    const mark = primary ? (budget === g.band ? 'あなたの予算' : 'おすすめ') : '';
    card.appendChild(
      el(
        'p',
        'band',
        `${BANDS[g.band].name}　${BANDS[g.band].range}` + (mark ? `<span class="pick-mark">${mark}</span>` : '')
      )
    );
    // 「SHURE SM58 ＋ MOTU M2」は ＋ の前でだけ折り返す
    const units = (t) =>
      t.split(/\s*＋\s*/).map((u, i) => `<span class="nb">${i ? '＋ ' : ''}${u}</span>`).join(' ');
    card.appendChild(el('p', 'gear-name', units(g.name)));
    card.appendChild(el('p', 'gear-meta', `${g.pattern} ／ ${g.connection}`));
    card.appendChild(el('p', 'gear-price', units(g.price)));
    card.appendChild(el('p', 'gear-why', g.why));

    // 販売店は3つ並べる。価格も在庫も店によって違うので見比べてもらう
    const box = el('div', 'store-box');
    box.appendChild(el('p', 'store-label', '取り扱い店'));
    const row = el('div', 'store-row');
    storeLinks(g).forEach((s) => {
      const a = el('a', 'store-link', s.name);
      a.href = s.url;
      a.target = '_blank';
      a.rel = s.paid ? 'nofollow noopener sponsored' : 'noopener';
      row.appendChild(a);
    });
    box.appendChild(row);
    card.appendChild(box);

    // 一緒に必要なもの／あると安心／別の選び方
    // ラベル・条件・商品名を行で分けて、語の途中で折れないようにする
    const extra = (items, label, hide) => {
      (items || []).forEach((it) => {
        const line = el('div', 'gear-extra' + (hide ? ' more-only' : ''));
        line.appendChild(el('span', 'ex-label', label));
        if (it.note) line.appendChild(el('span', 'ex-note', it.note));
        // 「ポップガード」と「STEDMAN PROSCREEN 101」を分け、型番の最後の語は前の語から離さない
        const [head, ...rest] = it.name.split(' ');
        const isCategory = rest.length && /[^\x00-\x7F]/.test(head);
        const product = (isCategory ? rest.join(' ') : it.name).replace(/ (\S+)$/, '\u00a0$1');
        const item = el(
          'span',
          'ex-item',
          (isCategory ? `<span class="nb">${head}</span> ` : '') +
            `<span class="nb">${product}</span><span class="nb">（${it.price}）</span>`
        );
        const a = el('a', 'extra-link', 'Amazon');
        a.href = it.amazonUrl || amazonLink(it);
        a.target = '_blank';
        a.rel = 'nofollow noopener sponsored';
        item.appendChild(a);
        line.appendChild(item);
        card.appendChild(line);
      });
    };
    extra(g.with, '一緒に必要', false); // これがないと使えないので、いつも見せる
    extra(g.plus, 'あると安心', primary);
    extra(g.instead, '別の選び方', primary);
    if (primary) hiddenExtras = (g.plus || []).length + (g.instead || []).length;

    mic.appendChild(card);
    if (primary) mic.appendChild(toggle);
  });

  const closedLabel =
    '<span class="mt-label">他の機材もチェックする</span>' +
    `<span class="mt-sub">ほかの価格帯 ${ordered.length - 1}件` +
    (hiddenExtras ? `・あると安心／別の選び方 ${hiddenExtras}件` : '') +
    '</span>';
  toggle.innerHTML = closedLabel;
  toggle.addEventListener('click', () => {
    const open = mic.classList.toggle('show-more');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? '<span class="mt-label">閉じる</span>' : closedLabel;
  });

  if (state.answers.budget === 'pro' || decision.capsule === 'condenser') {
    mic.appendChild(
      el(
        'p',
        'fine',
        '高いマイクほど、部屋の反響と生活音も正直に拾います。10万円のマイクを普通の部屋で使うと、2万円のダイナミックに負けることがあります。先に吸音を用意してください。'
      )
    );
  }
  body.appendChild(mic);

  // 16タイプ一覧
  body.appendChild(allTypes(code));

  // シェア
  const shareUrl = `${SITE}/r/${code}/`;
  const text = shareText(code); // 声の説明入り。Xの上限（全角140字）いっぱいに収めてある
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

  const share = el('div', 'share');
  const sa = el('a', 'primary as-link', 'この結果をXでシェアする');
  sa.href = intent;
  sa.target = '_blank';
  sa.rel = 'noopener';
  share.appendChild(sa);
  const again = el('button', 'ghost', 'もう一度診断する');
  again.addEventListener('click', () => {
    clearResult();
    location.href = location.pathname; // #result を外して、はじめから
  });
  share.appendChild(again);
  body.appendChild(share);

  // 調整用（?debug=1 のときだけ）
  if (DEBUG && raw) {
    body.appendChild(
      el('pre', 'debug', JSON.stringify({ code, raw, scores, gear: decision.score }, null, 2))
    );
  }
}

// ── 見た目の確認用 ─────────────────────────
// ?demo=LEFB のように指定すると、録音せずに結果画面だけ表示する。
const params = new URLSearchParams(location.search);

// ?screen=noise のように指定すると、その画面だけ表示する（見本用）
const screenName = params.get('screen');
if (screenName) {
  const map = { intro: 's-intro', noise: 's-noise', record: 's-record', review: 's-review' };
  if (map[screenName]) {
    show(map[screenName]);
    if (screenName === 'noise') {
      const line = $('noise-result');
      line.hidden = false;
      line.className = 'result-line ok';
      line.textContent = '静かな環境です。このまま進みましょう。';
      $('noise-title').textContent = '環境音の測定が完了しました';
      $('noise-bar').style.width = '12%';
      $('btn-noise-next').hidden = false;
      $('btn-noise-retry').hidden = false;
    }
    if (screenName === 'record') {
      $('progress-bar').style.width = '28%';
    }
  }
}

// 保存した結果があれば、はじめの画面ではなく結果画面を出す
if (!params.get('demo') && !params.get('screen')) restoreResult();

const demo = params.get('demo');
if (demo === 'q') {
  // ?demo=q で質問画面だけ確認できる
  renderQuestion();
  show('s-questions');
} else if (demo && TYPES[demo]) {
  state.result = {
    axes: {
      high: demo[0] === 'H',
      dynamic: demo[1] === 'D',
      fast: demo[2] === 'F',
      continuous: demo[3] === 'C',
    },
    raw: null,
    scores: {
      高さ: demo[0] === 'H' ? 74 : 31,
      抑揚: demo[1] === 'D' ? 71 : 29,
      テンポ: demo[2] === 'F' ? 68 : 34,
      間: demo[3] === 'C' ? 22 : 66,
      通りやすさ: 52,
    },
  };
  state.answers = { genre: 'talk', room: 'normal', time: 'night', mic: 'usb', budget: 'standard', goal: 'calm' };
  state.noiseFloor = 0.006;
  renderResult();
  show('s-result');
}

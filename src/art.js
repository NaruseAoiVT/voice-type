// タイプごとのイラスト（SVG）
//
// 16Personalities の共有画像にならい、面を明暗2〜3色に塗り分けた「多面体っぽい」フラットな絵にしている。
// 色は系統（スパーク系・クリア系・ドライブ系・ベース系）の色を濃淡で使い、差し色を少しだけ足す。
// 結果画面・タイプ別ページ・Xのカード画像（tools/build.mjs）で同じ絵を使う。
//
//   art('LEFB') → '<svg viewBox="0 0 520 460">…</svg>'

// ── 色 ─────────────────────────────
const PAL = {
  HD: { bg: '#fdf0e6', l1: '#fae1ce', l2: '#f3c6a4', m: '#e8a273', a: '#d1854e', d: '#ab653a', dd: '#7a4526' },
  HE: { bg: '#e9f6f1', l1: '#d2ece3', l2: '#a7d8c8', m: '#6fbfa8', a: '#3e9c86', d: '#2d7866', dd: '#1e5347' },
  LD: { bg: '#fdeef1', l1: '#f9d7de', l2: '#f1b0bd', m: '#e58c9d', a: '#d2687a', d: '#aa4c5e', dd: '#743443' },
  LE: { bg: '#eeeffb', l1: '#dcdff7', l2: '#b8bdee', m: '#9199df', a: '#6f78ce', d: '#5159a9', dd: '#353b78' },
};
const Y1 = '#fbd97f';
const Y2 = '#f2b544';
const WHITE = '#ffffff';

// ── 部品 ─────────────────────────────
const n = (v) => Math.round(v * 10) / 10;
const pts = (a) => a.map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
const poly = (a, f, x = '') => `<polygon points="${pts(a)}" fill="${f}"${x}/>`;
const circ = (cx, cy, r, f, x = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${f}"${x}/>`;
const ell = (cx, cy, rx, ry, f, x = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}"${x}/>`;
const rect = (x, y, w, h, f, x2 = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${f}"${x2}/>`;
const path = (d, f, x = '') => `<path d="${d}" fill="${f}"${x}/>`;
const stroke = (d, c, w, x = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
const op = (o) => ` opacity="${o}"`;

/** 山：頂点を境に左を明るく、右を暗く */
function mountain(x, base, w, h, light, dark, skew = 0) {
  const px = x + skew;
  const py = base - h;
  const mid = px + w * 0.06;
  return poly([[x - w / 2, base], [px, py], [mid, base]], light) + poly([[px, py], [x + w / 2, base], [mid, base]], dark);
}

/** 針葉樹：三角を3段重ね、左右で明暗 */
function pine(x, base, h, light, dark, trunk) {
  let s = rect(x - h * 0.035, base - h * 0.16, h * 0.07, h * 0.16, trunk);
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.24;
    const bottom = top + h * 0.4;
    const hw = h * (0.16 + i * 0.07);
    s += poly([[x, top], [x - hw, bottom], [x, bottom - h * 0.03]], light);
    s += poly([[x, top], [x + hw, bottom], [x, bottom - h * 0.03]], dark);
  }
  return s;
}

/** 岩：上面・正面・側面の3色 */
function rock(x, y, w, h, top, front, side) {
  const t = h * 0.32;
  return (
    poly([[x + w * 0.1, y], [x + w * 0.86, y], [x + w, y + t], [x, y + t]], top) +
    poly([[x, y + t], [x + w, y + t], [x + w * 0.94, y + h], [x + w * 0.06, y + h]], front) +
    poly([[x + w * 0.62, y + t], [x + w, y + t], [x + w * 0.94, y + h], [x + w * 0.58, y + h]], side)
  );
}

/** 4つの角を持つきらめき。8枚の三角を交互に塗る */
function sparkle(cx, cy, r, c1, c2) {
  const tips = [[0, -r], [r, 0], [0, r], [-r, 0]];
  const k = r * 0.26;
  const inner = [[k, -k], [k, k], [-k, k], [-k, -k]];
  let s = '';
  for (let i = 0; i < 4; i++) {
    const t = tips[i];
    const a = inner[(i + 3) % 4];
    const b = inner[i];
    s += poly([[cx, cy], [cx + a[0], cy + a[1]], [cx + t[0], cy + t[1]]], i % 2 ? c2 : c1);
    s += poly([[cx, cy], [cx + t[0], cy + t[1]], [cx + b[0], cy + b[1]]], i % 2 ? c1 : c2);
  }
  return s;
}

/** 宝石 */
function gem(x, y, s, c1, c2, c3) {
  return (
    poly([[x - 20 * s, y - 10 * s], [x - 10 * s, y - 20 * s], [x + 10 * s, y - 20 * s], [x + 20 * s, y - 10 * s]], c1) +
    poly([[x - 20 * s, y - 10 * s], [x, y - 10 * s], [x, y + 18 * s]], c2) +
    poly([[x, y - 10 * s], [x + 20 * s, y - 10 * s], [x, y + 18 * s]], c3)
  );
}

/** 雲：暗い影を少しずらして敷き、上に明るい面を重ねる */
function cloud(x, y, s, light, shade) {
  const body = (c, dy) =>
    circ(x, y + dy, 24 * s, c) +
    circ(x + 30 * s, y - 14 * s + dy, 32 * s, c) +
    circ(x + 62 * s, y + dy, 24 * s, c) +
    rect(x, y + dy, 62 * s, 24 * s, c) +
    circ(x, y + 12 * s + dy, 12 * s, c) +
    circ(x + 62 * s, y + 12 * s + dy, 12 * s, c);
  return body(shade, 6 * s) + body(light, 0);
}

/** 丸いものを多角形で。左上ほど明るい */
function ball(cx, cy, r, light, mid, dark, sides = 10) {
  let s = '';
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2 - Math.PI / 2;
    const am = (a0 + a1) / 2;
    const lit = Math.cos(am + Math.PI * 0.75); // 左上を向いた面ほど大きい
    const c = lit > 0.35 ? light : lit > -0.45 ? mid : dark;
    s += poly([[cx, cy], [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]], c, ` stroke="${c}" stroke-width="0.6"`);
  }
  return s;
}

/** 三日月 */
function crescent(cx, cy, r, c) {
  return path(`M${cx},${cy - r} A${r},${r} 0 1,0 ${cx},${cy + r} A${r * 0.72},${r} 0 1,1 ${cx},${cy - r}Z`, c);
}

/** 星（小さな点） */
function stars(list, c, o = 0.8) {
  return list.map(([x, y, r]) => circ(x, y, r, c, op(o))).join('');
}

/** 足もとの淡い影 */
const shadow = (cx, cy, rx, ry, o = 0.08) => ell(cx, cy, rx, ry, '#1d2330', op(o));

// ── 16の場面 ──────────────────────────

const SCENES = {
  // スパークル型：大小のきらめきと宝石
  HDFC(p) {
    return (
      circ(260, 210, 160, p.l1) +
      mountain(120, 410, 330, 110, p.l2, p.m, 20) +
      mountain(410, 410, 340, 130, p.l2, p.m, -30) +
      rect(0, 400, 520, 60, p.l2) +
      poly([[0, 400], [520, 400], [520, 412], [0, 412]], p.m, op(0.5)) +
      sparkle(262, 205, 118, Y1, Y2) +
      sparkle(410, 108, 50, p.a, p.d) +
      sparkle(112, 118, 40, Y1, Y2) +
      sparkle(430, 288, 28, p.m, p.a) +
      sparkle(88, 282, 22, p.a, p.d) +
      sparkle(170, 46, 14, p.m, p.a) +
      stars([[340, 60, 5], [60, 200, 4], [470, 200, 5], [200, 330, 4], [330, 340, 5], [150, 190, 3]], Y2, 0.9) +
      shadow(180, 402, 34, 6, 0.1) +
      gem(180, 384, 1.05, '#fbe3a0', Y2, '#d99a2d') +
      shadow(345, 404, 26, 5, 0.1) +
      gem(345, 390, 0.8, p.l2, p.a, p.d) +
      shadow(452, 405, 20, 4, 0.1) +
      gem(452, 394, 0.6, '#fbe3a0', Y2, '#d99a2d')
    );
  },

  // 打ち上げ花火型：夜空に広がる花火
  HDFB(p, id) {
    const burst = (cx, cy, r, count, c1, c2) => {
      let s = '';
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x0 = cx + Math.cos(a) * r * 0.28;
        const y0 = cy + Math.sin(a) * r * 0.28;
        const x1 = cx + Math.cos(a) * r * 0.82;
        const y1 = cy + Math.sin(a) * r * 0.82;
        s += stroke(`M${n(x0)},${n(y0)}L${n(x1)},${n(y1)}`, c1, r > 80 ? 6 : 4);
        s += circ(cx + Math.cos(a) * r * 0.96, cy + Math.sin(a) * r * 0.96, r > 80 ? 5 : 3.5, c2);
        const b = a + Math.PI / count;
        s += circ(cx + Math.cos(b) * r * 0.5, cy + Math.sin(b) * r * 0.5, r > 80 ? 3.5 : 2.5, c2, op(0.9));
      }
      return s + circ(cx, cy, r * 0.12, c2);
    };
    return (
      `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d2a55"/><stop offset=".72" stop-color="#6a4163"/><stop offset="1" stop-color="#b86a5c"/></linearGradient></defs>` +
      rect(0, 0, 520, 460, `url(#${id}-sky)`) +
      stars([[40, 40, 2], [120, 90, 1.6], [480, 60, 2], [300, 30, 1.6], [450, 170, 1.6], [70, 180, 1.6], [240, 250, 1.4]], WHITE, 0.7) +
      burst(300, 150, 118, 22, Y1, '#fff1c4') +
      burst(300, 150, 62, 14, p.m, '#ffd6bd') +
      burst(118, 110, 70, 16, '#f49b86', '#ffd9cf') +
      burst(440, 272, 56, 14, Y2, Y1) +
      stroke('M300,420 C298,360 302,300 300,270', Y1, 3, ` stroke-dasharray="2 10"${op(0.8)}`) +
      mountain(90, 460, 300, 120, '#3c2f55', '#2c2342', 10) +
      mountain(420, 460, 300, 100, '#3c2f55', '#2c2342', -20) +
      pine(40, 460, 90, '#2e2546', '#231c38', '#231c38') +
      pine(470, 460, 110, '#2e2546', '#231c38', '#231c38') +
      pine(500, 460, 70, '#2e2546', '#231c38', '#231c38')
    );
  },

  // ひだまり型：日だまりで丸くなる猫
  HDSC(p, id) {
    return (
      rect(0, 0, 520, 340, p.bg) +
      rect(0, 340, 520, 120, p.l2) +
      [370, 400].map((y) => stroke(`M0,${y}H520`, p.m, 2, op(0.35))).join('') +
      // 窓
      rect(52, 44, 188, 214, WHITE) +
      `<defs><linearGradient id="${id}-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde6b8"/><stop offset="1" stop-color="#fff4dc"/></linearGradient></defs>` +
      rect(64, 56, 164, 190, `url(#${id}-win)`) +
      circ(170, 112, 30, Y1) +
      rect(143, 56, 6, 190, WHITE) +
      rect(64, 148, 164, 6, WHITE) +
      rect(40, 256, 212, 14, p.a) +
      rect(40, 266, 212, 6, p.d) +
      // 差し込む光
      poly([[64, 272], [252, 272], [470, 430], [150, 440]], Y1, op(0.28)) +
      poly([[140, 372], [400, 372], [450, 440], [120, 440]], Y1, op(0.35)) +
      // 鉢植え
      ell(430, 262, 22, 34, '#8cc27a') +
      ell(452, 236, 16, 30, '#6ea85d', ' transform="rotate(28 452 236)"') +
      ell(408, 238, 14, 28, '#9fcd8c', ' transform="rotate(-30 408 238)"') +
      poly([[398, 272], [462, 272], [454, 330], [406, 330]], p.a) +
      poly([[430, 272], [462, 272], [454, 330], [430, 330]], p.d) +
      rect(394, 266, 72, 12, p.m) +
      shadow(430, 334, 36, 6, 0.1) +
      // クッションと猫
      shadow(300, 426, 118, 12, 0.1) +
      path('M190,400 Q190,380 220,378 H380 Q410,380 410,400 Q410,420 380,422 H220 Q190,420 190,400Z', p.m) +
      path('M300,378 H380 Q410,380 410,400 Q410,420 380,422 H300Z', p.a) +
      path('M226,394 Q226,322 300,316 Q374,320 378,394Z', '#f7c893') +
      path('M304,316 Q374,320 378,394 H304Z', '#e9ad6f') +
      stroke('M376,392 Q406,392 400,368 Q396,350 380,354', '#e9ad6f', 14) +
      circ(238, 348, 34, '#f7c893') +
      path('M238,314 A34,34 0 0,1 272,348 H238Z', '#e9ad6f', op(0.55)) +
      poly([[210, 330], [214, 296], [236, 318]], '#f7c893') +
      poly([[244, 316], [266, 300], [268, 334]], '#e9ad6f') +
      poly([[216, 322], [218, 306], [228, 318]], '#f1a3a0') +
      stroke('M218,350 Q224,356 230,350', p.dd, 3) +
      stroke('M246,350 Q252,356 258,350', p.dd, 3) +
      circ(238, 360, 3, '#e57f7f') +
      [[262, 334], [276, 332]].map(([x, y]) => stroke(`M${x},${y + 30} l14,-2`, p.d, 2, op(0.5))).join('') +
      stroke('M288,340 q10,-8 20,0', '#e9ad6f', 4, op(0.8)) +
      stroke('M312,334 q10,-8 20,0', '#e9ad6f', 4, op(0.8)) +
      // Zzz のかわりに小さなきらめき
      sparkle(190, 296, 10, Y1, Y2) +
      sparkle(176, 272, 6, Y1, Y2)
    );
  },

  // ふわり型：雲のあいだを漂う気球と綿毛
  HDSB(p, id) {
    const seed = (x, y, s, rot) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
      stroke('M0,0 V26', p.d, 1.6) +
      [-60, -35, -12, 12, 35, 60].map((a) => {
        const r = (a * Math.PI) / 180;
        return stroke(`M0,0 L${n(Math.sin(r) * 16)},${n(-Math.cos(r) * 16)}`, p.a, 1.6);
      }).join('') +
      ell(0, 28, 2.4, 4, p.d) +
      '</g>';
    return (
      circ(410, 90, 64, Y1, op(0.45)) +
      circ(410, 90, 40, Y1, op(0.6)) +
      cloud(50, 330, 1.5, WHITE, p.l1) +
      cloud(300, 372, 1.8, WHITE, p.l1) +
      cloud(360, 170, 0.9, WHITE, p.l1) +
      cloud(40, 110, 0.75, WHITE, p.l1) +
      // 気球
      `<defs><clipPath id="${id}-env"><path d="M280,70 C348,70 372,136 350,190 L314,240 H246 L210,190 C188,136 212,70 280,70Z"/></clipPath></defs>` +
      `<g clip-path="url(#${id}-env)">` +
      rect(180, 60, 200, 200, p.l2) +
      [[222, 36], [274, 12], [308, 30]].map(([x, w]) => rect(x, 60, w, 200, p.a)).join('') +
      [[196, 26], [258, 16], [286, 22]].map(([x, w]) => rect(x, 60, w, 200, WHITE, op(0.55))).join('') +
      poly([[280, 60], [380, 60], [380, 260], [280, 260]], p.dd, op(0.14)) +
      '</g>' +
      stroke('M252,240 L266,268 M308,240 L294,268', p.dd, 2) +
      rect(262, 266, 36, 26, p.d) +
      rect(280, 266, 18, 26, p.dd) +
      rect(260, 262, 40, 6, p.a) +
      // 羽根
      `<g transform="rotate(-32 120 230)">` +
      path('M120,150 C100,180 96,240 120,300 C118,250 118,200 120,150Z', WHITE) +
      path('M120,150 C142,180 146,240 120,300 C122,250 122,200 120,150Z', p.l1) +
      stroke('M120,150 V318', p.m, 2.4) +
      stroke('M106,210 l14,8 M104,240 l16,8 M134,200 l-14,8 M136,232 l-16,8', p.l1, 1.6) +
      '</g>' +
      seed(200, 150, 1.2, -14) +
      seed(440, 250, 1, 18) +
      seed(470, 330, 0.8, 8) +
      seed(170, 250, 0.8, 10) +
      seed(400, 40, 0.7, -20)
    );
  },

  // ころころ型：段々を転がるビー玉
  HEFC(p) {
    const cube = (x, y, w, h, d) =>
      poly([[x, y], [x + w, y], [x + w + d, y - d * 0.6], [x + d, y - d * 0.6]], p.l1) +
      rect(x, y, w, h, p.l2) +
      poly([[x + w, y], [x + w + d, y - d * 0.6], [x + w + d, y + h - d * 0.6], [x + w, y + h]], p.m);
    const marble = (x, y, r, c1, c2, c3) =>
      ball(x, y, r, c1, c2, c3, 12) + circ(x - r * 0.35, y - r * 0.38, r * 0.2, WHITE, op(0.9)) + circ(x - r * 0.08, y - r * 0.55, r * 0.08, WHITE, op(0.8));
    return (
      circ(250, 200, 150, p.l1, op(0.8)) +
      shadow(260, 440, 250, 14, 0.07) +
      cube(20, 190, 150, 250, 40) +
      cube(170, 270, 150, 170, 40) +
      cube(320, 350, 150, 90, 40) +
      stroke('M90,150 C130,90 190,140 214,236 C240,180 300,200 330,300 C356,250 420,260 454,322', p.a, 3, ` stroke-dasharray="3 11"${op(0.7)}`) +
      shadow(88, 176, 24, 5, 0.12) +
      marble(88, 148, 26, '#8fd3e6', '#5db8d2', '#3e93b0') +
      shadow(234, 256, 20, 4, 0.12) +
      marble(236, 222, 22, Y1, Y2, '#d99a2d') +
      shadow(396, 336, 22, 4, 0.12) +
      marble(398, 304, 26, p.m, p.a, p.d) +
      marble(300, 120, 16, '#f6b3a4', '#ec8f7c', '#d2705e') +
      marble(462, 210, 13, '#8fd3e6', '#5db8d2', '#3e93b0') +
      [[150, 110], [210, 70], [372, 230], [470, 150]].map(([x, y]) => sparkle(x, y, 9, p.m, p.a)).join('')
    );
  },

  // ラムネ型：ビー玉入りの瓶と泡
  HEFB(p, id) {
    const bottle =
      'M244,64 H276 V96 C276,110 290,116 292,132 C294,150 278,158 278,172 C278,196 322,212 322,246 V376 Q322,400 298,400 H222 Q198,400 198,376 V246 C198,212 242,196 242,172 C242,158 226,150 228,132 C230,116 244,110 244,96Z';
    return (
      circ(260, 230, 170, p.l1) +
      circ(420, 90, 42, WHITE, op(0.8)) +
      `<defs><clipPath id="${id}-b"><path d="${bottle}"/></clipPath></defs>` +
      shadow(260, 404, 110, 12, 0.1) +
      path(bottle, '#c9ecef') +
      `<g clip-path="url(#${id}-b)">` +
      rect(190, 250, 140, 160, '#96d6de') +
      rect(260, 40, 80, 380, '#5fb3c2', op(0.28)) +
      rect(212, 150, 12, 240, WHITE, op(0.7)) +
      rect(230, 180, 5, 200, WHITE, op(0.5)) +
      [[240, 330, 5], [272, 300, 4], [250, 280, 3], [290, 356, 5], [226, 370, 3], [300, 270, 3]].map(([x, y, r]) => circ(x, y, r, WHITE, op(0.85))).join('') +
      '</g>' +
      rect(240, 52, 40, 18, p.a) +
      rect(260, 52, 20, 18, p.d) +
      ball(260, 134, 17, WHITE, '#e3f5f7', '#b6e0e6', 12) +
      circ(254, 128, 4, WHITE) +
      // 泡と氷
      [[360, 190, 12], [382, 150, 8], [352, 120, 6], [150, 200, 10], [132, 150, 7], [160, 110, 5], [400, 230, 5]].map(([x, y, r]) => circ(x, y, r, 'none', ` stroke="${WHITE}" stroke-width="3"`)).join('') +
      poly([[120, 380], [150, 356], [184, 372], [154, 398]], WHITE) +
      poly([[154, 398], [184, 372], [186, 392], [158, 412]], '#bfe6ea') +
      poly([[120, 380], [154, 398], [158, 412], [124, 396]], '#dff4f5') +
      poly([[346, 386], [372, 366], [400, 382], [374, 404]], WHITE) +
      poly([[374, 404], [400, 382], [402, 398], [376, 418]], '#bfe6ea') +
      poly([[346, 386], [374, 404], [376, 418], [348, 402]], '#dff4f5') +
      [[110, 300], [420, 320], [90, 250]].map(([x, y]) => path(`M${x},${y - 12} Q${x + 7},${y} ${x},${y + 5} Q${x - 7},${y} ${x},${y - 12}Z`, '#8fd3e6')).join('')
    );
  },

  // 凪型：波の立たない海と小舟
  HESC(p, id) {
    return (
      `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6fbf9"/><stop offset="1" stop-color="#d7efe6"/></linearGradient>` +
      `<linearGradient id="${id}-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.l2}"/><stop offset="1" stop-color="${p.m}"/></linearGradient></defs>` +
      rect(0, 0, 520, 260, `url(#${id}-sky)`) +
      circ(310, 250, 64, '#fbf1cf') +
      circ(310, 250, 44, '#fae7ad') +
      mountain(90, 262, 240, 56, p.l2, p.m, 16) +
      mountain(170, 262, 150, 34, p.m, p.a, -10) +
      mountain(450, 262, 170, 40, p.l2, p.m, -14) +
      rect(0, 258, 520, 202, `url(#${id}-sea)`) +
      [[272, 348, 270], [282, 338, 284], [290, 330, 298], [296, 324, 312], [302, 318, 326]].map(([x1, x2, y]) => stroke(`M${x1},${y}H${x2}`, '#fbf1cf', 4, op(0.85))).join('') +
      [[40, 120, 300], [380, 470, 290], [60, 180, 380], [360, 480, 400], [200, 300, 430]].map(([x1, x2, y]) => stroke(`M${x1},${y}H${x2}`, WHITE, 3, op(0.45))).join('') +
      // 小舟と映り込み
      poly([[160, 222], [160, 318], [110, 318]], WHITE) +
      poly([[166, 236], [166, 318], [204, 318]], p.l1) +
      stroke('M163,214 V322', p.dd, 3) +
      poly([[100, 322], [216, 322], [202, 340], [114, 340]], p.d) +
      poly([[158, 322], [216, 322], [202, 340], [158, 340]], p.dd) +
      poly([[114, 346], [202, 346], [196, 356], [120, 356]], p.d, op(0.25)) +
      poly([[120, 362], [160, 362], [160, 400]], WHITE, op(0.18)) +
      stroke('M380,120 q8,-8 16,0 q8,-8 16,0', p.a, 3) +
      stroke('M420,150 q6,-6 12,0 q6,-6 12,0', p.a, 2.5, op(0.8))
    );
  },

  // ウィスパー型：風の通る竹林
  HESB(p, id) {
    const bamboo = (x, w, c1, c2, node) => {
      let s = rect(x, 0, w, 460, c1) + rect(x + w * 0.55, 0, w * 0.45, 460, c2);
      for (let y = 40 + (x % 60); y < 460; y += 86) s += rect(x - 2, y, w + 4, 5, node);
      return s;
    };
    const leaf = (x, y, rot, c1, c2, s = 1) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
      poly([[0, 0], [30, -8], [62, 0]], c1) +
      poly([[0, 0], [62, 0], [30, 7]], c2) +
      '</g>';
    return (
      `<defs><linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3faf7"/><stop offset="1" stop-color="#d6eee4"/></linearGradient></defs>` +
      rect(0, 0, 520, 460, `url(#${id}-bg)`) +
      crescent(400, 90, 40, '#f8f5d8') +
      bamboo(60, 18, p.l2, p.l1, p.l1) +
      bamboo(200, 16, p.l2, p.l1, p.l1) +
      bamboo(330, 18, p.l2, p.l1, p.l1) +
      bamboo(470, 16, p.l2, p.l1, p.l1) +
      stroke('M-10,210 C90,170 180,250 280,200 S430,150 530,190', WHITE, 5, op(0.9)) +
      stroke('M20,290 C120,260 200,320 300,280 S420,250 470,270 q30,10 20,30 q-10,14 -24,4', WHITE, 4, op(0.8)) +
      stroke('M60,130 C140,110 200,150 260,120', WHITE, 3, op(0.7)) +
      bamboo(20, 28, p.a, p.d, p.m) +
      bamboo(140, 34, p.m, p.a, p.l2) +
      bamboo(270, 26, p.a, p.d, p.m) +
      bamboo(410, 32, p.m, p.a, p.l2) +
      leaf(48, 90, -20, p.m, p.a) +
      leaf(40, 100, 30, p.l2, p.m, 0.8) +
      leaf(174, 180, -150, p.a, p.d) +
      leaf(174, 186, 160, p.m, p.a, 0.8) +
      leaf(296, 60, -30, p.m, p.a) +
      leaf(296, 70, 20, p.a, p.d, 0.9) +
      leaf(442, 150, -160, p.m, p.a) +
      leaf(442, 156, 170, p.l2, p.m, 0.8) +
      leaf(210, 330, 20, p.m, p.a, 0.7) +
      leaf(380, 250, -40, p.l2, p.m, 0.6) +
      leaf(100, 380, 60, p.m, p.a, 0.6) +
      rect(0, 430, 520, 30, p.a, op(0.25))
    );
  },

  // 熱量型：燃え上がる炎
  LDFC(p, id) {
    const flame = 'M260,50 C300,130 372,160 360,262 C352,340 306,386 260,386 C212,386 164,346 162,276 C160,214 196,190 206,132 C226,168 240,178 246,190 C242,146 248,100 260,50Z';
    const core = 'M262,240 C278,266 298,280 294,314 C292,340 280,352 262,352 C242,352 230,340 230,316 C230,292 246,280 262,240Z';
    return (
      `<defs><radialGradient id="${id}-glow"><stop offset="0" stop-color="#f9b98f" stop-opacity=".9"/><stop offset="1" stop-color="#f9b98f" stop-opacity="0"/></radialGradient>` +
      `<clipPath id="${id}-r"><rect x="262" y="0" width="260" height="460"/></clipPath></defs>` +
      circ(262, 260, 220, `url(#${id}-glow)`) +
      stroke('M110,120 q12,-14 0,-28 q-12,-14 0,-28', p.l2, 4) +
      stroke('M420,150 q12,-14 0,-28 q-12,-14 0,-28', p.l2, 4) +
      stroke('M440,300 q10,-12 0,-24', p.l2, 4) +
      path(flame, p.a) +
      `<g clip-path="url(#${id}-r)">${path(flame, p.d)}</g>` +
      path('M262,150 C290,200 330,220 322,286 C318,338 292,366 262,366Z', '#ee8a5c') +
      path('M262,150 C254,180 252,210 254,238 C250,230 242,224 230,204 C224,236 200,254 200,294 C202,342 230,366 262,366Z', '#f7a86c') +
      path(core, Y1) +
      path('M262,240 C278,266 298,280 294,314 C292,340 280,352 262,352Z', Y2) +
      rock(120, 360, 120, 70, '#c79aa3', '#9c6b75', '#7e515c') +
      rock(290, 364, 130, 66, '#c79aa3', '#9c6b75', '#7e515c') +
      rock(214, 390, 100, 50, '#d5adb4', '#a8767f', '#875962') +
      [[200, 110, 8], [330, 90, 10], [380, 200, 7], [150, 210, 6], [300, 40, 6], [226, 60, 5]].map(([x, y, s]) =>
        poly([[x, y - s], [x + s * 0.6, y], [x, y + s], [x - s * 0.6, y]], Y2)).join('')
    );
  },

  // 実況型：スポットライトとマイク
  LDFB(p, id) {
    const tower = (x, flip) =>
      stroke(`M${x},460 V110`, p.dd, 8) +
      stroke(`M${x - 22},460 L${x},300 L${x + 22},460`, p.dd, 4) +
      rect(x - 46, 60, 92, 58, p.dd) +
      [0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => circ(x - 33 + c * 22, 74 + r * 15, 6, '#fff3cf')).join('')).join('') +
      poly(flip ? [[x - 40, 118], [x + 40, 118], [260, 380], [130, 380]] : [[x - 40, 118], [x + 40, 118], [390, 380], [260, 380]], '#fff3cf', op(0.3));
    return (
      rect(0, 0, 520, 460, p.bg) +
      circ(260, 230, 170, p.l1) +
      tower(70, false) +
      tower(450, true) +
      // ステージ
      poly([[60, 380], [460, 380], [500, 420], [20, 420]], p.l2) +
      poly([[20, 420], [500, 420], [500, 460], [20, 460]], p.a) +
      poly([[260, 420], [500, 420], [500, 460], [260, 460]], p.d) +
      shadow(260, 386, 80, 10, 0.14) +
      // マイク
      ell(260, 380, 60, 12, p.dd) +
      rect(254, 250, 12, 130, p.dd) +
      path('M212,250 Q212,300 260,300 Q308,300 308,250', 'none', ` stroke="${p.dd}" stroke-width="8"`) +
      `<defs><clipPath id="${id}-mic"><rect x="222" y="120" width="76" height="150" rx="38"/></clipPath></defs>` +
      `<g clip-path="url(#${id}-mic)">` +
      rect(222, 120, 76, 150, p.m) +
      rect(260, 120, 38, 150, p.a) +
      [140, 158, 176, 194, 212].map((y) => rect(222, y, 76, 5, p.d, op(0.5))).join('') +
      rect(222, 232, 76, 38, p.d) +
      rect(260, 232, 38, 38, p.dd) +
      '</g>' +
      rect(234, 132, 8, 90, WHITE, op(0.35)) +
      // 声の広がり
      stroke('M190,160 q-24,40 0,80', p.a, 8) +
      stroke('M160,140 q-38,60 0,120', p.a, 8, op(0.7)) +
      stroke('M130,122 q-52,78 0,156', p.a, 8, op(0.45)) +
      stroke('M330,160 q24,40 0,80', p.a, 8) +
      stroke('M360,140 q38,60 0,120', p.a, 8, op(0.7)) +
      stroke('M390,122 q52,78 0,156', p.a, 8, op(0.45)) +
      sparkle(160, 330, 14, Y1, Y2) +
      sparkle(372, 320, 18, Y1, Y2) +
      sparkle(410, 200, 8, Y1, Y2)
    );
  },

  // 焚き火型：夜のキャンプ
  LDSC(p, id) {
    const fire = (x, y, s, c1, c2) =>
      path(`M${x},${y - 90 * s} C${x + 30 * s},${y - 50 * s} ${x + 46 * s},${y - 30 * s} ${x + 40 * s},${y} H${x - 40 * s} C${x - 46 * s},${y - 30 * s} ${x - 20 * s},${y - 44 * s} ${x - 12 * s},${y - 64 * s} C${x - 6 * s},${y - 54 * s} ${x},${y - 52 * s} ${x + 2 * s},${y - 48 * s} C${x - 4 * s},${y - 64 * s} ${x - 4 * s},${y - 78 * s} ${x},${y - 90 * s}Z`, c1) +
      path(`M${x},${y - 90 * s} C${x + 30 * s},${y - 50 * s} ${x + 46 * s},${y - 30 * s} ${x + 40 * s},${y} H${x}Z`, c2);
    return (
      `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2342"/><stop offset="1" stop-color="#553252"/></linearGradient>` +
      `<radialGradient id="${id}-glow"><stop offset="0" stop-color="#f7a35c" stop-opacity=".75"/><stop offset="1" stop-color="#f7a35c" stop-opacity="0"/></radialGradient></defs>` +
      rect(0, 0, 520, 460, `url(#${id}-sky)`) +
      stars([[40, 40, 2], [110, 80, 1.6], [200, 30, 2], [320, 60, 1.6], [470, 40, 2], [430, 120, 1.4], [260, 110, 1.4], [70, 150, 1.4]], WHITE, 0.8) +
      crescent(380, 80, 26, '#f9eecb') +
      pine(60, 330, 200, '#4d3658', '#3c2a48', '#2a1d33') +
      pine(130, 320, 150, '#5e4066', '#4a3252', '#2a1d33') +
      pine(440, 330, 210, '#4d3658', '#3c2a48', '#2a1d33') +
      pine(500, 320, 150, '#5e4066', '#4a3252', '#2a1d33') +
      poly([[0, 318], [520, 318], [520, 460], [0, 460]], '#3d2a42') +
      poly([[0, 318], [520, 318], [520, 334], [0, 334]], '#4b3350') +
      circ(290, 360, 170, `url(#${id}-glow)`) +
      // テント
      poly([[150, 216], [70, 356], [150, 356]], p.a) +
      poly([[150, 216], [150, 356], [236, 356]], p.d) +
      poly([[150, 262], [126, 356], [174, 356]], '#2a1c30') +
      poly([[150, 262], [150, 356], [174, 356]], '#f2a567', op(0.35)) +
      stroke('M150,216 L150,200', p.l2, 3) +
      // 焚き火
      ell(300, 404, 66, 12, '#2b1d2e', op(0.6)) +
      [[248, 402], [270, 412], [300, 416], [330, 412], [352, 402]].map(([x, y]) => ell(x, y, 12, 8, '#8a6a78')).join('') +
      `<g transform="rotate(-16 300 392)">${rect(250, 384, 100, 16, '#7a4a3a')}${rect(250, 392, 100, 8, '#5b372c')}</g>` +
      `<g transform="rotate(16 300 392)">${rect(250, 384, 100, 16, '#8a5644')}${rect(250, 392, 100, 8, '#5b372c')}</g>` +
      fire(300, 390, 1.35, '#ef7a5a', '#d85f4a') +
      fire(300, 390, 0.95, '#f7a35c', '#ee8a4c') +
      fire(300, 390, 0.55, Y1, Y2) +
      [[330, 250], [282, 226], [352, 206], [300, 186]].map(([x, y], i) => circ(x, y, 3 - i * 0.4, Y1)).join('')
    );
  },

  // 語りべ型：開いた本から広がる物語
  LDSB(p, id) {
    return (
      circ(260, 200, 170, p.l1) +
      stars([[120, 80, 4], [400, 70, 5], [440, 170, 3], [90, 190, 3]], p.m, 0.9) +
      crescent(150, 110, 26, Y1) +
      // 浮かぶ島とお城
      poly([[180, 214], [340, 214], [310, 250], [280, 282], [240, 268], [206, 244]], '#b98791') +
      poly([[260, 214], [340, 214], [310, 250], [280, 282], [260, 272]], '#9c6b75') +
      poly([[176, 206], [344, 206], [340, 216], [180, 216]], '#9fcf8a') +
      rect(214, 146, 30, 60, p.m) +
      rect(229, 146, 15, 60, p.a) +
      poly([[210, 146], [229, 110], [248, 146]], p.d) +
      poly([[229, 110], [248, 146], [229, 146]], p.dd) +
      rect(244, 164, 44, 42, p.l2) +
      rect(266, 164, 22, 42, p.m) +
      [250, 262, 274].map((x) => rect(x, 156, 8, 10, p.l2)).join('') +
      rect(258, 180, 16, 26, p.dd) +
      path('M258,188 a8,8 0 0,1 16,0Z', p.dd) +
      rect(288, 132, 28, 74, p.m) +
      rect(302, 132, 14, 74, p.a) +
      poly([[284, 132], [302, 92], [320, 132]], p.d) +
      poly([[302, 92], [320, 132], [302, 132]], p.dd) +
      rect(298, 150, 8, 12, Y1) +
      rect(225, 164, 8, 12, Y1) +
      stroke('M360,140 q8,-8 16,0 q8,-8 16,0', p.d, 3) +
      stroke('M140,250 q6,-6 12,0 q6,-6 12,0', p.d, 2.5) +
      // 本から立ちのぼる光
      stroke('M262,340 C230,310 300,300 262,270', Y2, 4, ` stroke-dasharray="2 12"`) +
      [[210, 320, 3], [312, 316, 4], [236, 296, 2.5], [296, 290, 2.5], [180, 290, 2], [340, 292, 2]].map(([x, y, r]) => circ(x, y, r, Y2)).join('') +
      // 本
      shadow(262, 414, 200, 14, 0.1) +
      path('M262,360 Q190,340 60,356 L66,412 Q180,398 262,414Z', p.a) +
      path('M262,360 Q334,340 464,356 L458,412 Q344,398 262,414Z', p.d) +
      path('M262,352 Q190,328 74,340 L78,398 Q180,384 262,404Z', '#fffaf6') +
      path('M262,352 Q334,328 450,340 L446,398 Q344,384 262,404Z', '#f6e3e7') +
      [0, 1, 2, 3].map((i) => stroke(`M${100},${354 + i * 10} Q180,${346 + i * 10} 240,${358 + i * 10}`, p.l2, 3)).join('') +
      [0, 1, 2, 3].map((i) => stroke(`M${284},${358 + i * 10} Q344,${346 + i * 10} 424,${354 + i * 10}`, p.m, 3, op(0.6))).join('') +
      stroke('M262,352 V406', p.d, 2) +
      // ろうそく
      shadow(446, 300, 26, 5, 0.12) +
      rect(430, 230, 32, 70, '#fffaf6') +
      rect(446, 230, 16, 70, p.l1) +
      ell(446, 230, 16, 5, '#fffaf6') +
      stroke('M446,228 V216', p.dd, 2) +
      path('M446,184 C456,200 458,210 446,216 C434,210 436,200 446,184Z', Y2) +
      path('M446,196 C451,204 451,210 446,213 C441,210 441,204 446,196Z', Y1)
    );
  },

  // ブラックコーヒー型：湯気の立つ一杯
  LEFC(p, id) {
    const bean = (x, y, rot) =>
      `<g transform="translate(${x} ${y}) rotate(${rot})">` +
      ell(0, 0, 15, 10, '#6b4636') +
      path('M0,-10 A15,10 0 0,1 0,10Z', '#4f3226') +
      stroke('M-11,0 C-4,-5 4,5 11,0', '#3a241b', 2.4) +
      '</g>';
    return (
      circ(260, 230, 170, p.l1) +
      rect(0, 380, 520, 80, p.l2) +
      rect(0, 380, 520, 10, p.m, op(0.5)) +
      // 湯気
      stroke('M220,210 C200,180 240,160 220,120 C206,96 226,80 236,70', WHITE, 9, op(0.95)) +
      stroke('M266,200 C248,168 290,150 268,108 C256,84 276,66 284,56', WHITE, 9, op(0.95)) +
      stroke('M308,212 C292,188 326,172 310,140', WHITE, 9, op(0.95)) +
      // ソーサー
      ell(262, 382, 164, 32, p.m) +
      ell(262, 376, 160, 30, WHITE) +
      path('M262,346 A160,30 0 0,1 422,376 A160,30 0 0,1 262,406Z', '#e3e5f7') +
      ell(262, 372, 96, 16, p.l1) +
      // カップ
      path('M364,270 C412,262 416,330 360,336', 'none', ` stroke="${WHITE}" stroke-width="18"`) +
      path('M364,270 C412,262 416,330 360,336', 'none', ` stroke="#e3e5f7" stroke-width="6" transform="translate(4 2)"`) +
      path('M168,246 H356 L340,342 Q334,370 304,372 H220 Q190,370 184,342Z', WHITE) +
      path('M290,246 H356 L340,342 Q334,370 304,372 H290Z', '#e3e5f7') +
      path('M176,292 H348 L343,318 H181Z', p.a) +
      path('M290,292 H348 L343,318 H290Z', p.d) +
      ell(262, 246, 94, 20, '#f4f5fc') +
      ell(262, 248, 82, 15, '#3b2823') +
      ell(240, 244, 26, 5, '#6b4a3e', op(0.8)) +
      bean(90, 410, -20) +
      bean(126, 426, 30) +
      bean(430, 418, 14) +
      bean(462, 400, -40) +
      bean(70, 440, 60)
    );
  },

  // モノクロ型：白と黒だけのチェス盤
  LEFB(p) {
    const floor = [];
    const rows = [300, 320, 344, 372, 408, 460];
    const half = (y) => 170 + ((y - 300) / 160) * 150;
    for (let r = 0; r < rows.length - 1; r++) {
      for (let c = 0; c < 8; c++) {
        const y0 = rows[r], y1 = rows[r + 1];
        const x = (y, k) => 260 - half(y) + (2 * half(y) * k) / 8;
        floor.push(poly([[x(y0, c), y0], [x(y0, c + 1), y0], [x(y1, c + 1), y1], [x(y1, c), y1]], (r + c) % 2 ? '#4a4d5c' : '#e4e5ec'));
      }
    }
    const W = ['#fbfbfd', '#d8d9e1'];
    const B = ['#4b4e5d', '#2c2e38'];
    const base = (x, y, w, c) =>
      poly([[x - w, y], [x + w, y], [x + w * 0.9, y - 16], [x - w * 0.9, y - 16]], c[0]) +
      poly([[x, y], [x + w, y], [x + w * 0.9, y - 16], [x, y - 16]], c[1]);
    const body = (x, yb, yt, wb, wt, c) =>
      poly([[x - wb, yb], [x - wt, yt], [x + wt, yt], [x + wb, yb]], c[0]) + poly([[x, yb], [x, yt], [x + wt, yt], [x + wb, yb]], c[1]);
    const king = (x, y, c) =>
      base(x, y, 44, c) +
      body(x, y - 16, y - 150, 34, 18, c) +
      base(x, y - 150, 30, c) +
      poly([[x - 26, y - 166], [x - 34, y - 200], [x + 34, y - 200], [x + 26, y - 166]], c[0]) +
      poly([[x, y - 166], [x, y - 200], [x + 34, y - 200], [x + 26, y - 166]], c[1]) +
      rect(x - 6, y - 240, 12, 40, c[0]) +
      rect(x, y - 240, 6, 40, c[1]) +
      rect(x - 18, y - 228, 36, 11, c[0]) +
      rect(x, y - 228, 18, 11, c[1]);
    const rook = (x, y, c) =>
      base(x, y, 36, c) +
      body(x, y - 16, y - 96, 28, 22, c) +
      rect(x - 30, y - 124, 60, 28, c[0]) +
      rect(x, y - 124, 30, 28, c[1]) +
      [-30, -6, 18].map((dx) => rect(x + dx, y - 138, 12, 14, dx < 0 ? c[0] : c[1])).join('');
    const pawn = (x, y, c) =>
      base(x, y, 30, c) + body(x, y - 16, y - 70, 22, 11, c) + base(x, y - 70, 20, c) + ball(x, y - 96, 22, c[0], c[0], c[1], 12);
    return (
      rect(0, 0, 520, 460, '#f2f2f6') +
      circ(260, 190, 150, '#e3e4eb') +
      floor.join('') +
      shadow(160, 382, 44, 8, 0.2) +
      rook(160, 382, B) +
      shadow(264, 408, 52, 9, 0.2) +
      king(264, 408, W) +
      shadow(372, 360, 34, 6, 0.2) +
      pawn(372, 360, B) +
      shadow(440, 330, 26, 5, 0.18) +
      pawn(440, 330, W) +
      stars([[70, 90, 4], [440, 110, 5], [110, 200, 3]], '#b9bac6', 1)
    );
  },

  // ベルベット型：幕の降りた舞台とマイク
  LESC(p, id) {
    const curtain = (flip) => {
      const d = 'M-10,0 H190 C176,110 132,214 84,268 C120,320 132,396 120,420 H-10Z';
      const g = flip ? ' transform="translate(520 0) scale(-1 1)"' : '';
      const cid = `${id}-c${flip ? 'r' : 'l'}`;
      return (
        `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs>` +
        `<g${g}>` +
        path(d, p.d) +
        `<g clip-path="url(#${cid})">` +
        [0, 44, 88, 132].map((x) => path(`M${x},0 C${x + 10},120 ${x - 10},200 ${x - 60},262 C${x - 20},330 ${x - 20},380 ${x - 30},420 H${x - 12} C${x},380 ${x},330 ${x - 40},262 C${x + 12},200 ${x + 26},120 ${x + 18},0Z`, p.a)).join('') +
        [22, 66, 110].map((x) => path(`M${x},0 C${x + 6},120 ${x - 14},200 ${x - 56},262 C${x - 26},330 ${x - 26},380 ${x - 34},420 H${x - 28} C${x - 18},380 ${x - 18},330 ${x - 48},262 C${x - 4},200 ${x + 14},120 ${x + 8},0Z`, p.dd, op(0.6))).join('') +
        '</g>' +
        ell(84, 268, 16, 10, Y2) +
        '</g>'
      );
    };
    return (
      rect(0, 0, 520, 460, '#262a52') +
      poly([[226, 0], [294, 0], [410, 410], [110, 410]], WHITE, op(0.08)) +
      poly([[244, 0], [276, 0], [350, 410], [170, 410]], WHITE, op(0.07)) +
      rect(0, 400, 520, 60, '#1c1f40') +
      poly([[0, 400], [520, 400], [520, 408], [0, 408]], p.dd) +
      ell(260, 410, 150, 22, WHITE, op(0.14)) +
      // マイクスタンド
      ell(260, 408, 40, 8, '#15172f') +
      stroke('M260,406 V206', '#c8cbe0', 5) +
      stroke('M236,408 L260,386 L284,408', '#c8cbe0', 4) +
      `<defs><clipPath id="${id}-mic"><rect x="232" y="118" width="56" height="92" rx="28"/></clipPath></defs>` +
      `<g clip-path="url(#${id}-mic)">` +
      rect(232, 118, 56, 92, '#e6e8f4') +
      rect(260, 118, 28, 92, '#b9bdd8') +
      [132, 144, 156, 168, 180].map((y) => rect(232, y, 56, 3, '#8f94b8', op(0.7))).join('') +
      '</g>' +
      rect(236, 196, 48, 10, Y2) +
      rect(260, 196, 24, 10, '#d9982e') +
      // 足もとのバラ
      stroke('M322,400 C340,392 362,388 380,392', '#5f9a64', 4) +
      poly([[346, 394], [356, 384], [362, 396]], '#5f9a64') +
      ball(318, 396, 14, '#f2a1b3', '#e27b93', '#c65a74', 10) +
      stroke('M312,394 q6,-8 12,0 q-6,6 -10,2', '#b24a64', 2) +
      curtain(false) +
      curtain(true) +
      rect(0, 0, 520, 34, p.a) +
      [...Array(9)].map((_, i) => circ(29 + i * 58, 34, 29, p.a)).join('') +
      [...Array(9)].map((_, i) => circ(29 + i * 58, 40, 20, p.d, op(0.5))).join('') +
      rect(0, 0, 520, 14, p.d)
    );
  },

  // 深夜ラジオ型：夜の街とラジオ
  LESB(p, id) {
    const windows = [];
    const bld = [[0, 250, 70], [64, 210, 60], [118, 272, 52], [164, 230, 70], [228, 190, 56], [278, 256, 64], [336, 220, 60], [390, 268, 54], [438, 200, 82]];
    let k = 0;
    for (const [x, y, w] of bld) {
      for (let yy = y + 16; yy < 360; yy += 22) {
        for (let xx = x + 10; xx < x + w - 10; xx += 16) {
          k = (k * 7 + 3) % 11;
          if (k < 3) windows.push(rect(xx, yy, 8, 10, Y1, op(0.9)));
        }
      }
    }
    return (
      `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2250"/><stop offset="1" stop-color="#434a8e"/></linearGradient></defs>` +
      rect(0, 0, 520, 460, `url(#${id}-sky)`) +
      stars([[40, 40, 2], [130, 70, 1.6], [220, 30, 2], [300, 90, 1.4], [470, 50, 2], [360, 140, 1.4], [90, 150, 1.4], [200, 130, 1.4]], WHITE, 0.8) +
      crescent(420, 90, 34, '#f7f1d0') +
      bld.map(([x, y, w], i) => rect(x, y, w, 200, i % 2 ? '#2d3268' : '#363c7a') + rect(x + w * 0.62, y, w * 0.38, 200, '#262a5a', op(0.5))).join('') +
      windows.join('') +
      // 窓辺
      poly([[0, 360], [520, 360], [520, 460], [0, 460]], p.d) +
      poly([[0, 360], [520, 360], [520, 376], [0, 376]], p.a) +
      // ラジオ
      shadow(262, 372, 130, 10, 0.25) +
      stroke('M340,232 L402,150', '#c8cbe0', 4) +
      circ(402, 150, 5, '#c8cbe0') +
      path('M200,236 Q200,210 226,210 H298 Q324,210 324,236', 'none', ` stroke="${p.dd}" stroke-width="10"`) +
      rect(146, 236, 232, 134, p.m, ' rx="18"') +
      rect(262, 236, 116, 134, p.a, ' rx="18"') +
      rect(262, 236, 40, 134, p.a) +
      rect(146, 236, 232, 16, p.l2, ' rx="8"') +
      circ(216, 306, 44, p.dd) +
      [...Array(5)].map((_, r) => [...Array(5)].map((_, c) => circ(196 + c * 10, 286 + r * 10, 2.6, p.m)).join('')).join('') +
      rect(282, 272, 76, 30, '#f5ecc6', ' rx="4"') +
      [292, 304, 316, 328, 340].map((x) => stroke(`M${x},278 V${x % 24 ? 290 : 296}`, p.d, 2)).join('') +
      stroke('M318,272 V302', '#e0574f', 2.5) +
      circ(300, 334, 12, p.dd) +
      circ(340, 334, 12, p.dd) +
      circ(300, 334, 4, p.l2) +
      circ(340, 334, 4, p.l2) +
      // 流れる音
      stroke('M120,280 q-20,26 0,52', Y1, 6, op(0.9)) +
      stroke('M96,262 q-34,44 0,88', Y1, 6, op(0.6)) +
      stroke('M72,244 q-48,62 0,124', Y1, 6, op(0.35)) +
      // マグカップ
      rect(410, 318, 44, 52, '#f4f5fc', ' rx="6"') +
      rect(432, 318, 22, 52, '#d6d9f0', ' rx="6"') +
      path('M454,330 q20,0 20,14 q0,14 -20,14', 'none', ` stroke="#f4f5fc" stroke-width="7"`) +
      stroke('M424,306 q-8,-12 0,-24 M440,304 q-8,-12 0,-24', WHITE, 4, op(0.7))
    );
  },
};

/** タイプのイラストをSVG文字列で返す。idPrefix は同じページに複数並べるときの衝突よけ */
export function art(code, idPrefix = 'art') {
  const p = PAL[code.slice(0, 2)];
  const id = `${idPrefix}-${code}`;
  return `<svg viewBox="0 0 520 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${rect(0, 0, 520, 460, p.bg)}${SCENES[code](p, id)}</svg>`;
}

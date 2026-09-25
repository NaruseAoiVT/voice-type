// Xに投稿する文
//
// Xの文字数は、日本語などの全角文字を2、英数字や記号を1、URLを一律23として数える（上限280＝全角140字）。
// 投稿画面ではURLの前に半角スペースが1つ入るので、本文に使えるのは 280 − 23 − 1 = 256。
// 上限いっぱいまで使い、はみ出しそうなら「得意な配信」の項目を後ろから減らす。

import { TYPES } from './types.js';

const LIMIT = 280;
const URL_WEIGHT = 23;

/** Xと同じ数え方で文字数を数える */
export function xWeight(text) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const narrow =
      (c >= 0 && c <= 4351) || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247);
    w += narrow ? 1 : 2;
  }
  return w;
}

/** 本文（URLを除く）を組み立てる */
export function shareText(code) {
  const t = TYPES[code];
  const build = (strong, invite) =>
    [
      `私の声は「${t.name}（${code}）」でした！`,
      '',
      t.share,
      '',
      strong.length ? `得意な配信：${strong.join('・')}` : null,
      invite ? 'あなたの声は何タイプ？' : null,
      '#声質診断',
    ]
      .filter((x) => x !== null)
      .join('\n');
  const fits = (text) => xWeight(text) + 1 + URL_WEIGHT <= LIMIT;

  // 1. 余裕があれば「あなたの声は何タイプ？」も入れる（得意な配信は削らない）
  let text = build(t.strong, true);
  if (fits(text)) return text;
  // 2. 入らなければ呼びかけを外し、それでも長ければ得意な配信を後ろから減らす
  let strong = [...t.strong];
  text = build(strong, false);
  while (!fits(text) && strong.length) {
    strong = strong.slice(0, -1);
    text = build(strong, false);
  }
  return text;
}

/** URLも含めた、投稿全体の文字数 */
export function shareWeight(code) {
  return xWeight(shareText(code)) + 1 + URL_WEIGHT;
}

export const SHARE_LIMIT = LIMIT;

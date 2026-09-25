// 質問
//
// 答えはタイプ判定には使わない。機材の推奨とアドバイスの出し分けだけに使う。
// 声から測れないこと（部屋・機材・目指す方向）を補うのが役目。

export const QUESTIONS = [
  {
    id: 'genre',
    q: 'いちばん多い配信は？',
    options: [
      { v: 'talk', label: '雑談' },
      { v: 'game', label: 'ゲーム実況' },
      { v: 'asmr', label: 'ASMR・歌' },
      { v: 'info', label: '解説・企画' },
    ],
  },
  {
    id: 'room',
    q: '録る場所の環境は？',
    options: [
      { v: 'quiet', label: 'ひとりで静かに録れる' },
      { v: 'normal', label: 'ふつう' },
      { v: 'noisy', label: '同居人がいる・生活音が入る' },
    ],
  },
  {
    id: 'time',
    q: 'よく配信する時間帯は？',
    options: [
      { v: 'night', label: '深夜が中心' },
      { v: 'day', label: '日中・夕方が中心' },
    ],
  },
  {
    id: 'mic',
    q: 'いま使っているマイクは？',
    options: [
      { v: 'builtin', label: 'スマホ・パソコン内蔵' },
      { v: 'usb', label: 'USBマイク' },
      { v: 'xlr', label: 'マイク＋オーディオインターフェース' },
      { v: 'unknown', label: 'わからない' },
    ],
  },
  {
    id: 'budget',
    q: '機材にかけられる予算は？',
    options: [
      { v: 'entry', label: '〜2万円' },
      { v: 'standard', label: '2〜5万円' },
      { v: 'pro', label: '10万円〜' },
      { v: 'none', label: 'まだ決めていない' },
    ],
  },
  {
    id: 'goal',
    q: 'どんな印象を持たれたい？',
    options: [
      { v: 'calm', label: '安心感' },
      { v: 'energy', label: '元気' },
      { v: 'cool', label: 'かっこいい' },
      { v: 'cute', label: 'かわいい' },
    ],
  },
];

// 「なりたい印象」に対する一言。タイプの持ち味との距離で書き分ける。
export const GOAL_ADVICE = {
  calm: {
    近い: '狙っている方向と、いまの声の性格が一致しています。無理に変えずに、そのまま磨くのが最短です。',
    遠い: 'いまの声は勢いのほうに寄っています。語尾を伸ばして下げる、句点でひと呼吸置く。この2つで、安心感のある印象に近づきます。',
  },
  energy: {
    近い: '狙っている方向と、いまの声の性格が一致しています。持ち味をそのまま押し出して問題ありません。',
    遠い: 'いまの声は落ち着きのほうに寄っています。語尾をひとつ上げる、リアクションの第一声で音量を上げる。作り込まずにこの2点から始めてください。',
  },
  cool: {
    近い: '狙っている方向と、いまの声の性格が一致しています。飾らないほうが効きます。',
    遠い: 'いまの声は親しみのほうに寄っています。言い切って止める、余計な相づちを減らす。削るほうに寄せると近づきます。',
  },
  cute: {
    近い: '狙っている方向と、いまの声の性格が一致しています。いまの話し方を変える必要はありません。',
    遠い: 'いまの声は落ち着きのほうに寄っています。語尾を軽く上げる、話す速さを少し上げる。この2つで近づきます。作り声は長時間で崩れるので、声の高さは変えないほうが自然です。',
  },
};

/** 狙っている印象と、声の性格が近いかどうか */
export function goalFit(goal, axes) {
  switch (goal) {
    case 'calm':
      return !axes.dynamic || !axes.fast;
    case 'energy':
      return axes.dynamic && axes.fast;
    case 'cool':
      return !axes.high && !axes.dynamic;
    case 'cute':
      return axes.high && axes.dynamic;
    default:
      return true;
  }
}

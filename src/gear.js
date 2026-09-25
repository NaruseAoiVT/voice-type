// マイクの推奨
//
// 判断は2段階。
//   1. ダイナミックかコンデンサーか → 決め手は「声」より「部屋」
//   2. 指向性 → 基本はカーディオイド。うるさい部屋だけハイパー/スーパーへ

// ── 販売店の設定 ──────────────────────────
// idを入れると成果が計上される。空のままなら、ふつうのリンクとして開く。
export const STORES = {
  amazon: {
    name: 'Amazon',
    tag: 'naruseaoi-22', // Amazonアソシエイトのトラッキングid
  },
  rakuten: {
    name: '楽天市場',
    // アフィリエイトはしない。ふつうのリンクとして開く
  },
  soundhouse: {
    name: 'サウンドハウス',
    // アフィリエイトはしない。ふつうのリンクとして開く
  },
};

export const BANDS = {
  entry: { name: '入門', range: '〜2万円', note: 'USB直結。買ってすぐ使える' },
  standard: { name: '一般', range: '2〜5万円台', note: '配信者の主戦場。長く使える' },
  pro: { name: '本格', range: '10万円〜', note: '部屋の静けさを用意できる人向け' },
};

// capsule: dynamic = ダイナミック / condenser = コンデンサー
// q         = 販売店で検索するときの言葉
// amazonUrl = アフィリエイトリンク。入っていればこちらが優先される
// with      = 一緒に必要なもの（これがないと使えない）
// plus      = あると安心なもの
// instead   = 別の選び方
//
// 機材の選定とリンクは鳴瀬碧衣のnote記事に合わせている。
// 記事にある商品は、記事のアフィリエイトリンク（amzn.to）をそのまま使う。
// https://note.com/naruse_aoi/n/n0bfe4962d916
// 価格は2026年9月時点のサウンドハウスの税込価格をもとにした目安。

// 記事のリンク（どれもタグ naruseaoi-22 で正しい商品に飛ぶことを確認済み）
const NOTE = {
  SM58: 'https://amzn.to/4rEosYZ',
  BETA57A: 'https://amzn.to/3MmcSkW',
  AT4040: 'https://amzn.to/4iIIHAl',
  C214: 'https://amzn.to/4prXlPc',
  M2: 'https://amzn.to/4rJDgoS',
  ID4: 'https://amzn.to/4ppyg7C',
  DM1: 'https://amzn.to/4akXeAr',
  BELDEN: 'https://amzn.to/4pMNWBA',
  CANARE: 'https://amzn.to/4pqtTJr',
  MOGAMI: 'https://amzn.to/3Yc4yqr',
  OYAIDE: 'https://amzn.to/4rZWNSv',
};

// 記事にない商品で、あとからリンクをもらったもの（どれもタグ naruseaoi-22 で確認済み）
const ARM = {
  name: 'マイクアーム audio-technica AT8700J',
  q: 'AT8700J',
  amazonUrl: 'https://link.amazon/B02GYesNf',
  price: '約1.1万円',
  note: 'マイクを口元に固定するなら',
};
const ARM_PRO = {
  name: 'マイクアーム RØDE PSA1',
  q: 'RODE PSA1',
  amazonUrl: 'https://link.amazon/B09Ru8veb',
  price: '約1.5万円',
  note: '重いマイクもしっかり支えるなら',
};
const POP = {
  name: 'ポップガード STEDMAN PROSCREEN 101',
  q: 'PROSCREEN 101',
  amazonUrl: 'https://link.amazon/B0cQ6HQvf',
  price: '約1万円',
  note: '「パ」「バ」の息がマイクに当たる音を防ぐなら',
};
const ABSORB = {
  name: 'マイク用吸音材 Aokeo リフレクションフィルター',
  q: 'リフレクションフィルター',
  amazonUrl: 'https://link.amazon/B04AEFHXS',
  price: '約3千円',
  note: '部屋の反響を拾いにくくするなら（マイクの奥側を囲むように付ける）',
};

const M2 = { name: 'オーディオインターフェース MOTU M2', q: 'MOTU M2', amazonUrl: NOTE.M2, price: '約3.6万円' };
const BELDEN = { name: 'XLRケーブル BELDEN 1192A', q: 'BELDEN 1192A', amazonUrl: NOTE.BELDEN, price: '約3千円' };

export const GEAR = [
  // ── ダイナミック ──────────────────────────
  {
    band: 'entry',
    capsule: 'dynamic',
    name: 'audio-technica AT2005USB',
    q: 'AT2005USB',
    amazonUrl: 'https://link.amazon/B0hoANVxN',
    pattern: 'カーディオイド',
    connection: 'USBとXLRの両方',
    price: '約1.4万円',
    why: 'USBでつなげばすぐに使えて、あとからオーディオインターフェースを足しても使い続けられます。生活音を拾いにくいので、防音していない部屋でもOK！',
  },
  {
    band: 'standard',
    capsule: 'dynamic',
    name: 'SHURE SM58 ＋ MOTU M2',
    q: 'SHURE SM58',
    amazonUrl: NOTE.SM58,
    pattern: 'カーディオイド',
    connection: 'XLR接続',
    price: 'マイク約1.6万円＋MOTU M2 約3.6万円',
    why: 'SM58は世界中のライブハウスとスタジオにある定番で、壊れにくく値崩れもしません。MOTU M2はループバックを積んでいるので、BGMを流しながらの配信がそのままできます。',
    with: [M2, BELDEN],
    plus: [
      ARM,
      {
        name: 'プリアンプ SE ELECTRONICS DM1 DYNAMITE',
        q: 'DM1 DYNAMITE',
        amazonUrl: NOTE.DM1,
        price: '約1.1万円',
        note: '声が小さめで、音量を上げると雑音が気になるなら',
      },
    ],
    instead: [
      {
        name: 'SHURE BETA 57A',
        q: 'BETA 57A',
        amazonUrl: NOTE.BETA57A,
        price: '約2.2万円',
        note: 'ゲーム実況でキーボードの音を切りたいなら',
      },
      {
        name: 'SHURE MV7+',
        q: 'MV7+',
        amazonUrl: 'https://link.amazon/B05EuhV7Z',
        price: '約4.7万円',
        note: 'USB1本で完結させたいなら',
      },
      {
        name: 'オーディオインターフェース YAMAHA UR22MK3',
        q: 'UR22MK3',
        amazonUrl: 'https://link.amazon/B074ioB8W',
        price: '約2万円',
        note: '作曲ソフト（Cubase AI付属）も使いたいなら、M2の代わりに',
      },
    ],
  },
  {
    band: 'pro',
    capsule: 'dynamic',
    name: 'SHURE SM7dB ＋ MOTU M2',
    q: 'SM7dB',
    amazonUrl: 'https://link.amazon/B07NFetvL',
    pattern: 'カーディオイド',
    connection: 'XLR接続',
    price: 'マイク約7.7万円＋MOTU M2 約3.6万円',
    why: '増幅回路を内蔵していて、小さめの声でもノイズなく持ち上がります。騒がしい部屋でもOK！高級機のなかでは貴重な1本です。',
    with: [M2, BELDEN],
    plus: [ARM_PRO],
    instead: [
      {
        name: 'AUDIENT iD4mkII',
        q: 'iD4mkII',
        amazonUrl: NOTE.ID4,
        price: '約3.3万円',
        note: 'オーディオインターフェースを上位にするなら（設定は上級者向け）',
      },
    ],
  },

  // ── コンデンサー ──────────────────────────
  {
    band: 'entry',
    capsule: 'condenser',
    name: 'audio-technica AT2020USB-X',
    q: 'AT2020USB-X',
    amazonUrl: 'https://link.amazon/B01psvpF5',
    pattern: 'カーディオイド',
    connection: 'USB直結',
    price: '約2万円',
    why: '定番AT2020のUSB版。高い成分まで素直に出るので、明るい声や囁きの質感がそのまま残ります。静かな部屋であることが条件です。',
    plus: [POP],
  },
  {
    band: 'standard',
    capsule: 'condenser',
    name: 'audio-technica AT2035 ＋ YAMAHA AG03MK2',
    q: 'AT2035',
    amazonUrl: 'https://link.amazon/B0gLTdT3E',
    pattern: 'カーディオイド',
    connection: 'XLR接続',
    price: 'マイク約1.7万円＋AG03MK2 約2.5万円',
    why: '入門機より低音に余裕があり、声が薄くなりません。AG03MK2はつまみで音量や効果音を手元から操作できます。',
    with: [
      { name: '配信用ミキサー YAMAHA AG03MK2', q: 'AG03MK2', amazonUrl: 'https://link.amazon/B0f2HCcxx', price: '約2.5万円' },
      { name: 'XLRケーブル CANARE EC03-B', q: 'CANARE EC03-B', amazonUrl: NOTE.CANARE, price: '約3千円' },
    ],
    plus: [ARM, POP, ABSORB],
    instead: [
      { name: 'MOTU M2', q: 'MOTU M2', amazonUrl: NOTE.M2, price: '約3.6万円', note: 'ミキサーより音質を優先するなら' },
      {
        name: 'XLRケーブル MOGAMI 2549',
        q: 'MOGAMI 2549',
        amazonUrl: NOTE.MOGAMI,
        price: '約4千円',
        note: 'ケーブルでより細部まで録りたいなら',
      },
    ],
  },
  {
    band: 'pro',
    capsule: 'condenser',
    name: 'NEUMANN TLM 102 ＋ MOTU M2',
    q: 'TLM 102',
    amazonUrl: 'https://link.amazon/B0iUVRBTX',
    pattern: 'カーディオイド',
    connection: 'XLR接続',
    price: 'マイク約11.3万円＋MOTU M2 約3.6万円',
    why: '声の質感まで届けたい人向け。ただし部屋の反響や生活音も、声と同じように正直に拾います。ここまで出すなら、先に吸音を用意してください。',
    with: [
      M2,
      { name: 'XLRケーブル OYAIDE QAC-222', q: 'OYAIDE QAC-222', amazonUrl: NOTE.OYAIDE, price: '約6千円' },
    ],
    plus: [ABSORB, ARM_PRO, POP],
    instead: [
      { name: 'audio-technica AT4040', q: 'AT4040', amazonUrl: NOTE.AT4040, price: '約4万円', note: 'クセなく声をそのまま録りたいなら' },
      { name: 'AKG C214', q: 'C214', amazonUrl: NOTE.C214, price: '約7.5万円', note: '音の抜けを重視するなら' },
    ],
  },
];

// マイクの種類の説明。「くわしく知る」を押すとその場で開く
export const CAPSULE_GUIDE = {
  dynamic: {
    name: 'ダイナミックマイク',
    lead: '電源がいらず、正面の音を中心に拾う。配信でいちばん扱いやすい種類です。',
    points: [
      '生活音やキーボードの打鍵音が入りにくい',
      '大きな声や叫び声でも音が割れにくい',
      '丈夫で壊れにくく、手放すときも値崩れしにくい',
      '小さな声や息づかいは拾いきれないことがある',
    ],
    fit: '防音していない部屋、同居人がいる、ゲーム実況',
    detail: [
      {
        h: 'どうやって音を拾っているか',
        p: '薄い膜（振動板）にコイルがつながっていて、声で膜が動くとコイルが磁石の中で動き、電気が生まれます。電気を自分で作るので、電源を送る必要がありません。構造が単純なぶん丈夫で、落としても簡単には壊れません。',
      },
      {
        h: '音の性格',
        p: '近くの音を大きく、離れた音を小さく拾います。この差が大きいので、口元の声がはっきり残り、部屋の反響や生活音は後ろに下がります。高い成分は控えめに出るため、耳に刺さらず、長時間聞いても疲れにくい音になります。',
      },
      {
        h: '配信で向いている場面',
        p: 'ゲーム実況、雑談、大きな声を出す企画。同居している人がいる部屋、エアコンや換気扇を止められない部屋でもOK！防音していない部屋で配信するなら、まずこちらを選んでおけば失敗しません。',
      },
      {
        h: '気をつける点',
        p: 'マイクに近づいて話す前提の種類です。10cmほどまで寄るのが目安で、離れると声が細くなり、音量を上げると部屋の音も一緒に大きくなります。囁き中心の配信をするなら、感度の高い機種か、次のコンデンサーを検討してください。',
      },
    ],
  },
  condenser: {
    name: 'コンデンサーマイク',
    lead: '感度が高く、息づかいや高い成分まで拾う。声の表情がそのまま残ります。',
    points: [
      '囁きや息づかいまで届き、声の質感が出る',
      '歌や朗読では、この種類でないと出せない質感がある',
      '部屋の反響や生活音も、声と同じように拾ってしまう',
      '電源（ファンタム電源）を送れる機材が必要',
    ],
    fit: '静かな部屋を確保できる、歌・朗読・ナレーション',
    detail: [
      {
        h: 'どうやって音を拾っているか',
        p: 'ごく薄い膜と電極を向かい合わせにして、その距離の変化を電気に変えます。膜が軽いぶん小さな音にも反応しますが、動かすために電源が必要です。この電源をファンタム電源と呼び、オーディオインターフェースやミキサーから送ります。',
      },
      {
        h: '音の性格',
        p: '低いところから高いところまで均等に拾うので、声の質感がそのまま残ります。息の混ざり具合、口の中の湿った音、語尾の消え際まで届くため、囁きや歌では代わりがききません。',
      },
      {
        h: '配信で向いている場面',
        p: '歌ってみた、朗読、ナレーション、落ち着いた声を聞かせる枠。声の質感を届けたい配信ほど差が出ます。ボイス販売を考えているなら、こちらが前提になります。',
      },
      {
        h: '気をつける点',
        p: '声とそれ以外の音を区別せずに拾います。エアコン、冷蔵庫、キーボード、家族の声、壁で跳ね返った自分の声まで入ります。「音が悪い」と言われるとき、原因がマイクではなく部屋であることは珍しくありません。高い機種ほど部屋の粗も正直に出るので、先に吸音を用意するほうが結果が出ます。',
      },
    ],
  },
};

/**
 * ダイナミックかコンデンサーかを決める
 * @param {object} type TYPES の1件
 * @param {object} answers 質問の回答
 * @param {number} noiseFloor 測った騒音
 */
export function decideCapsule(type, answers, noiseFloor) {
  let dynamic = 0;
  let condenser = 0;
  const reasons = [];

  // 部屋の静けさ（測定値）
  if (noiseFloor >= 0.012) {
    dynamic += 3;
    reasons.push('測定環境：騒音レベルやや高め');
  } else if (noiseFloor <= 0.004) {
    condenser += 2;
    reasons.push('測定環境：静穏性の高い環境');
  }

  // 同居人・生活音
  if (answers.room === 'noisy') {
    dynamic += 3;
    reasons.push('収録環境：同居人あり／生活音が入る');
  } else if (answers.room === 'quiet') {
    condenser += 2;
    reasons.push('収録環境：ひとりで静かに録れる');
  }

  // 配信する時間帯
  if (answers.time === 'night') {
    condenser += 1;
  } else {
    dynamic += 1;
  }

  // ジャンル
  if (answers.genre === 'asmr') {
    condenser += 3;
    reasons.push('ジャンル：歌・ささやき系（声の細かい成分が作品になる）');
  } else if (answers.genre === 'game') {
    dynamic += 2;
    reasons.push('ジャンル：ゲーム実況（声が大きくなる場面が多い）');
  }

  // 声のタイプ。理由はタイプごとの説明（micWhy）をそのまま使う。
  // 以前は「音量の振れ幅が大きい」で一律にしていたため、深夜ラジオ型のような静かなタイプにも出ていた。
  if (type.micLean === 'condenser') condenser += 2;
  else if (type.micLean === 'dynamic') dynamic += 2;
  reasons.push(`${type.name}：${type.micWhy.replace(/。$/, '')}`);

  const capsule = condenser > dynamic ? 'condenser' : 'dynamic';
  return { capsule, reasons, score: { dynamic, condenser } };
}

/** 指向性を決める */
export function decidePattern(answers, noiseFloor) {
  const noisy = noiseFloor >= 0.012 || answers.room === 'noisy';
  if (noisy) {
    return {
      name: 'ハイパー／スーパーカーディオイド',
      why: '指向性：横からの音をさらに切れるので、生活音のある部屋向き。ただし真後ろは少し拾うため、背中側にパソコンのファンが来ない配置に。',
    };
  }
  return {
    name: 'カーディオイド（単一指向性）',
    why: '指向性：正面の音を中心に拾う、いちばん扱いやすい形。迷ったらこれでOK！',
  };
}

/** 3つの価格帯ごとに1機種ずつ返す */
export function pickGear(capsule) {
  return ['entry', 'standard', 'pro'].map((band) => {
    const found = GEAR.find((g) => g.band === band && g.capsule === capsule);
    return { band, ...found };
  });
}

// ── 販売店のリンク ────────────────────────
function keyword(gear) {
  return gear.q || gear.name.split('＋')[0].trim();
}

export function amazonLink(gear) {
  // amazonUrl を入れると、検索ページではなくその商品ページへ直接飛ぶ
  if (gear.amazonUrl) return gear.amazonUrl;
  const tag = STORES.amazon.tag;
  const base = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword(gear))}`;
  return tag ? `${base}&tag=${tag}` : base;
}

export function rakutenLink(gear) {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword(gear))}/`;
}

export function soundhouseLink(gear) {
  return `https://www.soundhouse.co.jp/search/index/?search_all=${encodeURIComponent(keyword(gear))}`;
}

/** 販売店のリンクをまとめて返す */
export function storeLinks(gear) {
  return [
    { key: 'amazon', name: STORES.amazon.name, url: amazonLink(gear), paid: Boolean(STORES.amazon.tag) },
    { key: 'rakuten', name: STORES.rakuten.name, url: rakutenLink(gear), paid: false },
    { key: 'soundhouse', name: STORES.soundhouse.name, url: soundhouseLink(gear), paid: false },
  ];
}

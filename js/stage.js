// stage.js — ウェーブ定義と編隊生成
// 敵は格子状に整列させず、V字・波形・縦列・小集団の編隊で複数方向から出現させる

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

// 画面外の出現基準点
const SPAWN_ANCHORS = {
  top: () => ({ x: 120 + Math.random() * (CANVAS_WIDTH - 240), y: -40 }),
  left: () => ({ x: -40, y: 60 + Math.random() * (CANVAS_HEIGHT * 0.55) }),
  right: () => ({ x: CANVAS_WIDTH + 40, y: 60 + Math.random() * (CANVAS_HEIGHT * 0.55) }),
  topLeft: () => ({ x: -50, y: -50 }),
  topRight: () => ({ x: CANVAS_WIDTH + 50, y: -50 })
};

function randomSideAnchor() {
  const keys = ["top", "left", "right"];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return SPAWN_ANCHORS[key]();
}

// V字編隊：先頭を頂点に、進行方向の後ろへ左右対称に広がる
function addVFormation(events, delay, anchor, type, count) {
  const dir = unitVector(anchor.x, anchor.y, CORE_CONFIG.x, CORE_CONFIG.y);
  const perp = { x: -dir.y, y: dir.x };
  events.push({ delay, type, x: anchor.x, y: anchor.y });
  for (let i = 1; i < count; i++) {
    const row = Math.ceil(i / 2);
    const side = i % 2 === 1 ? 1 : -1;
    events.push({
      delay,
      type,
      x: anchor.x - dir.x * row * 38 + perp.x * side * row * 32,
      y: anchor.y - dir.y * row * 38 + perp.y * side * row * 32
    });
  }
}

// 縦列編隊：同じ地点から時間差で連なって出現する
function addLineFormation(events, delay, anchor, type, count, interval = 0.4) {
  for (let i = 0; i < count; i++) {
    events.push({
      delay: delay + i * interval,
      type,
      x: anchor.x + (Math.random() - 0.5) * 10,
      y: anchor.y + (Math.random() - 0.5) * 10
    });
  }
}

// 波形編隊：上端に沿って左右に広がり、時間差が正弦波状に変化する
function addWaveFormation(events, delay, type, count) {
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    events.push({
      delay: delay + Math.abs(Math.sin(t * Math.PI * 2)) * 1.2,
      type,
      x: 100 + t * (CANVAS_WIDTH - 200),
      y: -40 - Math.sin(t * Math.PI) * 30
    });
  }
}

// 小集団：基準点の周囲にランダムに散らばって出現する
function addClusterFormation(events, delay, anchor, type, count) {
  for (let i = 0; i < count; i++) {
    events.push({
      delay: delay + Math.random() * 0.8,
      type,
      x: anchor.x + (Math.random() - 0.5) * 120,
      y: anchor.y + (Math.random() - 0.5) * 90
    });
  }
}

// ウェーブ番号から出現イベント一覧（{delay, type, x, y}）を組み立てる
function buildWave(wave) {
  const events = [];
  let t = 0.8;

  // 開幕：左右どちらかの上隅からスカウトのV字編隊
  const openingCorner = wave % 2 === 1 ? SPAWN_ANCHORS.topLeft() : SPAWN_ANCHORS.topRight();
  addVFormation(events, t, openingCorner, "scout", Math.min(5 + Math.floor(wave / 4), 7));
  t += 4.5;

  // 上端からの波形編隊
  addWaveFormation(events, t, "scout", Math.min(4 + wave, 10));
  t += 5;

  // ウェーブ2以降：コアへ直進するドリル機がランダムな方向から出現
  if (wave >= 2) {
    const drillerCount = Math.min(1 + Math.floor(wave / 2), 5);
    for (let i = 0; i < drillerCount; i++) {
      const anchor = randomSideAnchor();
      events.push({ delay: t, type: "driller", x: anchor.x, y: anchor.y });
      t += 1.4;
    }
    t += 2;
  }

  // ウェーブ3以降：左右からシールド機の縦列
  if (wave >= 3) {
    const shielderCount = Math.min(1 + Math.floor((wave - 2) / 2), 4);
    const side = wave % 2 === 1 ? SPAWN_ANCHORS.left() : SPAWN_ANCHORS.right();
    addLineFormation(events, t, side, "shielder", shielderCount, 0.9);
    t += 4;
  }

  // ウェーブ3以降：分裂機の小集団
  if (wave >= 3) {
    const splitterCount = Math.min(2 + Math.floor(wave / 3), 5);
    addClusterFormation(events, t, SPAWN_ANCHORS.top(), "splitter", splitterCount);
    t += 4;
  }

  // ウェーブ5以降：終盤にスカウトの追加波とドリル機の同時突入
  if (wave >= 5) {
    addClusterFormation(events, t, randomSideAnchor(), "scout", Math.min(3 + wave - 5, 8));
    events.push({ delay: t + 1, type: "driller", x: -40, y: 80 });
    events.push({ delay: t + 1, type: "driller", x: CANVAS_WIDTH + 40, y: 80 });
  }

  return events;
}

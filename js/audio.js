// audio.js — Web Audio API による効果音の独自合成（外部素材は使用しない）

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

const AudioFX = (function () {
  // 現在の50%設定と新しい100%設定がほぼ同じ音量になるよう抑える
  const MASTER_OUTPUT = 0.08;
  let ctx = null;
  let masterGain = null;
  let volume = 0;
  let lastWarningTime = 0;
  let lastEnemyShootTime = 0;
  let lastShotClashTime = 0;
  let lastCoreShotHitTime = 0;

  function ensureContext() {
    if (ctx) return true;
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = MASTER_OUTPUT * volume * volume;
      masterGain.connect(ctx.destination);
    } catch (e) {
      ctx = null;
      masterGain = null;
      return false;
    }
    return true;
  }

  // 周波数が startFreq から endFreq へ変化する単音を鳴らす
  function tone({ startFreq, endFreq, duration, type = "square", gain = 0.15, delay = 0 }) {
    if (!ensureContext() || volume <= 0) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + duration);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp);
    amp.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    setVolume(v) {
      volume = clamp(Number(v) || 0, 0, 1);
      if (masterGain && ctx) {
        const outputLevel = MASTER_OUTPUT * volume * volume;
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setTargetAtTime(outputLevel, ctx.currentTime, 0.015);
      }
    },
    getVolume() {
      return volume;
    },
    // ユーザー操作（クリック等）を契機に呼び、AudioContextを有効化する
    unlock() {
      ensureContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    },
    // 通常弾：8ビット風の短いレーザー音
    shoot() {
      tone({ startFreq: 880, endFreq: 620, duration: 0.065, type: "square", gain: 0.055 });
    },
    // 拡散弾：短い3音アルペジオ
    spread() {
      tone({ startFreq: 523, endFreq: 523, duration: 0.055, type: "square", gain: 0.045 });
      tone({ startFreq: 659, endFreq: 659, duration: 0.055, type: "square", gain: 0.04, delay: 0.035 });
      tone({ startFreq: 784, endFreq: 700, duration: 0.07, type: "square", gain: 0.035, delay: 0.07 });
    },
    // 敵弾：自機より低い8ビット風レーザー音
    enemyShoot() {
      const now = Date.now();
      if (now - lastEnemyShootTime < 45) return;
      lastEnemyShootTime = now;
      tone({ startFreq: 350, endFreq: 220, duration: 0.085, type: "square", gain: 0.04 });
    },
    // EMP：低音から駆け上がるチップチューン風アルペジオ
    emp() {
      tone({ startFreq: 98, endFreq: 65, duration: 0.3, type: "triangle", gain: 0.1 });
      tone({ startFreq: 196, endFreq: 196, duration: 0.07, type: "square", gain: 0.04 });
      tone({ startFreq: 262, endFreq: 262, duration: 0.07, type: "square", gain: 0.04, delay: 0.06 });
      tone({ startFreq: 392, endFreq: 392, duration: 0.07, type: "square", gain: 0.04, delay: 0.12 });
      tone({ startFreq: 523, endFreq: 659, duration: 0.12, type: "square", gain: 0.035, delay: 0.18 });
    },
    // 敵への命中：コイン音に近い短い高音
    hitEnemy() {
      tone({ startFreq: 1047, endFreq: 1319, duration: 0.055, type: "square", gain: 0.04 });
    },
    // 自機弾と敵弾の衝突：短いピコッという相殺音
    shotClash() {
      const now = Date.now();
      if (now - lastShotClashTime < 35) return;
      lastShotClashTime = now;
      tone({ startFreq: 1760, endFreq: 880, duration: 0.06, type: "square", gain: 0.035 });
      tone({ startFreq: 660, endFreq: 440, duration: 0.075, type: "triangle", gain: 0.035, delay: 0.015 });
    },
    // 敵の撃破：低音と高速下降音を組み合わせた8ビット爆発
    explode() {
      tone({ startFreq: 165, endFreq: 55, duration: 0.22, type: "triangle", gain: 0.1 });
      tone({ startFreq: 1200, endFreq: 180, duration: 0.13, type: "square", gain: 0.045 });
      tone({ startFreq: 700, endFreq: 110, duration: 0.11, type: "square", gain: 0.035, delay: 0.055 });
    },
    // ダッシュ：上昇するパワーアップ音
    dash() {
      tone({ startFreq: 330, endFreq: 990, duration: 0.11, type: "square", gain: 0.04 });
      tone({ startFreq: 165, endFreq: 330, duration: 0.13, type: "triangle", gain: 0.055 });
    },
    // 重力フィールド展開：低音の上に3音を重ねた特殊効果音
    gravity() {
      tone({ startFreq: 82, endFreq: 164, duration: 0.34, type: "triangle", gain: 0.09 });
      tone({ startFreq: 330, endFreq: 330, duration: 0.08, type: "square", gain: 0.03, delay: 0.04 });
      tone({ startFreq: 440, endFreq: 440, duration: 0.08, type: "square", gain: 0.03, delay: 0.12 });
      tone({ startFreq: 659, endFreq: 659, duration: 0.1, type: "square", gain: 0.03, delay: 0.2 });
    },
    // エネルギー不足：2音の警告音（連打時は間引く）
    warning() {
      const now = Date.now();
      if (now - lastWarningTime < 350) return;
      lastWarningTime = now;
      tone({ startFreq: 520, endFreq: 520, duration: 0.06, type: "square", gain: 0.07 });
      tone({ startFreq: 390, endFreq: 390, duration: 0.08, type: "square", gain: 0.07, delay: 0.09 });
    },
    // 敵弾が防衛コアに命中：2段階で下がる警告音
    enemyShotHitCore() {
      const now = Date.now();
      if (now - lastCoreShotHitTime < 70) return;
      lastCoreShotHitTime = now;
      tone({ startFreq: 494, endFreq: 494, duration: 0.07, type: "square", gain: 0.045 });
      tone({ startFreq: 247, endFreq: 196, duration: 0.12, type: "square", gain: 0.045, delay: 0.075 });
    },
    // 敵機が防衛コアへ到達：低い8ビット衝撃音
    coreDamage() {
      tone({ startFreq: 147, endFreq: 49, duration: 0.34, type: "triangle", gain: 0.11 });
      tone({ startFreq: 392, endFreq: 98, duration: 0.18, type: "square", gain: 0.04 });
    },
    // プレイヤー被弾：ライフ減少を示す下降フレーズ
    playerHit() {
      tone({ startFreq: 659, endFreq: 659, duration: 0.07, type: "square", gain: 0.045 });
      tone({ startFreq: 440, endFreq: 440, duration: 0.08, type: "square", gain: 0.045, delay: 0.07 });
      tone({ startFreq: 220, endFreq: 147, duration: 0.14, type: "triangle", gain: 0.07, delay: 0.15 });
    },
    // ウェーブクリア：上昇する4音のファンファーレ
    waveClear() {
      tone({ startFreq: 523, endFreq: 523, duration: 0.1, type: "square", gain: 0.04 });
      tone({ startFreq: 659, endFreq: 659, duration: 0.1, type: "square", gain: 0.04, delay: 0.1 });
      tone({ startFreq: 784, endFreq: 784, duration: 0.1, type: "square", gain: 0.04, delay: 0.2 });
      tone({ startFreq: 1047, endFreq: 1047, duration: 0.24, type: "square", gain: 0.045, delay: 0.3 });
      tone({ startFreq: 262, endFreq: 262, duration: 0.5, type: "triangle", gain: 0.045, delay: 0.3 });
    },
    // ゲームオーバー：昔のゲーム機風の下降フレーズ
    gameOver() {
      tone({ startFreq: 523, endFreq: 523, duration: 0.14, type: "square", gain: 0.04 });
      tone({ startFreq: 415, endFreq: 415, duration: 0.14, type: "square", gain: 0.04, delay: 0.15 });
      tone({ startFreq: 330, endFreq: 330, duration: 0.14, type: "square", gain: 0.04, delay: 0.3 });
      tone({ startFreq: 196, endFreq: 98, duration: 0.45, type: "triangle", gain: 0.075, delay: 0.45 });
    }
  };
})();

// 戦闘中にループ再生するBGM。効果音とは別の音量で管理する
const BackgroundMusic = (function () {
  const TRACK_URL = "assets/move/watermello-sport-techno-477131.mp3";
  let track = null;
  let volume = 0;

  function ensureTrack() {
    if (track) return track;
    if (typeof Audio === "undefined") return null;
    track = new Audio(TRACK_URL);
    track.loop = true;
    track.preload = "auto";
    track.volume = volume * volume;
    return track;
  }

  return {
    setVolume(v) {
      volume = clamp(Number(v) || 0, 0, 1);
      const audio = ensureTrack();
      if (audio) audio.volume = volume * volume;
    },
    getVolume() {
      return volume;
    },
    play() {
      if (volume <= 0) return;
      const audio = ensureTrack();
      if (audio) audio.play().catch(() => {});
    },
    pause() {
      if (track) track.pause();
    },
    stop() {
      if (!track) return;
      track.pause();
      track.currentTime = 0;
    }
  };
})();

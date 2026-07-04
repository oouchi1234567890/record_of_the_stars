// audio.js — Web Audio API による効果音の独自合成（外部素材は使用しない）

const AudioFX = (function () {
  let ctx = null;
  let volume = 0.5;
  let lastWarningTime = 0;

  function ensureContext() {
    if (ctx) return true;
    if (typeof window === "undefined") return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
    } catch (e) {
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
    amp.gain.setValueAtTime(gain * volume, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    setVolume(v) {
      volume = clamp(Number(v) || 0, 0, 1);
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
    // 通常弾：短い電子音
    shoot() {
      tone({ startFreq: 880, endFreq: 440, duration: 0.07, type: "square", gain: 0.08 });
    },
    // 拡散弾：やや低めの二重音
    spread() {
      tone({ startFreq: 660, endFreq: 330, duration: 0.1, type: "square", gain: 0.09 });
      tone({ startFreq: 520, endFreq: 260, duration: 0.1, type: "square", gain: 0.06, delay: 0.02 });
    },
    // EMP：うなりを伴う放射音
    emp() {
      tone({ startFreq: 200, endFreq: 1400, duration: 0.35, type: "sawtooth", gain: 0.12 });
      tone({ startFreq: 100, endFreq: 40, duration: 0.4, type: "sine", gain: 0.15 });
    },
    // 敵への命中：金属的なクリック音
    hitEnemy() {
      tone({ startFreq: 1400, endFreq: 900, duration: 0.04, type: "triangle", gain: 0.09 });
    },
    // 敵の撃破：低い破裂音と高い粒子音
    explode() {
      tone({ startFreq: 180, endFreq: 45, duration: 0.22, type: "sawtooth", gain: 0.14 });
      tone({ startFreq: 2200, endFreq: 700, duration: 0.12, type: "triangle", gain: 0.05 });
    },
    // ダッシュ：上昇するスライド音
    dash() {
      tone({ startFreq: 300, endFreq: 900, duration: 0.12, type: "sine", gain: 0.08 });
    },
    // 重力フィールド展開：低く広がる音
    gravity() {
      tone({ startFreq: 90, endFreq: 240, duration: 0.4, type: "sine", gain: 0.1 });
    },
    // エネルギー不足：2音の警告音（連打時は間引く）
    warning() {
      const now = Date.now();
      if (now - lastWarningTime < 350) return;
      lastWarningTime = now;
      tone({ startFreq: 520, endFreq: 520, duration: 0.06, type: "square", gain: 0.07 });
      tone({ startFreq: 390, endFreq: 390, duration: 0.08, type: "square", gain: 0.07, delay: 0.09 });
    },
    // 防衛コア損傷：低周波の振動音
    coreDamage() {
      tone({ startFreq: 70, endFreq: 35, duration: 0.5, type: "sine", gain: 0.2 });
    },
    // プレイヤー被弾
    playerHit() {
      tone({ startFreq: 400, endFreq: 80, duration: 0.3, type: "sawtooth", gain: 0.12 });
    },
    // ウェーブクリア：上昇する2音
    waveClear() {
      tone({ startFreq: 523, endFreq: 523, duration: 0.12, type: "triangle", gain: 0.1 });
      tone({ startFreq: 784, endFreq: 784, duration: 0.2, type: "triangle", gain: 0.1, delay: 0.14 });
    },
    // ゲームオーバー：下降音
    gameOver() {
      tone({ startFreq: 440, endFreq: 55, duration: 0.9, type: "sawtooth", gain: 0.12 });
    }
  };
})();

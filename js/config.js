// config.js — 星のきろく 全体の定数定義

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

const GameState = Object.freeze({
  TITLE: "title",
  PLAYING: "playing",
  PAUSED: "paused",
  WAVE_CLEAR: "waveClear",
  GAME_OVER: "gameOver"
});

const Difficulty = Object.freeze({
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard"
});

// 難易度ごとの敵補正（速度・耐久・射撃間隔）
const DIFFICULTY_SETTINGS = {
  [Difficulty.EASY]: { speedScale: 0.8, hpScale: 0.8, fireIntervalScale: 1.4 },
  [Difficulty.NORMAL]: { speedScale: 1.0, hpScale: 1.0, fireIntervalScale: 1.0 },
  [Difficulty.HARD]: { speedScale: 1.25, hpScale: 1.3, fireIntervalScale: 0.72 }
};

// 防衛コア（画面中央）
const CORE_CONFIG = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  radius: 26,
  maxHp: 100
};

const PLAYER_CONFIG = {
  radius: 13,
  speed: 270, // px/秒
  fireInterval: 220, // ミリ秒
  invincibleDuration: 2, // 秒（被弾後）
  initialLives: 3
};

// エネルギー制（攻撃とダッシュで共通消費）
const ENERGY_CONFIG = {
  max: 100,
  regenPerSec: 16,
  costs: {
    normal: 2,
    spread: 8,
    emp: 30,
    dash: 15
  }
};

const Weapon = Object.freeze({
  NORMAL: "normal",
  SPREAD: "spread",
  EMP: "emp"
});

const PROJECTILE_CONFIG = {
  player: { radius: 3, speed: 520, damage: 1 },
  spreadAngle: 0.26, // 拡散弾の左右の開き（ラジアン）
  enemy: { radius: 4, speed: 170, maxCount: 12 }
};

const DASH_CONFIG = {
  duration: 0.16, // 秒
  speedMultiplier: 3.2,
  invincibleDuration: 0.3 // ダッシュ中の無敵（秒）
};

// 重力フィールド：敵弾の軌道を外側へ曲げる
const GRAVITY_FIELD_CONFIG = {
  radius: 110,
  duration: 5, // 秒
  cooldown: 10, // 秒
  strength: 900 // 偏向の強さ
};

const EMP_CONFIG = {
  radius: 180,
  damage: 2,
  stunDuration: 1.5 // 秒
};

// 敵の種類ごとの基本性能
const ENEMY_CONFIG = {
  scout: { radius: 12, hp: 1, speed: 95, score: 100, coreDamage: 6, color: "#fb923c" },
  shielder: { radius: 16, hp: 5, speed: 45, score: 250, coreDamage: 10, color: "#a78bfa" },
  driller: { radius: 11, hp: 2, speed: 150, score: 150, coreDamage: 15, color: "#f87171" },
  splitter: { radius: 14, hp: 3, speed: 70, score: 200, coreDamage: 8, color: "#c084fc" },
  mini: { radius: 7, hp: 1, speed: 130, score: 50, coreDamage: 3, color: "#fdba74" }
};

// 射撃を行う敵の発射間隔（ミリ秒）
const ENEMY_FIRE_CONFIG = {
  minInterval: 2600,
  maxInterval: 4600
};

// ウェーブ進行による強化
const WAVE_SCALING = {
  speedPerWave: 0.05, // 1ウェーブごとに+5%
  speedCap: 1.6,
  bulletSpeedPerWave: 0.03,
  hpBonusEveryWaves: 4 // このウェーブ数ごとに耐久+1
};

// コンボ倍率（短時間の連続撃破でスコア倍率が上がる）
const COMBO_CONFIG = {
  window: 2.0, // 秒。次の撃破までの猶予
  tiers: [
    { count: 10, multiplier: 2.0 },
    { count: 5, multiplier: 1.5 },
    { count: 3, multiplier: 1.2 }
  ]
};

// ウェーブクリア時のボーナス：コア残存耐久 × この値
const CORE_HP_BONUS_RATE = 5;

// ウェーブ終了時に3つ提示される選択式アップグレード
const UPGRADE_POOL = [
  {
    id: "bulletSpeed",
    name: "弾速強化",
    desc: "通常弾・拡散弾の速度 +20%",
    apply(game) {
      game.player.bulletSpeedMult *= 1.2;
    }
  },
  {
    id: "energyMax",
    name: "エネルギー拡張",
    desc: "エネルギー最大値 +25",
    apply(game) {
      game.player.energyMax += 25;
      game.player.energy = game.player.energyMax;
    }
  },
  {
    id: "energyRegen",
    name: "回復効率強化",
    desc: "エネルギー回復速度 +30%",
    apply(game) {
      game.player.energyRegen *= 1.3;
    }
  },
  {
    id: "dashCost",
    name: "推進系最適化",
    desc: "ダッシュ消費 -5（最低5）",
    apply(game) {
      game.player.dashCost = Math.max(5, game.player.dashCost - 5);
    }
  },
  {
    id: "gravityCooldown",
    name: "フィールド再充填",
    desc: "重力フィールド再使用時間 -2秒（最低4秒）",
    apply(game) {
      game.gravityCooldownMax = Math.max(4, game.gravityCooldownMax - 2);
    }
  },
  {
    id: "fireRate",
    name: "連射制御強化",
    desc: "発射間隔 -15%",
    apply(game) {
      game.player.fireInterval *= 0.85;
    }
  }
];

const HIGH_SCORE_KEY = "hoshiNoKirokuHighScore";
const VOLUME_KEY = "hoshiNoKirokuVolume";
const DIFFICULTY_KEY = "hoshiNoKirokuDifficulty";
const OPERATOR_NAME_KEY = "hoshiNoKirokuOperatorName";

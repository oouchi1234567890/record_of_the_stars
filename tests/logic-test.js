"use strict";

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function makeUniversalMock() {
  const fn = function () {
    return makeUniversalMock();
  };
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      return makeUniversalMock();
    },
    set() {
      return true;
    },
    apply() {
      return makeUniversalMock();
    }
  });
}

const storage = new Map();
const localStorageMock = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

const sandbox = {
  console,
  Math,
  Date,
  Number,
  Object,
  Array,
  JSON,
  Infinity,
  localStorage: localStorageMock,
  performance: { now: () => Date.now() }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const jsDir = path.join(__dirname, "..", "js");
for (const file of [
  "config.js",
  "collision.js",
  "audio.js",
  "projectile.js",
  "player.js",
  "enemy.js",
  "stage.js",
  "game.js"
]) {
  const code = fs.readFileSync(path.join(jsDir, file), "utf8");
  vm.runInContext(code, sandbox, { filename: file });
}

const G = vm.runInContext(
  "({ Game, Enemy, GameState, Weapon, CORE_CONFIG, ENEMY_CONFIG, EMP_CONFIG, PLAYER_CONFIG, UPGRADE_POOL, CORE_HP_BONUS_RATE, buildWave })",
  sandbox
);

const fakeCanvas = { getContext: () => makeUniversalMock() };
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  [OK] " + name);
  } catch (error) {
    failed += 1;
    console.log("  [NG] " + name + " - " + error.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion failed");
}

function assertClose(actual, expected, epsilon = 0.001, message = "") {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message} expected=${expected} actual=${actual}`);
  }
}

function newGame() {
  const game = new G.Game(fakeCanvas);
  game.startNewGame();
  return game;
}

console.log("Hoshi no Kiroku logic tests\n");

test("60 seconds of updates do not throw", () => {
  const game = newGame();
  game.input.fire = true;
  game.input.left = true;
  for (let i = 0; i < 3750; i += 1) {
    game.update(0.016, i * 16);
    if (i % 300 === 0) game.tryDash();
    if (i % 500 === 0) game.deployGravityField();
    if (game.state === G.GameState.WAVE_CLEAR) game.chooseUpgrade(0);
    if (game.state === G.GameState.GAME_OVER) break;
  }
  assert(true);
});

test("normal shot consumes 2 energy and creates one shot", () => {
  const game = newGame();
  const before = game.player.energy;
  game.tryFire(100000);
  assertClose(before - game.player.energy, 2);
  assert(game.projectiles.playerShots.length === 1, "shot was created");
});

test("spread shot consumes 8 energy and creates three shots", () => {
  const game = newGame();
  game.setWeapon(G.Weapon.SPREAD);
  const before = game.player.energy;
  game.tryFire(100000);
  assertClose(before - game.player.energy, 8);
  assert(game.projectiles.playerShots.length === 3, "spread shots were created");
});

test("EMP consumes 30 energy", () => {
  const game = newGame();
  game.setWeapon(G.Weapon.EMP);
  const before = game.player.energy;
  game.tryFire(100000);
  assertClose(before - game.player.energy, 30);
});

test("dash consumes 15 energy", () => {
  const game = newGame();
  const before = game.player.energy;
  game.tryDash();
  assertClose(before - game.player.energy, 15);
  assert(game.player.isDashing, "player is dashing");
});

test("insufficient energy prevents firing", () => {
  const game = newGame();
  game.player.energy = 1;
  game.tryFire(100000);
  assert(game.projectiles.playerShots.length === 0, "no shot created");
  assertClose(game.player.energy, 1);
});

test("energy recovers over time", () => {
  const game = newGame();
  game.player.energy = 10;
  game.update(1, 0);
  assert(game.player.energy > 10, "energy recovered");
});

test("combo multipliers match thresholds", () => {
  const game = newGame();
  game.combo = 0;
  assertClose(game.getComboMultiplier(), 1);
  game.combo = 2;
  assertClose(game.getComboMultiplier(), 1);
  game.combo = 3;
  assertClose(game.getComboMultiplier(), 1.2);
  game.combo = 5;
  assertClose(game.getComboMultiplier(), 1.5);
  game.combo = 10;
  assertClose(game.getComboMultiplier(), 2);
});

test("destroy score uses combo multiplier", () => {
  const game = newGame();
  game.combo = 4;
  const enemy = new G.Enemy("scout", 100, 100, 1, game.getScaling());
  game.enemyManager.addEnemy(enemy);
  const before = game.score;
  game.destroyEnemy(enemy);
  assert(game.combo === 5, "combo advanced");
  assertClose(game.score - before, 150);
});

test("splitter creates two mini enemies when destroyed", () => {
  const game = newGame();
  const splitter = new G.Enemy("splitter", 200, 200, 1, game.getScaling());
  game.enemyManager.addEnemy(splitter);
  const before = game.enemyManager.aliveEnemies.filter((enemy) => enemy.type === "mini").length;
  game.destroyEnemy(splitter);
  const after = game.enemyManager.aliveEnemies.filter((enemy) => enemy.type === "mini").length;
  assert(after - before === 2, "two minis created");
});

test("gravity field changes enemy shot trajectory", () => {
  const game = newGame();
  game.gravityField = { x: 480, y: 270, timer: 5 };
  game.projectiles.fireEnemyShot(480, 200, 480, 400, 170);
  const shot = game.projectiles.enemyShots[0];
  const vxBefore = shot.vx;
  shot.x = 470;
  shot.update(0.016, [game.gravityField]);
  assert(shot.vx !== vxBefore, "horizontal velocity changed");
  assert(shot.vx < vxBefore, "shot was pushed outward");
});

test("gravity field enters cooldown after deployment", () => {
  const game = newGame();
  game.deployGravityField();
  assert(game.gravityField !== null, "field deployed");
  assert(game.gravityCooldown === game.gravityCooldownMax, "cooldown started");
  const previous = game.gravityField;
  game.deployGravityField();
  assert(game.gravityField === previous, "field was not redeployed during cooldown");
});

test("enemy reaching core reduces core HP", () => {
  const game = newGame();
  const before = game.coreHp;
  const driller = new G.Enemy("driller", G.CORE_CONFIG.x - 100, G.CORE_CONFIG.y, 1, game.getScaling());
  game.enemyManager.addEnemy(driller);
  for (let i = 0; i < 200 && !driller.dead; i += 1) {
    driller.update(0.016, game);
  }
  assert(driller.dead, "driller reached core");
  assert(before - game.coreHp === G.ENEMY_CONFIG.driller.coreDamage, "damage amount matches config");
});

test("zero core HP ends the game", () => {
  const game = newGame();
  game.coreHp = 5;
  const driller = new G.Enemy("driller", G.CORE_CONFIG.x - 40, G.CORE_CONFIG.y, 1, game.getScaling());
  game.onEnemyReachedCore(driller);
  assert(game.coreHp === 0, "core stopped at zero");
  assert(game.state === G.GameState.GAME_OVER, "game over state");
});

test("clearing all enemies opens upgrade choices", () => {
  const game = newGame();
  game.enemyManager.spawnEvents = [];
  game.enemyManager.spawnIndex = 0;
  game.enemyManager.enemies = [];
  game.update(0.016, 0);
  assert(game.state === G.GameState.WAVE_CLEAR, "wave clear state");
  assert(game.upgradeChoices.length === 3, "three choices");
  assert(new Set(game.upgradeChoices.map((choice) => choice.id)).size === 3, "choices are unique");
});

test("wave clear adds core HP bonus", () => {
  const game = newGame();
  game.coreHp = 80;
  const before = game.score;
  game.enemyManager.spawnEvents = [];
  game.enemyManager.enemies = [];
  game.update(0.016, 0);
  assert(game.score - before === 80 * G.CORE_HP_BONUS_RATE, "bonus applied");
});

test("upgrade applies and starts next wave", () => {
  const game = newGame();
  game.enemyManager.spawnEvents = [];
  game.enemyManager.enemies = [];
  game.update(0.016, 0);
  game.upgradeChoices = [G.UPGRADE_POOL.find((upgrade) => upgrade.id === "energyMax")];
  const beforeMax = game.player.energyMax;
  game.chooseUpgrade(0);
  assert(game.player.energyMax === beforeMax + 25, "energy max increased");
  assert(game.wave === 2, "next wave");
  assert(game.state === G.GameState.PLAYING, "playing state");
  assert(game.enemyManager.remainingCount > 0, "next wave enemies scheduled");
});

test("EMP damages nearby enemies and stuns survivors", () => {
  const game = newGame();
  game.enemyManager.spawnEvents = [];
  game.enemyManager.enemies = [];
  const near = new G.Enemy("shielder", game.player.x + 50, game.player.y, 1, game.getScaling());
  const far = new G.Enemy("shielder", game.player.x + 500, game.player.y, 1, game.getScaling());
  game.enemyManager.addEnemy(near);
  game.enemyManager.addEnemy(far);
  const nearHp = near.hp;
  game.setWeapon(G.Weapon.EMP);
  game.tryFire(100000);
  assert(near.hp === nearHp - G.EMP_CONFIG.damage, "near enemy damaged");
  assert(near.isStunned, "near enemy stunned");
  assert(!far.isStunned && far.hp === far.maxHp, "far enemy unaffected");
});

test("waves 1 through 10 generate valid spawn events", () => {
  for (let wave = 1; wave <= 10; wave += 1) {
    const events = G.buildWave(wave);
    assert(events.length > 0, `wave ${wave} has events`);
    for (const event of events) {
      assert(G.ENEMY_CONFIG[event.type], "known enemy type");
      assert(Number.isFinite(event.x) && Number.isFinite(event.y), "valid coordinates");
      assert(event.delay >= 0, "valid delay");
    }
  }
});

test("wave composition expands after wave 1", () => {
  const wave1Types = new Set(G.buildWave(1).map((event) => event.type));
  assert(wave1Types.size === 1 && wave1Types.has("scout"), "wave 1 only has scouts");
  const wave3Types = new Set(G.buildWave(3).map((event) => event.type));
  assert(wave3Types.has("shielder"), "wave 3 has shielders");
  assert(wave3Types.has("splitter"), "wave 3 has splitters");
  assert(wave3Types.has("driller"), "wave 3 has drillers");
});

test("high score uses the Hoshi no Kiroku storage key", () => {
  storage.clear();
  const game = newGame();
  game.addScore(1234);
  assert(storage.get("hoshiNoKirokuHighScore") === "1234", "new key saved");
  assert(!storage.has("invaderHighScore"), "old key is unused");
});

test("player hit resets combo and grants invincibility", () => {
  const game = newGame();
  game.combo = 7;
  game.comboTimer = 2;
  game.hitPlayer();
  assert(game.player.lives === G.PLAYER_CONFIG.initialLives - 1, "life decreased");
  assert(game.combo === 0, "combo reset");
  assert(game.player.isInvincible, "invincibility granted");
});

console.log(`\nResult: ${passed} passed / ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}

// game.js — 星のきろく のゲーム進行管理
// 防衛コア・重力フィールド・EMP・コンボ・選択式アップグレードを含む

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.state = GameState.TITLE;
    this.difficulty = loadDifficulty();
    this.score = 0;
    this.highScore = loadHighScore();
    this.wave = 1;

    this.player = new Player();
    this.projectiles = new ProjectileManager();
    this.enemyManager = new EnemyManager(this.wave, this.getScaling());

    this.coreHp = CORE_CONFIG.maxHp;

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
    };

    // 重力フィールド（同時に1つだけ展開できる）
    this.gravityField = null; // { x, y, timer }
    this.gravityCooldown = 0;
    this.gravityCooldownMax = GRAVITY_FIELD_CONFIG.cooldown;

    // コンボ
    this.combo = 0;
    this.comboTimer = 0;

    // 演出
    this.explosions = []; // { x, y, timer, max, color }
    this.empPulses = []; // { x, y, timer }
    this.stars = this.createStars();

    // ウェーブクリア時のアップグレード候補
    this.upgradeChoices = [];
    this.lastWaveBonus = 0;

    this.onStateChange = null;
  }

  createStars() {
    const layers = [
      { count: 60, speed: 6, size: 1, alpha: 0.35 },
      { count: 35, speed: 12, size: 1.6, alpha: 0.55 },
      { count: 16, speed: 22, size: 2.2, alpha: 0.8 },
    ];
    const stars = [];
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: layer.speed,
          size: layer.size,
          alpha: layer.alpha,
        });
      }
    }
    return stars;
  }

  getScaling() {
    return (
      DIFFICULTY_SETTINGS[this.difficulty] ||
      DIFFICULTY_SETTINGS[Difficulty.NORMAL]
    );
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    saveDifficulty(difficulty);
  }

  setState(state) {
    this.state = state;
    if (this.onStateChange) this.onStateChange(state);
  }

  startNewGame() {
    this.score = 0;
    this.wave = 1;
    this.coreHp = CORE_CONFIG.maxHp;
    this.player.reset();
    this.projectiles.reset();
    this.enemyManager = new EnemyManager(this.wave, this.getScaling());
    this.gravityField = null;
    this.gravityCooldown = 0;
    this.gravityCooldownMax = GRAVITY_FIELD_CONFIG.cooldown;
    this.combo = 0;
    this.comboTimer = 0;
    this.explosions = [];
    this.empPulses = [];
    this.upgradeChoices = [];
    this.lastWaveBonus = 0;
    this.setState(GameState.PLAYING);
  }

  restart() {
    this.startNewGame();
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.setState(GameState.PAUSED);
    } else if (this.state === GameState.PAUSED) {
      this.setState(GameState.PLAYING);
    }
  }

  goToTitle() {
    this.setState(GameState.TITLE);
  }

  // ウェーブクリア画面で選ばれたアップグレードを適用して次のウェーブへ
  chooseUpgrade(index) {
    const choice = this.upgradeChoices[index];
    if (choice) choice.apply(this);
    this.startNextWave();
  }

  startNextWave() {
    this.wave += 1;
    this.projectiles.reset();
    this.enemyManager = new EnemyManager(this.wave, this.getScaling());
    this.gravityField = null;
    this.combo = 0;
    this.comboTimer = 0;
    this.player.energy = this.player.energyMax;
    this.setState(GameState.PLAYING);
  }

  getComboMultiplier() {
    for (const tier of COMBO_CONFIG.tiers) {
      if (this.combo >= tier.count) return tier.multiplier;
    }
    return 1.0;
  }

  addScore(points) {
    this.score += Math.round(points);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
    }
  }

  registerKill(enemy) {
    this.combo += 1;
    this.comboTimer = COMBO_CONFIG.window;
    this.addScore(enemy.score * this.getComboMultiplier());
  }

  // ===== プレイヤーの行動 =====

  tryFire(now) {
    const p = this.player;
    if (!p.canFire(now)) return;
    const cost = ENERGY_CONFIG.costs[p.weapon];
    if (p.energy < cost) {
      AudioFX.warning();
      return;
    }

    if (p.weapon === Weapon.EMP) {
      p.spendEnergy(cost);
      p.lastFireTime = now;
      this.fireEmp();
      return;
    }

    // 発射位置は機体中心ではなく、三角形の先端
    const origin = p.getNosePosition();

    // 照準：最も近い画面内の敵。いなければ機体の向き
    const target = this.findNearestEnemy(p.x, p.y);
    let angle;
    if (target) {
      angle = Math.atan2(target.y - origin.y, target.x - origin.x);
    } else {
      angle = Math.atan2(p.facing.y, p.facing.x);
    }

    const speed = PROJECTILE_CONFIG.player.speed * p.bulletSpeedMult;
    p.spendEnergy(cost);
    p.lastFireTime = now;

    if (p.weapon === Weapon.SPREAD) {
      const spreadAngle = PROJECTILE_CONFIG.spreadAngle;
      this.projectiles.firePlayerShot(
        origin.x,
        origin.y,
        angle - spreadAngle,
        speed,
      );
      this.projectiles.firePlayerShot(origin.x, origin.y, angle, speed);
      this.projectiles.firePlayerShot(
        origin.x,
        origin.y,
        angle + spreadAngle,
        speed,
      );
      AudioFX.spread();
    } else {
      this.projectiles.firePlayerShot(origin.x, origin.y, angle, speed);
      AudioFX.shoot();
    }
  }

  fireEmp() {
    const p = this.player;
    this.empPulses.push({ x: p.x, y: p.y, timer: 0.45 });
    this.projectiles.clearEnemyShotsWithin(p.x, p.y, EMP_CONFIG.radius);
    for (const enemy of this.enemyManager.aliveEnemies) {
      if (distance(enemy.x, enemy.y, p.x, p.y) <= EMP_CONFIG.radius) {
        if (enemy.hit(EMP_CONFIG.damage)) {
          this.destroyEnemy(enemy);
        } else {
          enemy.stun(EMP_CONFIG.stunDuration);
        }
      }
    }
    AudioFX.emp();
  }

  tryDash() {
    if (this.player.startDash()) {
      AudioFX.dash();
    } else if (this.player.energy < this.player.dashCost) {
      AudioFX.warning();
    }
  }

  deployGravityField() {
    if (this.gravityCooldown > 0) {
      AudioFX.warning();
      return;
    }
    this.gravityField = {
      x: this.player.x,
      y: this.player.y,
      timer: GRAVITY_FIELD_CONFIG.duration,
    };
    this.gravityCooldown = this.gravityCooldownMax;
    AudioFX.gravity();
  }

  setWeapon(weapon) {
    if (Object.values(Weapon).includes(weapon)) {
      this.player.weapon = weapon;
    }
  }

  findNearestEnemy(x, y) {
    let nearest = null;
    let best = Infinity;
    for (const enemy of this.enemyManager.aliveEnemies) {
      if (!enemy.isOnScreen()) continue;
      const d = distance(enemy.x, enemy.y, x, y);
      if (d < best) {
        best = d;
        nearest = enemy;
      }
    }
    return nearest;
  }

  // ===== 敵・コア関連 =====

  destroyEnemy(enemy, awardScore = true) {
    enemy.dead = true;
    this.spawnExplosion(enemy.x, enemy.y, enemy.color);
    if (awardScore) this.registerKill(enemy);

    // 分裂機：撃破時に小型機2体へ分かれる
    if (enemy.type === "splitter") {
      for (const offset of [-16, 16]) {
        this.enemyManager.addEnemy(
          new Enemy(
            "mini",
            enemy.x + offset,
            enemy.y + Math.abs(offset) * 0.4,
            this.wave,
            this.getScaling(),
          ),
        );
      }
    }
    AudioFX.explode();
  }

  onEnemyReachedCore(enemy) {
    this.coreHp = Math.max(0, this.coreHp - enemy.coreDamage);
    this.spawnExplosion(enemy.x, enemy.y, "#93c5fd");
    AudioFX.coreDamage();
    if (this.coreHp <= 0) {
      this.gameOver();
    }
  }

  spawnExplosion(x, y, color) {
    this.explosions.push({
      x,
      y,
      timer: 0.3,
      max: 0.3,
      color: color || "#fbbf24",
    });
  }

  gameOver() {
    AudioFX.gameOver();
    this.setState(GameState.GAME_OVER);
  }

  // ===== メインループ =====

  update(deltaTime, now) {
    // 星空は常に流す（タイトル背景と共用）
    for (const star of this.stars) {
      star.y += star.speed * deltaTime;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    }

    if (this.state !== GameState.PLAYING) return;

    // プレイヤー
    this.player.update(deltaTime, this.input);
    if (this.input.fire) this.tryFire(now);

    // 重力フィールド
    if (this.gravityCooldown > 0) {
      this.gravityCooldown = Math.max(0, this.gravityCooldown - deltaTime);
    }
    if (this.gravityField) {
      this.gravityField.timer -= deltaTime;
      if (this.gravityField.timer <= 0) this.gravityField = null;
    }

    // コンボ猶予
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // 敵・弾
    this.enemyManager.update(deltaTime, this);
    if (this.state !== GameState.PLAYING) return; // コア破壊で終了した場合

    const fields = this.gravityField ? [this.gravityField] : [];
    this.projectiles.update(deltaTime, fields);

    // 演出
    for (const ex of this.explosions) ex.timer -= deltaTime;
    this.explosions = this.explosions.filter((ex) => ex.timer > 0);
    for (const pulse of this.empPulses) pulse.timer -= deltaTime;
    this.empPulses = this.empPulses.filter((p) => p.timer > 0);

    this.handleCollisions();
    if (this.state !== GameState.PLAYING) return;

    // ウェーブクリア判定
    if (this.enemyManager.remainingCount === 0) {
      this.completeWave();
      return;
    }

    // 残機0判定
    if (this.player.lives <= 0) {
      this.gameOver();
    }
  }

  completeWave() {
    // コア残存耐久ボーナス
    this.lastWaveBonus = this.coreHp * CORE_HP_BONUS_RATE;
    this.addScore(this.lastWaveBonus);

    // アップグレード候補を3つ抽選
    const pool = UPGRADE_POOL.slice();
    this.upgradeChoices = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      this.upgradeChoices.push(pool.splice(idx, 1)[0]);
    }

    AudioFX.waveClear();
    this.setState(GameState.WAVE_CLEAR);
  }

  handleCollisions() {
    const alive = this.enemyManager.aliveEnemies;

    // 自機の弾 × 敵
    for (const shot of this.projectiles.playerShots) {
      if (shot.dead) continue;
      for (const enemy of alive) {
        if (enemy.dead) continue;
        if (circlesCollide(shot, enemy)) {
          shot.dead = true;
          if (enemy.hit(shot.damage)) {
            this.destroyEnemy(enemy);
          } else {
            AudioFX.hitEnemy();
          }
          break;
        }
      }
    }

    // 自機の弾 × 敵の弾。命中した2発を相殺する
    for (const playerShot of this.projectiles.playerShots) {
      if (playerShot.dead) continue;
      for (const enemyShot of this.projectiles.enemyShots) {
        if (enemyShot.dead) continue;
        if (circlesCollide(playerShot, enemyShot)) {
          playerShot.dead = true;
          enemyShot.dead = true;
          this.spawnExplosion(enemyShot.x, enemyShot.y, "#dbeafe");
          AudioFX.shotClash();
          break;
        }
      }
    }

    // 敵の弾 × 自機
    for (const shot of this.projectiles.enemyShots) {
      if (shot.dead) continue;
      if (circlesCollide(shot, this.player)) {
        shot.dead = true;
        this.hitPlayer();
        continue;
      }

      // 敵の弾 × 防衛コア
      if (circlesCollide(shot, CORE_CONFIG)) {
        shot.dead = true;
        this.coreHp = Math.max(0, this.coreHp - shot.damage);
        this.spawnExplosion(shot.x, shot.y, "#bae6fd");
        AudioFX.enemyShotHitCore();
        if (this.coreHp <= 0) {
          this.gameOver();
          break;
        }
      }
    }

    // 敵 × 自機（体当たり）。無敵時間中は判定しない
    if (!this.player.isInvincible) {
      for (const enemy of alive) {
        if (enemy.dead) continue;
        if (circlesCollide(enemy, this.player)) {
          if (enemy.hit(1)) {
            // 体当たりで壊した敵にはスコアを与えない
            this.destroyEnemy(enemy, false);
          }
          this.hitPlayer();
          break;
        }
      }
    }

    this.projectiles.playerShots = this.projectiles.playerShots.filter(
      (s) => !s.dead,
    );
    this.projectiles.enemyShots = this.projectiles.enemyShots.filter(
      (s) => !s.dead,
    );
  }

  hitPlayer() {
    const wasHit = this.player.hit();
    if (wasHit) {
      this.spawnExplosion(this.player.x, this.player.y, "#67e8f9");
      this.combo = 0;
      this.comboTimer = 0;
      AudioFX.playerHit();
      if (this.player.lives <= 0) {
        this.gameOver();
      }
    }
  }

  // ===== 描画 =====

  draw() {
    const ctx = this.ctx;

    // 背景：濃紺から紫へのグラデーション
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, "#141433");
    bg.addColorStop(0.6, "#1a1040");
    bg.addColorStop(1, "#241245");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 多層スクロールの星
    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = "#e0e7ff";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    if (this.state === GameState.TITLE) return;

    this.drawCore(ctx);
    this.drawGravityField(ctx);
    this.enemyManager.draw(ctx);
    this.projectiles.draw(ctx);
    this.player.draw(ctx);
    this.drawEffects(ctx);
  }

  drawCore(ctx) {
    const { x, y, radius } = CORE_CONFIG;
    const pulse = 1 + Math.sin(Date.now() / 400) * 0.08;

    ctx.save();

    // 発光
    ctx.shadowColor = "#93c5fd";
    ctx.shadowBlur = 24;

    // 外殻（六角形）
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + Math.cos(a) * radius * pulse;
      const py = y + Math.sin(a) * radius * pulse;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 中心の発光球
    ctx.fillStyle = "#dbeafe";
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.45 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 耐久リング
    ctx.shadowBlur = 0;
    const ratio = this.coreHp / CORE_CONFIG.maxHp;
    ctx.strokeStyle =
      ratio > 0.5 ? "#4ade80" : ratio > 0.25 ? "#facc15" : "#f87171";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();

    ctx.restore();
  }

  drawGravityField(ctx) {
    if (!this.gravityField) return;
    const f = this.gravityField;
    const fade = Math.min(1, f.timer / 0.6);
    ctx.save();
    ctx.globalAlpha = 0.25 * fade;
    const grad = ctx.createRadialGradient(
      f.x,
      f.y,
      8,
      f.x,
      f.y,
      GRAVITY_FIELD_CONFIG.radius,
    );
    grad.addColorStop(0, "#c084fc");
    grad.addColorStop(1, "rgba(192, 132, 252, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, GRAVITY_FIELD_CONFIG.radius, 0, Math.PI * 2);
    ctx.fill();

    // 渦を思わせる回転リング
    ctx.globalAlpha = 0.5 * fade;
    ctx.strokeStyle = "#d8b4fe";
    ctx.lineWidth = 1.5;
    const spin = Date.now() / 600;
    for (let i = 0; i < 3; i++) {
      const r = GRAVITY_FIELD_CONFIG.radius * (0.35 + i * 0.25);
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, spin + i * 2, spin + i * 2 + Math.PI * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawEffects(ctx) {
    // 撃破の爆発（広がるリング＋粒子）
    for (const ex of this.explosions) {
      const progress = 1 - ex.timer / ex.max;
      const r = 6 + progress * 26;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = ex.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ex.color;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + progress * 2;
        ctx.fillRect(
          ex.x + Math.cos(a) * r * 0.8 - 1.5,
          ex.y + Math.sin(a) * r * 0.8 - 1.5,
          3,
          3,
        );
      }
      ctx.restore();
    }

    // EMPの放射パルス
    for (const pulse of this.empPulses) {
      const progress = 1 - pulse.timer / 0.45;
      ctx.save();
      ctx.globalAlpha = 0.7 * (1 - progress);
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, EMP_CONFIG.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ===== localStorage =====

function loadHighScore() {
  return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
}

function saveHighScore(value) {
  localStorage.setItem(HIGH_SCORE_KEY, String(value));
}

function loadDifficulty() {
  return localStorage.getItem(DIFFICULTY_KEY) || Difficulty.NORMAL;
}

function saveDifficulty(value) {
  localStorage.setItem(DIFFICULTY_KEY, value);
}

function loadVolume() {
  const saved = localStorage.getItem(VOLUME_KEY);
  if (saved === null) return 0;
  const v = Number(saved);
  return Number.isFinite(v) ? clamp(v, 0, 1) : 0;
}

function saveVolume(value) {
  localStorage.setItem(VOLUME_KEY, String(value));
}

function loadBgmVolume() {
  const saved = localStorage.getItem(BGM_VOLUME_KEY);
  if (saved === null) return 0;
  const v = Number(saved);
  return Number.isFinite(v) ? clamp(v, 0, 1) : 0;
}

function saveBgmVolume(value) {
  localStorage.setItem(BGM_VOLUME_KEY, String(value));
}

// enemy.js — 暴走ドローン（敵）5種の行動・描画と、ウェーブ中の出現管理

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

class Enemy {
  constructor(type, x, y, wave, scaling) {
    const cfg = ENEMY_CONFIG[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = cfg.radius;
    this.score = cfg.score;
    this.coreDamage = cfg.coreDamage;
    this.color = cfg.color;
    this.dead = false;

    // 難易度・ウェーブによる補正
    const waveSpeedMult = Math.min(
      1 + (wave - 1) * WAVE_SCALING.speedPerWave,
      WAVE_SCALING.speedCap
    );
    this.speed = cfg.speed * scaling.speedScale * waveSpeedMult;
    const hpBonus = Math.floor((wave - 1) / WAVE_SCALING.hpBonusEveryWaves);
    this.hp = Math.max(1, Math.round(cfg.hp * scaling.hpScale)) + (cfg.hp > 1 ? hpBonus : 0);
    this.maxHp = this.hp;

    this.stunTimer = 0;
    this.age = Math.random() * Math.PI * 2; // 蛇行の位相
    this.spin = 0;

    // 射撃（スカウト・分裂機のみ）
    this.canShoot = type === "scout" || type === "splitter";
    this.fireTimer = this.randomFireInterval(scaling) * (0.5 + Math.random() * 0.8);
    this.fireIntervalScale = scaling.fireIntervalScale;
    this.bulletSpeed =
      PROJECTILE_CONFIG.enemy.speed * (1 + (wave - 1) * WAVE_SCALING.bulletSpeedPerWave);
  }

  randomFireInterval(scaling) {
    const min = ENEMY_FIRE_CONFIG.minInterval * scaling.fireIntervalScale;
    const max = ENEMY_FIRE_CONFIG.maxInterval * scaling.fireIntervalScale;
    return (min + Math.random() * (max - min)) / 1000; // 秒
  }

  get isStunned() {
    return this.stunTimer > 0;
  }

  stun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  // ダメージを与える。撃破したら true
  hit(damage) {
    this.hp -= damage;
    return this.hp <= 0;
  }

  isOnScreen() {
    return (
      this.x >= -this.radius &&
      this.x <= CANVAS_WIDTH + this.radius &&
      this.y >= -this.radius &&
      this.y <= CANVAS_HEIGHT + this.radius
    );
  }

  update(deltaTime, game) {
    if (this.isStunned) {
      this.stunTimer -= deltaTime;
      return;
    }

    this.age += deltaTime;
    this.spin += deltaTime * 2.4;

    // 基本方針：防衛コアへ向かう
    const toCore = unitVector(this.x, this.y, CORE_CONFIG.x, CORE_CONFIG.y);
    let vx = toCore.x * this.speed;
    let vy = toCore.y * this.speed;

    // 種類ごとの動きの個性
    if (this.type === "scout" || this.type === "mini") {
      // 曲線移動：進行方向と垂直に振動する
      const wobble = Math.sin(this.age * 3) * this.speed * 0.55;
      vx += -toCore.y * wobble;
      vy += toCore.x * wobble;
    } else if (this.type === "splitter") {
      // 大きめの蛇行
      const wobble = Math.sin(this.age * 1.8) * this.speed * 0.8;
      vx += -toCore.y * wobble;
      vy += toCore.x * wobble;
    }
    // driller / shielder はコアへ直進

    this.x += vx * deltaTime;
    this.y += vy * deltaTime;

    // 射撃：画面内にいるときだけプレイヤーを狙う
    if (this.canShoot && this.isOnScreen()) {
      this.fireTimer -= deltaTime;
      if (this.fireTimer <= 0) {
        this.fireTimer = this.randomFireInterval({ fireIntervalScale: this.fireIntervalScale });
        game.projectiles.fireEnemyShot(
          this.x,
          this.y,
          game.player.x,
          game.player.y,
          this.bulletSpeed
        );
      }
    }

    // 防衛コアへの到達
    if (circlesCollide(this, CORE_CONFIG)) {
      this.dead = true;
      game.onEnemyReachedCore(this);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.isStunned) {
      ctx.globalAlpha = 0.45;
    }
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    switch (this.type) {
      case "scout":
      case "mini":
        this.drawScout(ctx);
        break;
      case "shielder":
        this.drawShielder(ctx);
        break;
      case "driller":
        this.drawDriller(ctx);
        break;
      case "splitter":
        this.drawSplitter(ctx);
        break;
      default:
        this.drawScout(ctx);
        break;
    }

    ctx.restore();
  }

  // 三角形＋中央に青い発光部
  drawScout(ctx) {
    const angle = Math.atan2(CORE_CONFIG.y - this.y, CORE_CONFIG.x - this.x);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.85, this.radius * 0.9);
    ctx.lineTo(-this.radius * 0.85, this.radius * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // 六角形＋外周リング。耐久が減るとリングが欠ける
  drawShielder(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + this.spin * 0.3;
      const px = Math.cos(a) * this.radius * 0.72;
      const py = Math.sin(a) * this.radius * 0.72;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 残耐久に応じた半透明リング
    const ratio = this.hp / this.maxHp;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(196, 181, 253, 0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }

  // 細長い菱形。コアへの直進を強調
  drawDriller(ctx) {
    const angle = Math.atan2(CORE_CONFIG.y - this.y, CORE_CONFIG.x - this.x);
    ctx.rotate(angle);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.5, 0);
    ctx.lineTo(-this.radius * 0.6, -this.radius * 0.65);
    ctx.lineTo(-this.radius * 1.1, 0);
    ctx.lineTo(-this.radius * 0.6, this.radius * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fecaca";
    ctx.beginPath();
    ctx.arc(this.radius * 0.5, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 球体＋回転する3本アーム
  drawSplitter(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = this.spin + ((Math.PI * 2) / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * this.radius * 0.6, Math.sin(a) * this.radius * 0.6);
      ctx.lineTo(Math.cos(a) * this.radius * 1.25, Math.sin(a) * this.radius * 1.25);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f3e8ff";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

class EnemyManager {
  constructor(wave, scaling) {
    this.wave = wave;
    this.scaling = scaling;
    this.enemies = [];
    this.elapsed = 0;
    // buildWave は stage.js で定義。delay 順に処理する
    this.spawnEvents = buildWave(wave).sort((a, b) => a.delay - b.delay);
    this.spawnIndex = 0;
  }

  get aliveEnemies() {
    return this.enemies.filter((e) => !e.dead);
  }

  // 出現待ちを含む残数（0になったらウェーブクリア）
  get remainingCount() {
    return this.spawnEvents.length - this.spawnIndex + this.aliveEnemies.length;
  }

  // 分裂機の撃破時などに直接追加する
  addEnemy(enemy) {
    this.enemies.push(enemy);
  }

  update(deltaTime, game) {
    this.elapsed += deltaTime;

    // 出現時刻に達した敵を投入
    while (
      this.spawnIndex < this.spawnEvents.length &&
      this.spawnEvents[this.spawnIndex].delay <= this.elapsed
    ) {
      const ev = this.spawnEvents[this.spawnIndex];
      this.enemies.push(new Enemy(ev.type, ev.x, ev.y, this.wave, this.scaling));
      this.spawnIndex += 1;
    }

    for (const enemy of this.enemies) {
      if (!enemy.dead) enemy.update(deltaTime, game);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  draw(ctx) {
    for (const enemy of this.enemies) {
      if (!enemy.dead) enemy.draw(ctx);
    }
  }
}

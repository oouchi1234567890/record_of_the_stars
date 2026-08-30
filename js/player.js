// player.js — 防衛ドローン（自機）の状態、自由移動、エネルギー、ダッシュ

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

class Player {
  constructor() {
    this.radius = PLAYER_CONFIG.radius;
    this.reset();
  }

  // ゲーム開始時の完全リセット（アップグレードも初期化）
  reset() {
    this.x = CORE_CONFIG.x;
    this.y = CORE_CONFIG.y + 120;
    this.lives = PLAYER_CONFIG.initialLives;
    this.lastFireTime = -Infinity;
    this.invincibleTimer = 0;
    this.blinkVisible = true;
    this.blinkTimer = 0;
    this.facing = { x: 0, y: -1 };
    this.weapon = Weapon.NORMAL;

    // エネルギー
    this.energyMax = ENERGY_CONFIG.max;
    this.energy = this.energyMax;
    this.energyRegen = ENERGY_CONFIG.regenPerSec;

    // ダッシュ
    this.dashTimer = 0;
    this.dashDir = { x: 0, y: -1 };
    this.dashCost = ENERGY_CONFIG.costs.dash;

    // アップグレードで変化するステータス
    this.bulletSpeedMult = 1.0;
    this.fireInterval = PLAYER_CONFIG.fireInterval;
  }

  get isInvincible() {
    return this.invincibleTimer > 0;
  }

  get isDashing() {
    return this.dashTimer > 0;
  }

  spendEnergy(cost) {
    if (this.energy < cost) return false;
    this.energy -= cost;
    return true;
  }

  canFire(now) {
    return now - this.lastFireTime >= this.fireInterval;
  }

  startDash() {
    if (this.isDashing) return false;
    if (!this.spendEnergy(this.dashCost)) return false;
    this.dashTimer = DASH_CONFIG.duration;
    this.dashDir = { x: this.facing.x, y: this.facing.y };
    this.invincibleTimer = Math.max(this.invincibleTimer, DASH_CONFIG.invincibleDuration);
    return true;
  }

  hit() {
    if (this.isInvincible) return false;
    this.lives -= 1;
    this.invincibleTimer = PLAYER_CONFIG.invincibleDuration;
    return true;
  }

  // input: { up, down, left, right }
  update(deltaTime, input) {
    // 移動方向の決定（ダッシュ中はダッシュ方向を優先）
    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.sqrt(mx * mx + my * my);
      mx /= len;
      my /= len;
      this.facing = { x: mx, y: my };
    }

    if (this.isDashing) {
      this.dashTimer -= deltaTime;
      const dashSpeed = PLAYER_CONFIG.speed * DASH_CONFIG.speedMultiplier;
      this.x += this.dashDir.x * dashSpeed * deltaTime;
      this.y += this.dashDir.y * dashSpeed * deltaTime;
    } else {
      this.x += mx * PLAYER_CONFIG.speed * deltaTime;
      this.y += my * PLAYER_CONFIG.speed * deltaTime;
    }

    // 画面内に収める
    this.x = clamp(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, CANVAS_HEIGHT - this.radius);

    // 防衛コアと重ならないように押し出す
    const coreDist = distance(this.x, this.y, CORE_CONFIG.x, CORE_CONFIG.y);
    const minDist = CORE_CONFIG.radius + this.radius;
    if (coreDist < minDist) {
      const dir = unitVector(CORE_CONFIG.x, CORE_CONFIG.y, this.x, this.y);
      this.x = CORE_CONFIG.x + dir.x * minDist;
      this.y = CORE_CONFIG.y + dir.y * minDist;
    }

    // エネルギー自動回復
    this.energy = Math.min(this.energyMax, this.energy + this.energyRegen * deltaTime);

    // 無敵時間と点滅
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= deltaTime;
      this.blinkTimer += deltaTime;
      if (this.blinkTimer >= 0.1) {
        this.blinkTimer = 0;
        this.blinkVisible = !this.blinkVisible;
      }
      if (this.invincibleTimer <= 0) {
        this.invincibleTimer = 0;
        this.blinkVisible = true;
      }
    }
  }

  draw(ctx) {
    if (this.isInvincible && !this.blinkVisible) return;

    const angle = Math.atan2(this.facing.y, this.facing.x);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle + Math.PI / 2);

    // ダッシュ中は残光を描く
    if (this.isDashing) {
      ctx.strokeStyle = "rgba(103, 232, 249, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, this.radius + 6);
      ctx.lineTo(0, this.radius + 18);
      ctx.lineTo(8, this.radius + 6);
      ctx.stroke();
    }

    // 機体（水色の三角形ドローン）
    ctx.shadowColor = "#67e8f9";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.9, this.radius * 0.8);
    ctx.lineTo(0, this.radius * 0.35);
    ctx.lineTo(-this.radius * 0.9, this.radius * 0.8);
    ctx.closePath();
    ctx.fill();

    // 中央コクピットの発光
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f0fdff";
    ctx.beginPath();
    ctx.arc(0, -1, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

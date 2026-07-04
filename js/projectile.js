// projectile.js — 自機弾・敵弾の管理（自由角度、重力フィールドによる偏向対応）

class Projectile {
  constructor(x, y, vx, vy, radius, friendly, damage, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.friendly = friendly; // true: 自機の弾
    this.damage = damage;
    this.color = color;
    this.dead = false;
  }

  update(deltaTime, gravityFields) {
    // 敵弾のみ重力フィールドで軌道が曲がる
    if (!this.friendly && gravityFields) {
      for (const field of gravityFields) {
        const dx = this.x - field.x;
        const dy = this.y - field.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0 && d < GRAVITY_FIELD_CONFIG.radius) {
          const push = GRAVITY_FIELD_CONFIG.strength * (1 - d / GRAVITY_FIELD_CONFIG.radius);
          this.vx += (dx / d) * push * deltaTime;
          this.vy += (dy / d) * push * deltaTime;
        }
      }
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    const margin = 40;
    if (
      this.x < -margin ||
      this.x > CANVAS_WIDTH + margin ||
      this.y < -margin ||
      this.y > CANVAS_HEIGHT + margin
    ) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ProjectileManager {
  constructor() {
    this.playerShots = [];
    this.enemyShots = [];
  }

  reset() {
    this.playerShots = [];
    this.enemyShots = [];
  }

  // 自機弾。angle はラジアン（0 = 右、-PI/2 = 上）
  firePlayerShot(x, y, angle, speed) {
    const cfg = PROJECTILE_CONFIG.player;
    this.playerShots.push(
      new Projectile(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        cfg.radius,
        true,
        cfg.damage,
        "#67e8f9"
      )
    );
  }

  fireEnemyShot(x, y, targetX, targetY, speed) {
    if (this.enemyShots.length >= PROJECTILE_CONFIG.enemy.maxCount) return false;
    const dir = unitVector(x, y, targetX, targetY);
    this.enemyShots.push(
      new Projectile(
        x,
        y,
        dir.x * speed,
        dir.y * speed,
        PROJECTILE_CONFIG.enemy.radius,
        false,
        1,
        "#fbbf24"
      )
    );
    return true;
  }

  // 指定座標を中心とした半径内の敵弾を消去し、消した数を返す（EMP用）
  clearEnemyShotsWithin(x, y, radius) {
    let cleared = 0;
    for (const shot of this.enemyShots) {
      if (!shot.dead && distance(shot.x, shot.y, x, y) <= radius) {
        shot.dead = true;
        cleared += 1;
      }
    }
    return cleared;
  }

  update(deltaTime, gravityFields) {
    for (const shot of this.playerShots) shot.update(deltaTime, null);
    for (const shot of this.enemyShots) shot.update(deltaTime, gravityFields);
    this.playerShots = this.playerShots.filter((s) => !s.dead);
    this.enemyShots = this.enemyShots.filter((s) => !s.dead);
  }

  draw(ctx) {
    for (const shot of this.playerShots) shot.draw(ctx);
    for (const shot of this.enemyShots) shot.draw(ctx);
  }
}

// collision.js — 円同士の当たり判定とベクトル系ユーティリティ

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

function distance(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// a, b は { x, y, radius } を持つオブジェクト
function circlesCollide(a, b) {
  const r = a.radius + b.radius;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy <= r * r;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// (ax, ay) から (bx, by) への単位ベクトル。距離0のときは (0, -1) を返す
function unitVector(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return { x: 0, y: -1 };
  return { x: dx / d, y: dy / d };
}

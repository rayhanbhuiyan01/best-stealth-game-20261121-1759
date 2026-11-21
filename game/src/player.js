// Nightshade — Shadow Courier: the courier. Walks with WASD or arrows,
// sneaks while Shift is held (slower, silent), runs otherwise (loud — the
// noise ring draws guards). Clicking a tile walks there along a found path.

import { TILE, WALK_SPEED, SNEAK_SPEED, NOISE_RADIUS } from './config.js';

export class Courier {
  constructor(world) {
    this.radius = 13;
    this.reset(world);
  }

  reset(world) {
    this.x = world.playerStart.x;
    this.y = world.playerStart.y;
    this.facing = 0; // radians, drawn direction
    this.moving = false;
    this.sneaking = false;
    this.noise = 0; // 0 silent, 1 loud right now
    this.noisePulse = 0; // visible ring strength, decays
    this.path = null;
    this.pathIndex = 0;
    this.stepTimer = 0;
    this.stepped = false; // true for one update when a footstep lands
  }

  // Axis-separated movement with circle collision, so the courier slides
  // along walls instead of sticking to them.
  tryMove(world, dx, dy) {
    const nx = this.x + dx;
    if (world.canStand(nx, this.y, this.radius)) this.x = nx;
    const ny = this.y + dy;
    if (world.canStand(this.x, ny, this.radius)) this.y = ny;
  }

  update(dt, input, world) {
    this.stepped = false;
    const vec = input.moveVector();
    let mx = vec.x;
    let my = vec.y;
    if (mx === 0 && my === 0 && this.path) {
      const target = this.path[this.pathIndex];
      if (target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          this.pathIndex++;
          if (this.pathIndex >= this.path.length) this.path = null;
        } else {
          mx = dx / dist;
          my = dy / dist;
        }
      } else {
        this.path = null;
      }
    }
    // A fresh key press cancels click-to-move.
    if (vec.x !== 0 || vec.y !== 0) this.path = null;

    this.sneaking = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      this.tryMove(world, mx * speed * dt, my * speed * dt);
      this.facing = Math.atan2(my, mx);
      this.noise = this.sneaking ? 0 : 1;
      this.noisePulse = this.sneaking ? Math.max(0, this.noisePulse - dt * 2) : 1;
      this.stepTimer += dt;
      const stepEvery = this.sneaking ? 0.55 : 0.34;
      if (this.stepTimer >= stepEvery) {
        this.stepTimer = 0;
        this.stepped = true;
      }
    } else {
      this.noise = 0;
      this.noisePulse = Math.max(0, this.noisePulse - dt * 1.5);
    }
  }

  setClickPath(world, px, py) {
    const path = world.findPath(this.x, this.y, px, py);
    if (path && path.length > 1) {
      this.path = path;
      this.pathIndex = 1;
    }
  }

  // The scroll under the courier's feet, if any.
  scrollAtFeet(world) {
    for (const s of world.scrolls) {
      if (s.taken) continue;
      const dx = s.x - this.x;
      const dy = s.y - this.y;
      if (dx * dx + dy * dy < 24 * 24) return s;
    }
    return null;
  }

  atExit(world) {
    if (!world.exit) return false;
    const dx = world.exit.x - this.x;
    const dy = world.exit.y - this.y;
    return dx * dx + dy * dy < 26 * 26;
  }

  hiddenInBush(world) {
    return world.isBushAtPx(this.x, this.y);
  }

  noiseRadius() {
    return this.noisePulse > 0 ? NOISE_RADIUS * this.noisePulse : 0;
  }
}

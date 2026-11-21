// Nightshade — Shadow Courier: lantern guards. Each guard walks a patrol
// route with a vision cone raycast against walls and crates. The guard's
// mind is four states:
//   patrol     — walk waypoints, pause and look around at each one
//   suspicious — saw or heard something briefly; stop, look at it, suspicion fills
//   chase      — clearly sees the courier; run at the courier, cone turns red
//   search     — lost the courier; wander the last seen spot, then patrol again
// Suspicion fills while the courier is in the cone and drains when hidden.
// A courier inside a bush is invisible unless the guard is very close.

import {
  TILE,
  VISION_RANGE,
  VISION_HALF_ANGLE,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_SEARCH_SPEED,
  NOISE_RADIUS,
  BUSH_HIDE_RANGE,
  CATCH_DISTANCE,
} from './config.js';
import { rngRange } from './random.js';

const CONE_RAYS = 26;

export class Guard {
  constructor(world, def, rng, index) {
    this.index = index;
    this.rng = rng;
    this.waypoints = def.waypoints.map(([tx, ty]) => {
      const safe = world.nearestFloor(tx, ty);
      return world.tileCenter(safe.tx, safe.ty);
    });
    this.wpIndex = 0;
    const start = this.waypoints[0] ?? world.tileCenter(2, 2);
    this.x = start.x;
    this.y = start.y;
    this.angle = 0;
    this.state = 'patrol';
    this.suspicion = 0;
    this.stateTimer = 0;
    this.loseTimer = 0;
    this.searchTimer = 0;
    this.pauseTimer = 0;
    this.lastSeen = { x: start.x, y: start.y };
    this.investigate = null;
    this.searchTarget = null;
    this.radius = 13;
    this.alertFired = false;
    this.cone = [];
  }

  reset(world) {
    const start = this.waypoints[0] ?? world.tileCenter(2, 2);
    this.x = start.x;
    this.y = start.y;
    this.wpIndex = 0;
    this.angle = 0;
    this.state = 'patrol';
    this.suspicion = 0;
    this.stateTimer = 0;
    this.loseTimer = 0;
    this.searchTimer = 0;
    this.pauseTimer = 0;
    this.lastSeen = { x: start.x, y: start.y };
    this.investigate = null;
    this.searchTarget = null;
    this.alertFired = false;
    this.cone = [];
  }

  // Can this guard see the courier right now?
  canSee(player, world) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > VISION_RANGE) return false;
    if (player.hiddenInBush(world) && dist > BUSH_HIDE_RANGE) return false;
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > VISION_HALF_ANGLE) return false;
    return world.lineOfSight(this.x, this.y, player.x, player.y);
  }

  // The vision cone as a polygon, raycast against walls and crates so the
  // drawn cone is clipped by the level geometry.
  computeCone(world) {
    const points = [{ x: this.x, y: this.y }];
    for (let i = 0; i <= CONE_RAYS; i++) {
      const a = this.angle - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / CONE_RAYS;
      const stepX = Math.cos(a);
      const stepY = Math.sin(a);
      let reach = VISION_RANGE;
      for (let d = 8; d <= VISION_RANGE; d += 6) {
        if (world.isSolidAtPx(this.x + stepX * d, this.y + stepY * d)) {
          reach = d;
          break;
        }
      }
      points.push({ x: this.x + stepX * reach, y: this.y + stepY * reach });
    }
    this.cone = points;
    return points;
  }

  // A loud noise nearby: turn suspicious and look toward the sound.
  hearNoise(x, y) {
    if (this.state === 'chase') return;
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.hypot(dx, dy) > NOISE_RADIUS + 40) return;
    this.suspicion = Math.max(this.suspicion, 0.5);
    this.investigate = { x, y };
    if (this.state === 'patrol') {
      this.state = 'suspicious';
      this.stateTimer = 0;
    }
  }

  moveToward(world, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (world.canStand(nx, this.y, this.radius)) this.x = nx;
    if (world.canStand(this.x, ny, this.radius)) this.y = ny;
    const targetAngle = Math.atan2(dy, dx);
    this.angle = turnToward(this.angle, targetAngle, dt * 6);
    return dist <= step + 1;
  }

  // One frame of the guard's mind. Returns events: 'spotted' once when a
  // chase begins, 'caught' when the guard reaches the courier.
  update(dt, player, world) {
    const events = [];
    const sees = this.canSee(player, world);
    if (sees) {
      this.lastSeen = { x: player.x, y: player.y };
      this.loseTimer = 0;
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const closeness = 1 - dist / VISION_RANGE;
      this.suspicion = Math.min(1, this.suspicion + dt * (0.9 + closeness * 1.3));
      if (this.suspicion >= 1 && this.state !== 'chase') {
        this.state = 'chase';
        this.stateTimer = 0;
        if (!this.alertFired) {
          this.alertFired = true;
          events.push('spotted');
        }
      }
    } else {
      if (this.state === 'chase') {
        this.loseTimer += dt;
        if (this.loseTimer > 2.5) {
          this.state = 'search';
          this.stateTimer = 0;
          this.searchTimer = 0;
          this.searchTarget = { x: this.lastSeen.x, y: this.lastSeen.y };
        }
      } else {
        this.suspicion = Math.max(0, this.suspicion - dt * 0.32);
      }
    }

    if (this.state === 'patrol') {
      this.alertFired = false;
      if (this.suspicion >= 0.45) {
        this.state = 'suspicious';
        this.stateTimer = 0;
      } else if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        this.angle += Math.sin(this.stateTimer * 1.4) * dt * 0.8;
        this.stateTimer += dt;
      } else {
        const target = this.waypoints[this.wpIndex];
        if (target) {
          const arrived = this.moveToward(world, target.x, target.y, GUARD_PATROL_SPEED, dt);
          if (arrived) {
            this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
            this.pauseTimer = 0.9;
            this.stateTimer = 0;
          }
        }
      }
    } else if (this.state === 'suspicious') {
      this.stateTimer += dt;
      const look = this.investigate ?? this.lastSeen;
      this.angle = turnToward(this.angle, Math.atan2(look.y - this.y, look.x - this.x), dt * 4);
      if (this.stateTimer > 1.6) {
        this.investigate = null;
        if (this.suspicion < 0.45) {
          this.state = 'patrol';
          this.stateTimer = 0;
        } else {
          this.stateTimer = 0;
        }
      }
    } else if (this.state === 'chase') {
      this.stateTimer += dt;
      this.moveToward(world, player.x, player.y, GUARD_CHASE_SPEED, dt);
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist < CATCH_DISTANCE) events.push('caught');
    } else if (this.state === 'search') {
      this.stateTimer += dt;
      this.searchTimer += dt;
      if (!this.searchTarget) {
        this.searchTarget = {
          x: this.lastSeen.x + rngRange(this.rng, -70, 70),
          y: this.lastSeen.y + rngRange(this.rng, -70, 70),
        };
      }
      const arrived = this.moveToward(world, this.searchTarget.x, this.searchTarget.y, GUARD_SEARCH_SPEED, dt);
      if (arrived || this.searchTimer > 5) {
        this.searchTarget = null;
        this.searchTimer = 0;
        if (this.stateTimer > 7) {
          this.state = 'patrol';
          this.stateTimer = 0;
          this.suspicion = 0;
        }
      }
    }

    this.computeCone(world);
    return events;
  }
}

// Turn `from` toward `to` by at most `maxStep` radians, shortest way around.
export function turnToward(from, to, maxStep) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return to;
  return from + Math.sign(diff) * maxStep;
}

export { TILE };

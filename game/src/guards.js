// Lantern guards: patrol waypoints, vision cones, suspicion and chase.
// States: patrol -> suspicious (saw a glimpse, walks over to look) ->
// chase (saw the courier clearly, runs at them) -> search (lost them,
// looks around, then walks back to patrol). A guard that reaches the
// courier catches them. Noise draws a suspicious guard to the sound.

import { GUARD, TILE } from './config.js';
import { hasLineOfSight, moveCircle } from './world.js';

export function makeGuard(def, index) {
  const [sx, sy] = def.patrol[0];
  return {
    index,
    x: (sx + 0.5) * TILE,
    y: (sy + 0.5) * TILE,
    radius: GUARD.radius,
    patrol: def.patrol.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE })),
    waypoint: 1 % def.patrol.length,
    facing: Math.PI / 2,
    speed: def.speed || GUARD.patrolSpeed,
    state: 'patrol', // patrol | suspicious | chase | search
    suspicion: 0, // 0..1, fills while the courier is seen
    lastSeen: null, // {x, y} where the courier was last spotted
    searchTime: 0,
    pauseTime: 0,
    bobPhase: index * 1.7,
  };
}

// Can this guard see the courier right now? Distance, cone angle, line
// of sight — and a courier hidden in a bush is only seen up very close.
export function guardSeesPlayer(guard, player, world) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const maxDist = player.hidden ? 55 : GUARD.viewDistance;
  if (dist > maxDist) return false;
  const angleTo = Math.atan2(dy, dx);
  let diff = angleTo - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.viewAngle) return false;
  return hasLineOfSight(world, guard.x, guard.y, player.x, player.y);
}

function stepToward(guard, world, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const nx = dx / d;
  const ny = dy / d;
  guard.facing = Math.atan2(ny, nx);
  moveCircle(world, guard, nx * speed * dt, ny * speed * dt, guard.radius);
  return false;
}

export function updateGuard(guard, player, world, noiseRadius, dt) {
  const sees = guardSeesPlayer(guard, player, world);
  const distToPlayer = Math.hypot(player.x - guard.x, player.y - guard.y);
  guard.bobPhase += dt * 6;

  if (sees) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.suspicion += GUARD.suspicionPerSecond * dt;
    if (guard.suspicion >= 1) guard.state = 'chase';
    else if (guard.state === 'patrol') guard.state = 'suspicious';
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
    if (guard.state === 'chase') {
      guard.state = 'search';
      guard.searchTime = 0;
    }
  }

  // Loud footsteps nearby pull a patrolling guard over to listen.
  if (guard.state === 'patrol' && noiseRadius > 0 && distToPlayer < noiseRadius) {
    guard.state = 'suspicious';
    guard.lastSeen = { x: player.x, y: player.y };
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.pauseTime > 0) {
        guard.pauseTime -= dt;
        break;
      }
      const wp = guard.patrol[guard.waypoint];
      if (stepToward(guard, world, wp.x, wp.y, guard.speed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.patrol.length;
        guard.pauseTime = 0.9; // look around at each corner
      }
      break;
    }
    case 'suspicious': {
      if (guard.lastSeen && stepToward(guard, world, guard.lastSeen.x, guard.lastSeen.y, GUARD.searchSpeed, dt)) {
        guard.state = 'search';
        guard.searchTime = 0;
      }
      break;
    }
    case 'chase': {
      stepToward(guard, world, player.x, player.y, GUARD.chaseSpeed, dt);
      break;
    }
    case 'search': {
      guard.searchTime += dt;
      guard.facing += dt * 1.6; // scan the room
      if (guard.searchTime > 3.2) {
        guard.state = 'patrol';
        guard.suspicion = 0;
      }
      break;
    }
  }

  const caught = distToPlayer < GUARD.catchDistance;
  return { sees, caught };
}

// The most alarmed guard sets the screen's alert level: 0 calm, 1 seen,
// 2 chasing. The HUD and the music follow it.
export function alertLevel(guards) {
  let level = 0;
  for (const g of guards) {
    if (g.state === 'chase') return 2;
    if (g.state === 'suspicious' || g.suspicion > 0.25) level = 1;
  }
  return level;
}

// The shadow courier: keyboard movement, sneak, click-to-move and noise.
// Running is fast and loud; sneaking (Shift) is slow and almost silent.
// Standing in a bush makes the courier nearly invisible.

import { PLAYER } from './config.js';
import { moveCircle, inBush } from './world.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER.radius,
    facing: 0, // radians, direction the courier looks
    moving: false,
    sneaking: false,
    hidden: false, // standing in a bush
    target: null, // click-to-move destination, or null
    stepPhase: 0, // walk-cycle phase for the drawn stride
  };
}

// keys: {up,down,left,right,sneak} booleans from input.js.
// Returns the noise radius the courier makes this frame.
export function updatePlayer(player, world, keys, dt) {
  let mx = 0;
  let my = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) my -= 1;
  if (keys.down) my += 1;

  // Click-to-move: steer toward the clicked point when no key is held.
  if (mx === 0 && my === 0 && player.target) {
    const dx = player.target.x - player.x;
    const dy = player.target.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      player.target = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }

  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.sneaking = !!keys.sneak;
  if (player.moving) {
    const nx = mx / (len || 1);
    const ny = my / (len || 1);
    const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    player.facing = Math.atan2(ny, nx);
    moveCircle(world, player, nx * speed * dt, ny * speed * dt, player.radius);
    player.stepPhase += dt * (player.sneaking ? 6 : 11);
  }

  player.hidden = inBush(world, player.x, player.y);
  return player.moving
    ? player.sneaking
      ? PLAYER.noiseRadiusSneak
      : PLAYER.noiseRadiusWalk
    : 0;
}

// Distance from the courier to the nearest scroll not yet taken, or null.
export function nearestScrollDistance(player, scrolls) {
  let best = null;
  for (const s of scrolls) {
    if (s.taken) continue;
    const d = Math.hypot(s.x - player.x, s.y - player.y);
    if (best === null || d < best) best = d;
  }
  return best;
}

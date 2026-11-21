// The level map: tiles, collision, line of sight and hiding cover.
// Walls and crates block movement and sight; bushes hide the player but
// let everyone walk through them. Scrolls and the exit are pickups.

import { TILE } from './config.js';

export function buildWorld(level) {
  const rows = level.map;
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const grid = [];
  const scrolls = [];
  let playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 29.5, y: TILE * 9.5 };

  for (let y = 0; y < height; y++) {
    grid.push([]);
    for (let x = 0; x < width; x++) {
      const ch = rows[y][x] || '#';
      grid[y].push(ch);
      const cx = (x + 0.5) * TILE;
      const cy = (y + 0.5) * TILE;
      if (ch === 'P') playerStart = { x: cx, y: cy };
      if (ch === 'E') exit = { x: cx, y: cy };
      if (ch === 'S') scrolls.push({ x: cx, y: cy, taken: false, bob: 0 });
    }
  }
  return { grid, width, height, scrolls, playerStart, exit };
}

export function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.width || ty >= world.height) return '#';
  return world.grid[ty][tx];
}

export function isSolidTile(ch) {
  return ch === '#' || ch === 'C';
}

export function isBushTile(ch) {
  return ch === 'B';
}

// True when the tile at pixel (px, py) blocks movement.
export function solidAt(world, px, py) {
  return isSolidTile(tileAt(world, Math.floor(px / TILE), Math.floor(py / TILE)));
}

// Circle-vs-tiles collision: slide along walls instead of sticking.
export function moveCircle(world, pos, dx, dy, radius) {
  const next = { x: pos.x + dx, y: pos.y + dy };
  if (!hitsSolid(world, next.x, pos.y, radius)) pos.x = next.x;
  if (!hitsSolid(world, pos.x, next.y, radius)) pos.y = next.y;
  return pos;
}

function hitsSolid(world, x, y, radius) {
  return (
    solidAt(world, x - radius, y - radius) ||
    solidAt(world, x + radius, y - radius) ||
    solidAt(world, x - radius, y + radius) ||
    solidAt(world, x + radius, y + radius) ||
    solidAt(world, x, y - radius) ||
    solidAt(world, x, y + radius) ||
    solidAt(world, x - radius, y) ||
    solidAt(world, x + radius, y)
  );
}

// Line of sight between two points: stepped sampling, blocked by walls
// and crates. Bushes never block sight — they hide, they do not cover.
export function hasLineOfSight(world, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 4)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solidAt(world, ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}

// Is the player standing in a bush right now?
export function inBush(world, x, y) {
  return isBushTile(tileAt(world, Math.floor(x / TILE), Math.floor(y / TILE)));
}

// Is the player standing on the exit tile?
export function onExit(world, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return tileAt(world, tx, ty) === 'E';
}

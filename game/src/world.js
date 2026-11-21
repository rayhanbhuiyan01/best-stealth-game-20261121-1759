// Nightshade — Shadow Courier: the tile world. Parses a level's map strings,
// answers "can I stand here?", line of sight, and breadth-first paths for
// click-to-move. Rows shorter than the widest row are padded with walls.

import { TILE, COLS, ROWS } from './config.js';

export class World {
  constructor(levelDef) {
    this.levelDef = levelDef;
    const rows = levelDef.map;
    this.width = Math.max(COLS, ...rows.map((r) => r.length));
    this.height = Math.max(ROWS, rows.length);
    this.grid = [];
    this.scrolls = [];
    this.exit = null;
    this.playerStart = { x: TILE * 2 + TILE / 2, y: TILE * 2 + TILE / 2 };
    for (let ty = 0; ty < this.height; ty++) {
      const row = (rows[ty] ?? '').padEnd(this.width, '#');
      const cells = [];
      for (let tx = 0; tx < this.width; tx++) {
        const ch = row[tx] ?? '#';
        cells.push(ch);
        if (ch === 'P') {
          this.playerStart = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
          cells[tx] = '.';
        } else if (ch === 'S') {
          this.scrolls.push({ tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, taken: false });
          cells[tx] = '.';
        } else if (ch === 'E') {
          this.exit = { tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
          cells[tx] = '.';
        }
      }
      this.grid.push(cells);
    }
    this.scrollsTotal = this.scrolls.length;
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return '#';
    return this.grid[ty][tx];
  }

  isSolidTile(tx, ty) {
    const ch = this.tileAt(tx, ty);
    return ch === '#' || ch === 'C';
  }

  isBushTile(tx, ty) {
    return this.tileAt(tx, ty) === 'B';
  }

  isSolidAtPx(x, y) {
    return this.isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  isBushAtPx(x, y) {
    return this.isBushTile(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  // Can a circle of radius r stand centred at (x, y) without overlapping a
  // solid tile? Checks every tile the circle's bounding box touches.
  canStand(x, y, r) {
    const x0 = Math.floor((x - r) / TILE);
    const x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - r) / TILE);
    const y1 = Math.floor((y + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isSolidTile(tx, ty)) continue;
        const rx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
        const ry = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
        const dx = x - rx;
        const dy = y - ry;
        if (dx * dx + dy * dy < r * r) return false;
      }
    }
    return true;
  }

  // Straight-line sight between two pixel points, sampled every 6 pixels.
  // Walls and crates block sight; bushes do not.
  lineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 6));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.isSolidAtPx(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
  }

  // Nearest non-solid tile to (tx, ty), spiralling outward. Guards use it so
  // a waypoint that lands on a wall still gives a walkable patrol point.
  nearestFloor(tx, ty) {
    for (let radius = 0; radius <= 6; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          if (!this.isSolidTile(tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
        }
      }
    }
    return { tx, ty };
  }

  tileCenter(tx, ty) {
    return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
  }

  // Breadth-first path over walkable tiles, returned as pixel waypoints
  // (tile centres). Null when the target tile cannot be reached.
  findPath(fromX, fromY, toX, toY) {
    const sx = Math.floor(fromX / TILE);
    const sy = Math.floor(fromY / TILE);
    const tx = Math.floor(toX / TILE);
    const ty = Math.floor(toY / TILE);
    if (this.isSolidTile(tx, ty) || this.isSolidTile(sx, sy)) return null;
    const key = (x, y) => y * this.width + x;
    const prev = new Map();
    const queue = [[sx, sy]];
    prev.set(key(sx, sy), null);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      if (cx === tx && cy === ty) break;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (this.isSolidTile(nx, ny)) continue;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        prev.set(k, [cx, cy]);
        queue.push([nx, ny]);
      }
    }
    if (!prev.has(key(tx, ty))) return null;
    const points = [];
    let cur = [tx, ty];
    while (cur !== null) {
      points.push(this.tileCenter(cur[0], cur[1]));
      cur = prev.get(key(cur[0], cur[1]));
    }
    points.reverse();
    return points;
  }

  scrollsLeft() {
    return this.scrolls.filter((s) => !s.taken).length;
  }

  resetScrolls() {
    for (const s of this.scrolls) s.taken = false;
  }
}

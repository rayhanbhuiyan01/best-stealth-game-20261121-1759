// Nightshade — Shadow Courier: every pixel the game draws. The world is a
// night-blue tile map lit by lantern cones; the courier is a hooded figure,
// guards are lantern-bearers with a "?" when suspicious and a "!" in chase.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H } from './config.js';

const FLOOR_A = '#1b2233';
const FLOOR_B = '#1d2536';
const WALL = '#0d1120';
const WALL_TOP = '#2c3550';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, game) {
  const { world } = game;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = world.tileAt(tx, ty);
      const px = tx * TILE;
      const py = ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = WALL;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(px, py, TILE, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px + 3, py + 6, TILE - 6, 2);
      } else {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(px, py, TILE, TILE);
        if (ch === 'B') drawBush(ctx, px, py);
        if (ch === 'C') drawCrate(ctx, px, py);
      }
    }
  }
}

function drawBush(ctx, px, py) {
  ctx.fillStyle = '#14301f';
  ctx.beginPath();
  ctx.arc(px + 12, py + 14, 11, 0, Math.PI * 2);
  ctx.arc(px + 26, py + 12, 12, 0, Math.PI * 2);
  ctx.arc(px + 19, py + 26, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e4d2c';
  ctx.beginPath();
  ctx.arc(px + 13, py + 13, 6, 0, Math.PI * 2);
  ctx.arc(px + 26, py + 13, 6, 0, Math.PI * 2);
  ctx.arc(px + 19, py + 25, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrate(ctx, px, py) {
  ctx.fillStyle = '#5a3d1e';
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
  ctx.strokeStyle = '#7d5a2e';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 4);
  ctx.lineTo(px + TILE - 4, py + TILE - 4);
  ctx.moveTo(px + TILE - 4, py + 4);
  ctx.lineTo(px + 4, py + TILE - 4);
  ctx.stroke();
}

function drawScroll(ctx, s, time) {
  const bob = Math.sin(time * 3 + s.tx) * 2;
  const glow = 0.5 + Math.sin(time * 4) * 0.2;
  ctx.save();
  ctx.shadowColor = `rgba(255, 214, 120, ${glow})`;
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#f2d8a0';
  roundedRect(ctx, s.x - 9, s.y - 12 + bob, 18, 24, 4);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#8a6b2f';
  ctx.fillRect(s.x - 11, s.y - 13 + bob, 22, 4);
  ctx.fillRect(s.x - 11, s.y + 9 + bob, 22, 4);
  ctx.strokeStyle = '#6b4d1f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.x - 5, s.y - 4 + bob);
  ctx.lineTo(s.x + 5, s.y - 4 + bob);
  ctx.moveTo(s.x - 5, s.y + 1 + bob);
  ctx.lineTo(s.x + 5, s.y + 1 + bob);
  ctx.stroke();
}

function drawExit(ctx, world, time) {
  const e = world.exit;
  if (!e) return;
  const open = world.scrollsLeft() === 0;
  ctx.save();
  if (open) {
    ctx.shadowColor = 'rgba(90, 255, 150, 0.9)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#123524';
  } else {
    ctx.fillStyle = '#2a1218';
  }
  roundedRect(ctx, e.x - 17, e.y - 19, 34, 38, 5);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = open ? '#5aff96' : '#8a2f3d';
  ctx.lineWidth = 3;
  roundedRect(ctx, e.x - 17, e.y - 19, 34, 38, 5);
  ctx.stroke();
  if (open) {
    ctx.fillStyle = '#5aff96';
    ctx.beginPath();
    ctx.moveTo(e.x - 7, e.y + 2);
    ctx.lineTo(e.x, e.y + 9);
    ctx.lineTo(e.x + 8, e.y - 7);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5aff96';
    ctx.stroke();
  } else {
    ctx.fillStyle = '#c94b5e';
    ctx.beginPath();
    ctx.arc(e.x, e.y - 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1218';
    ctx.fillRect(e.x - 2, e.y - 2, 4, 7);
    ctx.fillStyle = '#ffb3bd';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', e.x, e.y + 30);
  }
}

function coneColor(guard) {
  if (guard.state === 'chase') return 'rgba(255, 60, 60, 0.30)';
  if (guard.state === 'suspicious' || guard.state === 'search') return 'rgba(255, 165, 40, 0.26)';
  return 'rgba(255, 214, 110, 0.20)';
}

export function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const poly = g.cone.length > 1 ? g.cone : null;
    if (poly) {
      ctx.fillStyle = coneColor(g);
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.fill();
    }
    // Lantern glow around the guard.
    const glow = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, 46);
    glow.addColorStop(0, 'rgba(255, 200, 90, 0.35)');
    glow.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 46, 0, Math.PI * 2);
    ctx.fill();
    // Body: dark guard with a brass helmet and a lantern in front.
    ctx.fillStyle = '#3a2f55';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(g.x, g.y - 3, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 16, g.y + Math.sin(g.angle) * 16, 4, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion meter arc above the guard.
    if (g.suspicion > 0.05 && g.state !== 'chase') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y - 22, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
    }
    if (g.state === 'suspicious' || g.state === 'search') {
      ctx.fillStyle = '#ffb020';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 26);
    }
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 26);
    }
  }
}

export function drawPlayer(ctx, game) {
  const p = game.player;
  if (game.invulnerable > 0 && Math.floor(game.time * 12) % 2 === 0) return; // blink
  // Noise ring while running.
  if (p.noiseRadius() > 4) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * p.noisePulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.noiseRadius(), 0, Math.PI * 2);
    ctx.stroke();
  }
  // Click-to-move path dots.
  if (p.path) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = p.pathIndex; i < p.path.length; i++) {
      ctx.beginPath();
      ctx.arc(p.path[i].x, p.path[i].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Hooded courier: teal cloak, hood, satchel strap.
  const crouch = p.sneaking ? 0.85 : 1;
  ctx.fillStyle = '#0f5b52';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 13, 13 * crouch, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a3d38';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8d8a8';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 7, p.y + Math.sin(p.facing) * 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9b96a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - 8, p.y + 6);
  ctx.lineTo(p.x + 8, p.y - 6);
  ctx.stroke();
  if (p.hiddenInBush(game.world)) {
    ctx.strokeStyle = 'rgba(120, 255, 150, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7dff9a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 22);
  }
}

export function drawParticles(ctx, game) {
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawHUD(ctx, game) {
  const level = game.levelDef;
  ctx.fillStyle = 'rgba(6, 8, 16, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 44);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 14, 28);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#9fb0d0';
  const taken = game.world.scrollsTotal - game.world.scrollsLeft();
  ctx.fillText(`Scrolls ${taken}/${game.world.scrollsTotal}`, 330, 28);
  ctx.fillStyle = '#ff6b81';
  let hearts = '';
  for (let i = 0; i < game.lives; i++) hearts += '♥ ';
  ctx.fillText(hearts || '—', 470, 28);
  ctx.fillStyle = '#ffd66e';
  ctx.fillText(`Score ${game.score}`, 590, 28);
  ctx.fillStyle = '#9fb0d0';
  ctx.fillText(`Time ${formatTime(game.levelTime)}`, 730, 28);
  const alert = game.alertState();
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  if (alert === 'SPOTTED') {
    ctx.fillStyle = '#ff4d4d';
    ctx.fillText('● SPOTTED — RUN!', VIEW_W - 16, 28);
  } else if (alert === 'SUSPICIOUS') {
    ctx.fillStyle = '#ffb020';
    ctx.fillText('● SUSPICIOUS', VIEW_W - 16, 28);
  } else {
    ctx.fillStyle = '#7dff9a';
    ctx.fillText('● UNSEEN', VIEW_W - 16, 28);
  }
  ctx.textAlign = 'left';
  // Controls reminder along the bottom edge.
  ctx.fillStyle = 'rgba(6, 8, 16, 0.7)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#8b98b5';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD / arrows move · Shift sneak · Click a tile to walk there · P pause · R restart · M mute', 14, VIEW_H - 8);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 6, 14, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centreText(ctx, lines) {
  let y = 250;
  for (const line of lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.textAlign = 'center';
    ctx.fillText(line.text, VIEW_W / 2, y);
    y += line.gap;
  }
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, game) {
  overlay(ctx, 0.55);
  centreText(ctx, [
    { text: 'NIGHTSHADE', font: 'bold 84px Georgia, serif', color: '#e8ecf5', gap: 96 },
    { text: '— Shadow Courier —', font: 'italic 30px Georgia, serif', color: '#ffd66e', gap: 52 },
    { text: 'Sneak through guarded halls. Take every scroll. Reach the door unseen.', font: '19px sans-serif', color: '#c6d0e4', gap: 40 },
    { text: 'WASD or arrows to move · Shift to sneak · Click a tile to walk there', font: '16px sans-serif', color: '#9fb0d0', gap: 34 },
    { text: 'Bushes hide you · Crates block sight · Running makes noise', font: '16px sans-serif', color: '#9fb0d0', gap: 60 },
    { text: 'Press Enter to begin', font: 'bold 24px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawIntro(ctx, game) {
  overlay(ctx, 0.6);
  centreText(ctx, [
    { text: game.levelDef.name, font: 'bold 52px Georgia, serif', color: '#e8ecf5', gap: 66 },
    { text: game.levelDef.sub, font: '19px sans-serif', color: '#c6d0e4', gap: 46 },
    { text: `Collect all ${game.world.scrollsTotal} scrolls, then slip out the exit door.`, font: '18px sans-serif', color: '#ffd66e', gap: 40 },
    { text: `Guards on patrol: ${game.guards.length} · Lives: ${game.lives}`, font: '16px sans-serif', color: '#9fb0d0', gap: 60 },
    { text: 'Press Enter to sneak in', font: 'bold 22px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawPaused(ctx) {
  overlay(ctx, 0.65);
  centreText(ctx, [
    { text: 'PAUSED', font: 'bold 56px Georgia, serif', color: '#e8ecf5', gap: 70 },
    { text: 'Press P to keep sneaking', font: '19px sans-serif', color: '#c6d0e4', gap: 40 },
  ]);
}

export function drawLevelClear(ctx, game) {
  overlay(ctx, 0.6);
  centreText(ctx, [
    { text: 'LEVEL CLEAR', font: 'bold 60px Georgia, serif', color: '#7dff9a', gap: 76 },
    { text: game.levelDef.name, font: '26px Georgia, serif', color: '#e8ecf5', gap: 44 },
    { text: `Scrolls ${game.world.scrollsTotal}/${game.world.scrollsTotal}  ·  Time bonus +${game.lastTimeBonus}  ·  Ghost bonus ${game.lastGhostBonus > 0 ? `+${game.lastGhostBonus}` : '—'}`, font: '18px sans-serif', color: '#ffd66e', gap: 40 },
    { text: `Score ${game.score}`, font: 'bold 24px sans-serif', color: '#e8ecf5', gap: 60 },
    { text: game.levelIndex + 1 < 3 ? 'Press Enter for the next level' : 'Press Enter to see your haul', font: 'bold 22px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawCaught(ctx, game) {
  overlay(ctx, 0.55);
  centreText(ctx, [
    { text: 'CAUGHT!', font: 'bold 64px Georgia, serif', color: '#ff4d4d', gap: 80 },
    { text: 'A lantern found the courier.', font: '20px sans-serif', color: '#c6d0e4', gap: 46 },
    { text: game.lives > 0 ? `Lives left: ${game.lives}` : 'No lives left.', font: '18px sans-serif', color: '#ffd66e', gap: 56 },
    { text: game.lives > 0 ? 'Press Enter to try again' : 'Press Enter to see the end', font: 'bold 22px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawWin(ctx, game) {
  overlay(ctx, 0.6);
  centreText(ctx, [
    { text: 'THE VAULT IS YOURS', font: 'bold 54px Georgia, serif', color: '#ffd66e', gap: 70 },
    { text: 'Every scroll delivered. No alarm that mattered.', font: '20px sans-serif', color: '#c6d0e4', gap: 46 },
    { text: `Final score ${game.score}  ·  Total time ${formatTime(game.totalTime)}`, font: 'bold 22px sans-serif', color: '#e8ecf5', gap: 44 },
    { text: `Ghost levels: ${game.ghostLevels}/3`, font: '18px sans-serif', color: '#7dff9a', gap: 60 },
    { text: 'Press Enter to play again', font: 'bold 22px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawGameOver(ctx, game) {
  overlay(ctx, 0.65);
  centreText(ctx, [
    { text: 'THE NIGHT CLOSES IN', font: 'bold 52px Georgia, serif', color: '#ff4d4d', gap: 70 },
    { text: 'The courier was caught one time too many.', font: '20px sans-serif', color: '#c6d0e4', gap: 46 },
    { text: `Score ${game.score}`, font: 'bold 22px sans-serif', color: '#e8ecf5', gap: 60 },
    { text: 'Press Enter to try from the first level', font: 'bold 22px sans-serif', color: '#7dff9a', gap: 40 },
  ]);
}

export function drawFrame(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawWorld(ctx, game);
  for (const s of game.world.scrolls) {
    if (!s.taken) drawScroll(ctx, s, game.time);
  }
  drawExit(ctx, game.world, game.time);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
  drawParticles(ctx, game);
  drawHUD(ctx, game);
  if (game.phase === 'title') drawTitle(ctx, game);
  else if (game.phase === 'intro') drawIntro(ctx, game);
  else if (game.phase === 'paused') drawPaused(ctx);
  else if (game.phase === 'levelclear') drawLevelClear(ctx, game);
  else if (game.phase === 'caught') drawCaught(ctx, game);
  else if (game.phase === 'win') drawWin(ctx, game);
  else if (game.phase === 'gameover') drawGameOver(ctx, game);
}

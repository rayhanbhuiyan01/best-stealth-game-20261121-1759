// All drawing for Nightshade: the level, the vision cones, the courier,
// the guards, the HUD and every screen. Everything is drawn in code on a
// 2D canvas — no images, no fonts loaded from the network.

import { TILE, VIEW_W, VIEW_H, GUARD } from './config.js';
import { tileAt, isSolidTile } from './world.js';

// Cast one ray from (x, y) along angle until it hits a wall or maxDist.
function rayDistance(world, x, y, angle, maxDist) {
  const step = 8;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let d = 0;
  while (d < maxDist) {
    const px = x + dx * (d / step);
    const py = y + dy * (d / step);
    if (isSolidTile(tileAt(world, Math.floor(px / TILE), Math.floor(py / TILE)))) return d;
    d += step;
  }
  return maxDist;
}

// The guard's vision cone, clipped by walls ray by ray so it hugs cover.
function drawVisionCone(ctx, world, guard) {
  const rays = 26;
  const half = GUARD.viewAngle;
  const color =
    guard.state === 'chase' ? '255,70,70' : guard.state === 'suspicious' ? '255,150,60' : '255,205,80';
  const alpha = guard.state === 'chase' ? 0.34 : 0.22;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= rays; i++) {
    const a = guard.facing - half + (2 * half * i) / rays;
    const d = rayDistance(world, guard.x, guard.y, a, GUARD.viewDistance);
    ctx.lineTo(guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(${color},${alpha})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${color},0.5)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, world) {
  for (let ty = 0; ty < world.height; ty++) {
    for (let tx = 0; tx < world.width; tx++) {
      const ch = world.grid[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#232a3d';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2e3750';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(x, y + TILE - 6, TILE, 6);
      } else {
        const shade = (tx + ty) % 2 === 0 ? '#141a29' : '#121724';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, TILE, TILE);
      }
      if (ch === 'B') {
        // Bush: a dark green thicket the courier can hide inside.
        ctx.fillStyle = '#17351f';
        ctx.beginPath();
        ctx.arc(x + 12, y + 14, 11, 0, Math.PI * 2);
        ctx.arc(x + 28, y + 10, 12, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 28, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c5a34';
        ctx.beginPath();
        ctx.arc(x + 12, y + 14, 6, 0, Math.PI * 2);
        ctx.arc(x + 28, y + 10, 6, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 28, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (ch === 'C') {
        // Crate: wooden cover that blocks sight and movement.
        ctx.fillStyle = '#5a4126';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = '#7a5a35';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + TILE - 4, y + TILE - 4);
        ctx.moveTo(x + TILE - 4, y + 4);
        ctx.lineTo(x + 4, y + TILE - 4);
        ctx.stroke();
      }
    }
  }
}

function drawScroll(ctx, scroll, time) {
  if (scroll.taken) return;
  const bob = Math.sin(time * 3 + scroll.bob) * 3;
  const glow = 0.5 + 0.3 * Math.sin(time * 4 + scroll.bob);
  ctx.save();
  ctx.shadowColor = `rgba(255,220,120,${glow})`;
  ctx.shadowBlur = 18;
  ctx.translate(scroll.x, scroll.y + bob);
  ctx.rotate(0.5);
  ctx.fillStyle = '#f2e3b3';
  ctx.fillRect(-9, -12, 18, 24);
  ctx.strokeStyle = '#b3924e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-9, -12, 18, 24);
  ctx.strokeStyle = '#8a6d2f';
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(5, -5);
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.moveTo(-5, 5);
  ctx.lineTo(2, 5);
  ctx.stroke();
  ctx.restore();
}

function drawExit(ctx, world, open, time) {
  const { x, y } = world.exit;
  const pulse = 0.5 + 0.3 * Math.sin(time * 3);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#0c1f16';
  ctx.fillRect(-17, -19, 34, 38);
  ctx.strokeStyle = open ? `rgba(80,255,140,${0.6 + pulse * 0.4})` : '#5a6b62';
  ctx.lineWidth = 3;
  ctx.strokeRect(-17, -19, 34, 38);
  if (open) {
    ctx.shadowColor = 'rgba(80,255,140,0.9)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#39d67a';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2.5, 3, 5, 9);
  }
  ctx.restore();
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(guard.bobPhase) * 1.5;
  ctx.save();
  ctx.translate(guard.x, guard.y + bob);
  // Body: a lantern guard in a rust-red coat.
  ctx.fillStyle = guard.state === 'chase' ? '#a33327' : '#7d3b2e';
  ctx.beginPath();
  ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8c97a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Helmet brim and the direction they face.
  ctx.fillStyle = '#3a2a1c';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.facing) * 6, Math.sin(guard.facing) * 6, 6, 0, Math.PI * 2);
  ctx.fill();
  // The lantern: a warm glow swinging ahead of them.
  const lx = Math.cos(guard.facing) * 20;
  const ly = Math.sin(guard.facing) * 20;
  ctx.shadowColor = 'rgba(255,190,90,0.9)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Suspicion arc over the guard's head.
  if (guard.suspicion > 0.05 && guard.state !== 'chase') {
    ctx.save();
    ctx.translate(guard.x, guard.y - 26);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-16, -5, 32, 8);
    ctx.fillStyle = guard.suspicion > 0.6 ? '#ff7a3c' : '#ffd34d';
    ctx.fillRect(-15, -4, 30 * guard.suspicion, 6);
    ctx.restore();
  }
  if (guard.state === 'chase') {
    ctx.save();
    ctx.fillStyle = '#ff5a4d';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 24);
    ctx.restore();
  }
}

function drawPlayer(ctx, player, time) {
  const stride = player.moving ? Math.sin(player.stepPhase) * 4 : 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  // Cloak shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded courier: deep violet cloak, pale face, dark hood.
  ctx.fillStyle = player.hidden ? '#3d6b4a' : '#5b4a8a';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b8ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241a3a';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 4, Math.sin(player.facing) * 4, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9c9';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 7, Math.sin(player.facing) * 7, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // Feet mid-stride.
  ctx.fillStyle = '#241a3a';
  ctx.beginPath();
  ctx.arc(-6, 10 + stride * 0.4, 3, 0, Math.PI * 2);
  ctx.arc(6, 10 - stride * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.hidden) {
    ctx.save();
    ctx.fillStyle = '#9fe8b0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 22);
    ctx.restore();
  }
}

function drawNoiseRing(ctx, player, noiseRadius) {
  if (!noiseRadius) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawHUD(ctx, state) {
  const { level, scrollsGot, scrollsTotal, lives, score, time, alert } = state;
  ctx.save();
  ctx.fillStyle = 'rgba(5,8,16,0.78)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 16, 29);
  ctx.font = '16px sans-serif';
  ctx.fillText(`Scrolls ${scrollsGot}/${scrollsTotal}`, 330, 29);
  ctx.fillText(`Lives ${'●'.repeat(lives)}${'○'.repeat(Math.max(0, 3 - lives))}`, 480, 29);
  ctx.fillText(`Score ${score}`, 640, 29);
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  ctx.fillText(`Time ${mins}:${String(secs).padStart(2, '0')}`, 780, 29);
  // Alert meter on the right.
  const label = alert === 2 ? 'SPOTTED!' : alert === 1 ? 'SUSPICIOUS' : 'UNSEEN';
  const color = alert === 2 ? '#ff5a4d' : alert === 1 ? '#ffb03c' : '#39d67a';
  ctx.fillStyle = color;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(label, VIEW_W - 16, 29);
  ctx.restore();
}

function overlayPanel(ctx, title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 300);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 350 + i * 32);
  });
  ctx.fillStyle = '#9aa5bd';
  ctx.font = '17px sans-serif';
  ctx.fillText('Press Enter to continue', VIEW_W / 2, 350 + lines.length * 32 + 30);
  ctx.restore();
}

export function render(ctx, game) {
  const { world, player, guards, time, phase, level, score, lives, levelTime } = game;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0d16';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawFloor(ctx, world);
  const scrollsTotal = world.scrolls.length;
  const scrollsGot = world.scrolls.filter((s) => s.taken).length;
  drawExit(ctx, world, scrollsGot === scrollsTotal, time);
  for (const s of world.scrolls) drawScroll(ctx, s, time);

  // Vision cones first, then the bodies that cast them.
  for (const g of guards) drawVisionCone(ctx, world, g);
  for (const g of guards) drawGuard(ctx, g, time);
  drawPlayer(ctx, player, time);
  drawNoiseRing(ctx, player, game.noiseRadius);

  // Red edge vignette while a guard chases the courier.
  const alert = game.alertLevel;
  if (alert === 2) {
    const grad = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
    );
    grad.addColorStop(0, 'rgba(255,40,40,0)');
    grad.addColorStop(1, 'rgba(255,40,40,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawHUD(ctx, {
    level,
    scrollsGot,
    scrollsTotal,
    lives,
    score,
    time: levelTime,
    alert,
  });

  if (phase === 'title') {
    overlayPanel(
      ctx,
      'NIGHTSHADE',
      [
        'Shadow Courier — a stealth game',
        'Sneak past the lantern guards, gather every scroll,',
        'then slip out the green door unseen.',
        'Move: WASD / arrows / click   Sneak: hold Shift',
        'Pause: P    Restart: R    Mute: M',
      ],
      '#c9b8ff',
    );
  } else if (phase === 'intro') {
    overlayPanel(ctx, level.name, [level.hint, `Par time ${level.par}s — beat it for a time bonus.`], '#ffd34d');
  } else if (phase === 'paused') {
    overlayPanel(ctx, 'PAUSED', ['Take a breath. The guards wait for no one.', 'P to resume · R to restart the level'], '#9aa5bd');
  } else if (phase === 'caught') {
    overlayPanel(
      ctx,
      'CAUGHT!',
      ['A lantern found you in the dark.', `Lives left: ${lives}`],
      '#ff5a4d',
    );
  } else if (phase === 'clear') {
    overlayPanel(
      ctx,
      'LEVEL CLEAR',
      [
        `All scrolls gathered — the courier vanishes into the night.`,
        `Level score ${game.levelScore} · Total ${score}`,
      ],
      '#39d67a',
    );
  } else if (phase === 'win') {
    overlayPanel(
      ctx,
      'THE VAULT IS YOURS',
      [
        'Every scroll stolen, every guard outwitted.',
        `Final score ${score} · Time ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`,
        game.ghostRun ? 'GHOST RUN — never spotted once. Flawless.' : 'Spotted along the way — try a ghost run next time.',
      ],
      '#ffd34d',
    );
  }
}

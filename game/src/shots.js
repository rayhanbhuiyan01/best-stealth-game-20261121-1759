// Nightshade — Shadow Courier: screenshot poses. ?shot= freezes a posed
// frame so the four dossier screenshots are real renders of the game:
//   start — the title screen
//   play  — mid-level, courier sneaking past a suspicious guard
//   alert — a chase in progress, SPOTTED in the HUD
//   end   — the level-clear screen with the exit open
// Poses use the same fixed seed as a fresh game, so they are deterministic.

import { TILE } from './config.js';

export function applyShot(game, name) {
  if (name === 'start') {
    game.phase = 'title';
    game.frozen = true;
    return;
  }
  if (name === 'play') {
    game.loadLevel(0);
    game.phase = 'playing';
    game.frozen = true;
    // Courier crouched in a bush, one scroll already taken.
    game.player.x = 7 * TILE + TILE / 2;
    game.player.y = 8 * TILE + TILE / 2;
    game.player.sneaking = true;
    game.player.facing = 0;
    game.world.scrolls[0].taken = true;
    game.score = 100;
    // First guard: suspicious, cone turned toward the courier.
    const g = game.guards[0];
    g.x = 10 * TILE + TILE / 2;
    g.y = 6 * TILE + TILE / 2;
    g.angle = Math.atan2(game.player.y - g.y, game.player.x - g.x);
    g.state = 'suspicious';
    g.suspicion = 0.62;
    g.stateTimer = 0.5;
    g.computeCone(game.world);
    // Second guard keeps patrolling far away.
    const g2 = game.guards[1];
    g2.x = 20 * TILE + TILE / 2;
    g2.y = 13 * TILE + TILE / 2;
    g2.angle = Math.PI;
    g2.computeCone(game.world);
    game.levelTime = 34;
    return;
  }
  if (name === 'alert') {
    game.loadLevel(1);
    game.phase = 'playing';
    game.frozen = true;
    // Courier caught in the open, guard in full chase right behind, with a
    // clear line of sight down an open corridor so the red cone reads.
    game.player.x = 5 * TILE + TILE / 2;
    game.player.y = 14 * TILE + TILE / 2;
    game.player.facing = -Math.PI / 2;
    game.world.scrolls[0].taken = true;
    game.score = 100;
    const g = game.guards[1];
    g.x = 5 * TILE + TILE / 2;
    g.y = 11 * TILE + TILE / 2;
    g.angle = Math.PI / 2;
    g.state = 'chase';
    g.suspicion = 1;
    g.lastSeen = { x: game.player.x, y: game.player.y };
    g.computeCone(game.world);
    const g2 = game.guards[0];
    g2.x = 5 * TILE + TILE / 2;
    g2.y = 5 * TILE + TILE / 2;
    g2.angle = 0;
    g2.state = 'suspicious';
    g2.suspicion = 0.5;
    g2.computeCone(game.world);
    game.spottedThisLevel = true;
    game.levelTime = 61;
    return;
  }
  if (name === 'end') {
    game.loadLevel(0);
    game.phase = 'levelclear';
    game.frozen = true;
    for (const s of game.world.scrolls) s.taken = true;
    game.player.x = game.world.exit.x - 80;
    game.player.y = game.world.exit.y;
    game.player.facing = 0;
    for (const g of game.guards) g.computeCone(game.world);
    game.score = 730; // 3 scrolls (300) + time bonus 180 + ghost bonus 250
    game.lastTimeBonus = 180;
    game.lastGhostBonus = 250;
    game.levelTime = 58;
    return;
  }
  // Unknown shot name: fall back to the title screen.
  game.phase = 'title';
  game.frozen = true;
}

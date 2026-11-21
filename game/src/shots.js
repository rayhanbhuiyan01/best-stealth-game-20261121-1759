// Deterministic screenshot states for Nightshade.
// The page reads ?shot=start|play|alert|end&seed=N and poses the game so
// a screenshot shows the real game at its best: the title over the level,
// a tense sneak past a vision cone, a full chase, and the level-clear
// screen. Positions are fixed, so the same URL always renders the same
// frame (the seed only nudges the decorative fireflies).

import { TILE } from './config.js';

function placeGuard(game, index, tx, ty, facing, state, suspicion) {
  const g = game.guards[index];
  if (!g) return;
  g.x = (tx + 0.5) * TILE;
  g.y = (ty + 0.5) * TILE;
  g.facing = facing;
  g.state = state;
  g.suspicion = suspicion;
  g.lastSeen = { x: game.player.x, y: game.player.y };
}

function placePlayer(game, tx, ty, facing) {
  game.player.x = (tx + 0.5) * TILE;
  game.player.y = (ty + 0.5) * TILE;
  game.player.facing = facing;
  game.player.target = null;
}

export function applyShot(game, shot, seed) {
  // Start from level 1 in its opening pose for every shot.
  game.loadLevel(0);
  game.time = 12.5 + (seed % 5);
  game.levelTime = 34;
  game.score = 150;

  if (shot === 'start') {
    game.phase = 'title';
    placeGuard(game, 0, 16, 5, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 1, 11, 13, 0, 'patrol', 0);
    placePlayer(game, 1, 1, 0);
    return;
  }

  if (shot === 'play') {
    game.phase = 'play';
    // One scroll already pocketed; the courier crouches behind a crate
    // while a guard's cone sweeps past, a second guard closing in.
    game.world.scrolls[0].taken = true;
    game.score = 150;
    placePlayer(game, 4, 3, Math.PI / 2);
    placeGuard(game, 0, 13, 5, Math.PI, 'patrol', 0);
    placeGuard(game, 1, 8, 13, -Math.PI / 2, 'suspicious', 0.55);
    game.alertLevel = 1; // frozen frame: the HUD reads the posed alert
    game.guards[1].lastSeen = { x: (4 + 0.5) * TILE, y: (3 + 0.5) * TILE };
    return;
  }

  if (shot === 'alert') {
    game.phase = 'play';
    game.world.scrolls[0].taken = true;
    game.world.scrolls[1].taken = true;
    game.score = 300;
    // Full chase: the guard runs at the courier, cone burning red.
    placePlayer(game, 6, 8, Math.PI);
    placeGuard(game, 0, 10, 8, Math.PI, 'chase', 1);
    placeGuard(game, 1, 14, 12, -Math.PI / 2, 'suspicious', 0.7);
    game.alertLevel = 2; // frozen frame: the HUD reads SPOTTED!
    return;
  }

  if (shot === 'end') {
    game.phase = 'clear';
    for (const s of game.world.scrolls) s.taken = true;
    game.score = 950;
    game.levelScore = 800;
    placePlayer(game, 28, 9, 0);
    placeGuard(game, 0, 16, 5, Math.PI / 2, 'patrol', 0);
    placeGuard(game, 1, 11, 13, 0, 'patrol', 0);
    return;
  }

  // Unknown shot name: leave the title screen up.
  game.phase = 'title';
}

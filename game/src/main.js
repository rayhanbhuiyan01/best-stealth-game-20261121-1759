// Nightshade — Shadow Courier: the game loop and state machine.
// Phases: title -> intro -> play <-> paused -> caught -> clear -> win.
// The courier gathers every scroll on a level, then reaches the green
// exit door unseen. Guards patrol with vision cones; being seen fills
// suspicion, a full meter starts a chase, and a caught courier loses a
// life. Finishing a level without ever being chased earns a ghost bonus.

import { LEVELS, SCORE, VIEW_W, VIEW_H } from './config.js';
import { buildWorld, onExit } from './world.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeGuard, updateGuard, alertLevel } from './guards.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = makeInput(canvas);
const audio = makeAudio();

const game = {
  world: null,
  player: null,
  guards: [],
  level: LEVELS[0],
  levelIndex: 0,
  phase: 'title',
  score: 0,
  levelScore: 0,
  lives: 3,
  time: 0, // total run time, drives ambient animation
  levelTime: 0,
  noiseRadius: 0,
  alertLevel: 0,
  levelSeen: false, // was the courier chased on this level?
  ghostRun: true, // never chased on any level so far?
  prevSees: false, // was any guard seeing the courier last frame?
  frozen: false, // screenshot mode: render one fixed frame
  loadLevel,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.world = buildWorld(game.level);
  game.player = makePlayer(game.world.playerStart);
  game.guards = game.level.guards.map((def, i) => makeGuard(def, i));
  game.levelTime = 0;
  game.levelScore = 0;
  game.levelSeen = false;
  game.noiseRadius = 0;
  game.alertLevel = 0;
  audio.stopAlarm();
}

function startRun() {
  game.score = 0;
  game.lives = 3;
  game.time = 0;
  game.ghostRun = true;
  loadLevel(0);
  game.phase = 'intro';
  announce('Level 1: The Rooftop Archive. Gather the scrolls, reach the exit unseen.');
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function update(dt) {
  game.time += dt;
  if (game.phase !== 'play') return;
  game.levelTime += dt;

  const click = input.takeClick();
  if (click) game.player.target = { x: click.x, y: click.y };

  game.noiseRadius = updatePlayer(game.player, game.world, input.keys, dt);

  let anySees = false;
  let caught = false;
  for (const guard of game.guards) {
    const result = updateGuard(guard, game.player, game.world, game.noiseRadius, dt);
    if (result.sees) anySees = true;
    if (result.caught) caught = true;
    if (guard.state === 'chase') {
      game.levelSeen = true;
      game.ghostRun = false;
    }
  }
  game.alertLevel = alertLevel(game.guards);
  if (game.alertLevel === 2) audio.startAlarm();
  else audio.stopAlarm();
  // The spotted sting is an edge trigger: play it once when a guard first
  // sees the courier, not sixty times a second while they keep watching.
  if (anySees && !game.prevSees && game.alertLevel === 1) audio.spotted();
  game.prevSees = anySees;

  // Pick up scrolls by walking over them.
  for (const scroll of game.world.scrolls) {
    if (!scroll.taken && Math.hypot(scroll.x - game.player.x, scroll.y - game.player.y) < 26) {
      scroll.taken = true;
      game.score += SCORE.scroll;
      audio.pickup();
      announce(`Scroll found. ${game.world.scrolls.filter((s) => s.taken).length} of ${game.world.scrolls.length}.`);
    }
  }

  // The exit opens once every scroll is gathered.
  const allGot = game.world.scrolls.every((s) => s.taken);
  if (allGot && onExit(game.world, game.player.x, game.player.y)) {
    const timeBonus = Math.max(0, Math.round(game.level.par - game.levelTime)) * SCORE.timeBonusPerSecond;
    const ghostBonus = game.levelSeen ? 0 : SCORE.ghostBonus;
    game.levelScore = SCORE.levelClear + timeBonus + ghostBonus;
    game.score += game.levelScore;
    audio.clear();
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.phase = 'win';
      announce(`You win. Final score ${game.score}.`);
    } else {
      game.phase = 'clear';
      announce(`Level clear. Score ${game.score}.`);
    }
    return;
  }

  if (caught) {
    game.lives -= 1;
    audio.caught();
    audio.stopAlarm();
    game.phase = 'caught';
    announce(game.lives > 0 ? `Caught! ${game.lives} lives left.` : 'Caught! No lives left.');
  }
}

function handleKeys() {
  if (input.isMuted()) audio.setMuted(true);
  // Read each edge-triggered key once: wasPressed consumes the press.
  const pausePressed = input.wasPressed('KeyP');
  if (pausePressed && game.phase === 'play') {
    game.phase = 'paused';
    audio.stopAlarm();
  } else if (pausePressed && game.phase === 'paused') {
    game.phase = 'play';
  }
  if (input.wasPressed('KeyR') && (game.phase === 'play' || game.phase === 'paused' || game.phase === 'caught')) {
    loadLevel(game.levelIndex);
    game.phase = 'play';
  }
  if (input.wasPressed('Enter')) {
    audio.unlock();
    if (game.phase === 'title') startRun();
    else if (game.phase === 'intro') game.phase = 'play';
    else if (game.phase === 'caught') {
      if (game.lives > 0) {
        loadLevel(game.levelIndex);
        game.phase = 'play';
      } else {
        startRun();
      }
    } else if (game.phase === 'clear') {
      loadLevel(game.levelIndex + 1);
      game.phase = 'intro';
    } else if (game.phase === 'win') {
      startRun();
    }
  }
  if (input.wasPressed('Space') && game.phase === 'title') {
    audio.unlock();
    startRun();
  }
}

// Screenshot mode: ?shot=start|play|alert|end&seed=N poses one fixed frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
loadLevel(0);
if (shot) {
  const seed = Number(params.get('seed') || '1');
  applyShot(game, shot, seed);
  game.frozen = true;
  render(ctx, game);
  window.__nightshade = game;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    handleKeys();
    audio.setMuted(input.isMuted());
    update(dt);
    render(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__nightshade = game;
}

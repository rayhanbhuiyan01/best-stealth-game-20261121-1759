// Nightshade — Shadow Courier: the game itself. Owns the phases (title,
// intro, playing, paused, level-clear, caught, win, game over), the score
// and lives, and the frame loop. Playtest hook: window.__nightshade.

import { LEVELS, MAX_LIVES, SCROLL_POINTS, GHOST_BONUS, VIEW_W, VIEW_H } from './config.js';
import { World } from './world.js';
import { Courier } from './player.js';
import { Guard } from './guards.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { makeRng } from './random.js';
import { drawFrame } from './render.js';
import { applyShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.input.attach(canvas);
    this.sound = new SoundBank();
    this.phase = 'title';
    this.levelIndex = 0;
    this.levelDef = LEVELS[0];
    this.world = new World(LEVELS[0]);
    this.player = new Courier(this.world);
    this.guards = [];
    this.rng = makeRng(20261121);
    this.lives = MAX_LIVES;
    this.score = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.time = 0; // wall-clock-ish animation time, always advances
    this.spottedThisLevel = false;
    this.ghostLevels = 0;
    this.lastTimeBonus = 0;
    this.lastGhostBonus = 0;
    this.invulnerable = 0;
    this.particles = [];
    this.frozen = false;
    this.lastTs = 0;
    this.loadLevel(0);
    this.phase = 'title';
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.levelDef = LEVELS[index];
    this.world = new World(this.levelDef);
    this.player = new Courier(this.world);
    this.rng = makeRng(20261121 + index * 7919);
    this.guards = this.levelDef.guards.map((def, i) => new Guard(this.world, def, this.rng, i));
    for (const g of this.guards) g.computeCone(this.world);
    this.levelTime = 0;
    this.spottedThisLevel = false;
    this.invulnerable = 0;
    this.particles = [];
    this.lastTimeBonus = 0;
    this.lastGhostBonus = 0;
  }

  alertState() {
    if (this.guards.some((g) => g.state === 'chase')) return 'SPOTTED';
    if (this.guards.some((g) => g.state === 'suspicious' || g.state === 'search')) return 'SUSPICIOUS';
    return 'UNSEEN';
  }

  startRun() {
    this.lives = MAX_LIVES;
    this.score = 0;
    this.totalTime = 0;
    this.ghostLevels = 0;
    this.loadLevel(0);
    this.phase = 'intro';
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.6,
        maxLife: 0.6,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  updateParticles(dt) {
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
  }

  onCaught() {
    this.lives -= 1;
    this.sound.caught();
    this.phase = 'caught';
    if (this.lives <= 0) this.phase = 'caught';
  }

  onLevelClear() {
    const timeBonus = Math.max(0, Math.round((this.levelDef.par - this.levelTime) * 5));
    const ghostBonus = this.spottedThisLevel ? 0 : GHOST_BONUS;
    this.lastTimeBonus = timeBonus;
    this.lastGhostBonus = ghostBonus;
    this.score += timeBonus + ghostBonus;
    if (!this.spottedThisLevel) this.ghostLevels += 1;
    this.totalTime += this.levelTime;
    this.sound.levelClear();
    this.phase = 'levelclear';
  }

  advanceAfterClear() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.sound.win();
      this.phase = 'win';
    } else {
      this.loadLevel(this.levelIndex + 1);
      this.phase = 'intro';
    }
  }

  update(dt) {
    this.time += dt;
    this.updateParticles(dt);
    if (this.phase === 'playing') {
      this.levelTime += dt;
      if (this.invulnerable > 0) this.invulnerable -= dt;

      if (this.input.wasPressed('KeyR')) {
        this.loadLevel(this.levelIndex);
        return;
      }
      const click = this.input.takeClick();
      if (click) this.player.setClickPath(this.world, click.x, click.y);

      this.player.update(dt, this.input, this.world);
      if (this.player.stepped) this.sound.footstep(this.player.sneaking);
      if (this.player.noise > 0) {
        for (const g of this.guards) g.hearNoise(this.player.x, this.player.y);
      }

      const scroll = this.player.scrollAtFeet(this.world);
      if (scroll) {
        scroll.taken = true;
        this.score += SCROLL_POINTS;
        this.sound.pickup();
        this.burst(scroll.x, scroll.y, '#ffd66e', 14);
      }

      let caught = false;
      for (const g of this.guards) {
        const events = g.update(dt, this.player, this.world);
        if (events.includes('spotted')) {
          this.spottedThisLevel = true;
          this.sound.alert();
        }
        if (events.includes('caught') && this.invulnerable <= 0) caught = true;
      }
      if (caught) {
        this.onCaught();
        return;
      }

      if (this.world.scrollsLeft() === 0 && this.player.atExit(this.world)) {
        this.onLevelClear();
      }
    }
  }

  handlePhaseKeys() {
    const enter = this.input.anyWasPressed(['Enter', 'NumpadEnter', 'Space']);
    if (this.phase === 'title' && enter) {
      this.sound.uiClick();
      this.startRun();
    } else if (this.phase === 'intro' && enter) {
      this.sound.uiClick();
      this.phase = 'playing';
    } else if (this.phase === 'paused' && this.input.wasPressed('KeyP')) {
      this.phase = 'playing';
    } else if (this.phase === 'playing' && this.input.wasPressed('KeyP')) {
      this.phase = 'paused';
    } else if (this.phase === 'levelclear' && enter) {
      this.sound.uiClick();
      this.advanceAfterClear();
    } else if (this.phase === 'caught' && enter) {
      this.sound.uiClick();
      if (this.lives > 0) {
        this.loadLevel(this.levelIndex);
        this.invulnerable = 1.5;
        this.phase = 'playing';
      } else {
        this.phase = 'gameover';
      }
    } else if (this.phase === 'win' && enter) {
      this.sound.uiClick();
      this.startRun();
    } else if (this.phase === 'gameover' && enter) {
      this.sound.uiClick();
      this.startRun();
    }
    if (this.input.wasPressed('KeyM')) {
      this.sound.setMuted(!this.sound.muted);
    }
  }

  frame(ts) {
    const dt = Math.min(0.05, Math.max(0, (ts - this.lastTs) / 1000 || 0));
    this.lastTs = ts;
    if (!this.frozen) {
      this.handlePhaseKeys();
      if (this.phase !== 'paused') this.update(dt);
      else this.time += dt;
    } else {
      this.time += dt;
    }
    drawFrame(this.ctx, this);
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      applyShot(this, shot);
    }
    requestAnimationFrame((t) => this.frame(t));
  }
}

function boot() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const game = new Game(canvas);
  window.__nightshade = game;
  game.start();
}

boot();

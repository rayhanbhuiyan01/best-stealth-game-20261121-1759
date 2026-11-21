# Nightshade — Shadow Courier

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/rayhanbhuiyan01/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/rayhanbhuiyan01/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A complete top-down 2D stealth game that runs offline in a desktop browser
from its own files — no libraries, no network calls, no build step.

**Bounty:** [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759)
**Referral code:** `r3j4cz5h`
**Owner:** rayhanbhuiyan01
**Repo:** best-stealth-game-20261121-1759

## The game

You are the Nightshade courier, sneaking through guarded halls at night to
collect scrolls and slip out the exit door unseen. Three levels — The Rooftop
Archive, The Lantern Courtyard, The Vault of Echoes — with 2, 3 and 4
patrolling lantern guards.

- **Vision cones** raycast against walls and crates, so the light you see is
  the light that can see you.
- **Guard AI:** patrol → suspicious → chase → search. A guard that spots you
  fills a suspicion meter, then runs at you with a red cone and an alarm.
  Lose them and they search your last seen spot before returning to patrol.
- **Cover:** bushes hide you (guards cannot see you inside one unless they
  are very close); crates block movement and sight.
- **Noise:** running makes a noise ring that draws guards; sneaking with
  Shift is slow and silent.
- **Objective:** collect all 3 scrolls to unlock the exit, then reach it.
  Ghost bonus for clearing a level unseen, time bonus for speed.
- **Lives:** 3. Being caught costs one.
- **Sound:** synthesized with WebAudio only — footsteps, pickup chime, alert
  sting, win and lose jingles. `M` mutes.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Walk |
| Shift (hold) | Sneak — slower, silent |
| Click a tile | Walk there along a found path |
| Enter | Start / continue |
| P | Pause / resume |
| R | Restart the level |
| M | Mute / unmute |

## Play it

```sh
node serve.ts --port 8123
# open http://localhost:8123/
```

## Screenshots

`?shot=` freezes a posed frame of the real game:

| Shot | Frame |
| --- | --- |
| `?shot=play` | Mid-level, sneaking in a bush past a suspicious guard |
| `?shot=start` | Title screen |
| `?shot=alert` | Chase in progress — SPOTTED |
| `?shot=end` | Level clear, exit open |

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

## Layout

```
game/
  index.html          the page
  src/
    config.js         tuning + the three level maps
    random.js         seeded random (deterministic poses)
    input.js          keyboard + mouse state
    world.js          tile map, sight lines, pathfinding
    player.js         the courier: walk, sneak, noise, click-to-move
    guards.js         guard AI + raycast vision cones
    audio.js          WebAudio synth, no audio files
    render.js         all drawing: world, cones, HUD, screens
    shots.js          the four posed screenshot frames
    main.js           phases, score, lives, frame loop
main.ts               hand-in program (Node 22, stdlib only)
serve.ts              tiny static server for local play
shots.json            the four screenshot poses
screenshots/         real renders of the game
vendor/makefun-game.ts  make.fun dossier library, unchanged from the kit
```

## License

MIT — see [LICENSE](LICENSE).

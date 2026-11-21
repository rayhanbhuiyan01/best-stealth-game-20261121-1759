// Nightshade — Shadow Courier: level data and tuning knobs.
// A level map is one character per tile:
//   # wall (blocks movement and sight)   . floor
//   B bush (cover: you are hidden inside)  C crate (blocks movement and sight)
//   S scroll (loot)   E exit door   P player start
// Guards walk the waypoint lists in tile coordinates. All art is drawn in
// code; there are no image, font or sound files to load.

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;

export const PLAYER = {
  radius: 13,
  walkSpeed: 148, // pixels per second
  sneakSpeed: 78,
  noiseRadiusWalk: 150, // guards hear running feet inside this range
  noiseRadiusSneak: 26,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 128,
  searchSpeed: 70,
  viewDistance: 235,
  viewAngle: 1.15, // radians, half-angle of the vision cone
  suspicionPerSecond: 1.15, // how fast the alert meter fills while seen
  suspicionDecay: 0.45, // how fast it drains while unseen
  catchDistance: 26,
  hearRadius: 150,
};

export const LEVELS = [
  {
    name: '1 · The Rooftop Archive',
    hint: 'Gather all 3 scrolls, then slip out the green door. Bushes and crates hide you.',
    par: 75,
    map: [
      '################################',
      '#P......#..........B.........#.#',
      '#.......#..........B......S..#.#',
      '#..C....#....C.............#...#',
      '#.......#..........####...#...##',
      '#..B....#..........#......#...##',
      '#.......#..........#..C...#...##',
      '#.......#####.######......#...##',
      '#........................#...###',
      '#..C......B.......C.......#E..##',
      '#........................#...###',
      '#.....####.....####.......#...##',
      '#.....#..........#............##',
      '#.....#....S.....#....B.......##',
      '#.....#..........#............##',
      '#..B..#....C.....#.....C......##',
      '#.....#..........#............##',
      '#.....#..........#......S.....##',
      '#.....#..........#............##',
      '################################',
    ],
    guards: [
      { patrol: [[14, 3], [14, 9], [20, 9], [20, 3]], speed: 62 },
      { patrol: [[8, 15], [8, 13], [15, 13], [15, 15]], speed: 58 },
    ],
  },
  {
    name: '2 · The Lantern Courtyard',
    hint: 'Three lantern guards now. Sneak (hold Shift) to shrink your noise.',
    par: 95,
    map: [
      '################################',
      '#P...B......#......B......S....#',
      '#.......C...#..........C.......#',
      '#..####.....#.....####.........#',
      '#..#........#.....#............#',
      '#..#...S....#..B..#....C....#.##',
      '#..#........#.....#.........#..#',
      '#..####..C..#.....####..B...#..#',
      '#.............................##',
      '#..B.......####.......C....#...#',
      '#......C...#..#...........#....#',
      '#..........#..#...S.......#..E.#',
      '#..####....#..#...........#....#',
      '#..#.......#..#....####...#....#',
      '#..#...B...#..#....#..........##',
      '#..#.......#..#....#....C.....##',
      '#..####....#..#....#..........##',
      '#......C...#..#....#.....B....##',
      '#..........#..#....#..........##',
      '################################',
    ],
    guards: [
      { patrol: [[5, 8], [14, 8], [14, 2], [5, 2]], speed: 66 },
      { patrol: [[24, 4], [24, 12], [17, 12], [17, 4]], speed: 62 },
      { patrol: [[9, 16], [9, 10], [16, 10], [16, 16]], speed: 60 },
    ],
  },
  {
    name: '3 · The Vault of Echoes',
    hint: 'Four guards, long sightlines. Use the bushes — a guard must be very close to spot you in one.',
    par: 120,
    map: [
      '################################',
      '#P....B.....##.....B.......S...#',
      '#.....C.....##..........C......#',
      '#..####.....##....####.........#',
      '#..#........##....#.......B....#',
      '#..#...S....##.B..#....C....#..#',
      '#..#........##....#.........#..#',
      '#..####..C..##....####..B...#..#',
      '#.............................##',
      '#..B.......####.......C....#...#',
      '#......C...#..#....B......#....#',
      '#..........#..#...........#..E.#',
      '#..####....#..#....S......#....#',
      '#..#.......#..#...........#....#',
      '#..#...B...#..#....####...#....#',
      '#..#.......#..#....#..........##',
      '#..####....#..#....#.....C....##',
      '#......C...#..#....#.....B....##',
      '#..........#..#....#..........##',
      '################################',
    ],
    guards: [
      { patrol: [[5, 8], [14, 8], [14, 2], [5, 2]], speed: 70 },
      { patrol: [[24, 4], [24, 12], [17, 12], [17, 4]], speed: 66 },
      { patrol: [[9, 16], [9, 10], [16, 10], [16, 16]], speed: 64 },
      { patrol: [[26, 15], [26, 8], [20, 8], [20, 15]], speed: 62 },
    ],
  },
];

export const SCORE = {
  scroll: 150,
  levelClear: 500,
  timeBonusPerSecond: 10,
  ghostBonus: 400, // finishing a level never seen at all
};

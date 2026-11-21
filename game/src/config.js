// Nightshade — Shadow Courier: tuning numbers and the three level layouts.
// Map legend: '#' wall, '.' floor, 'B' bush (hides the courier), 'C' crate
// (blocks movement and sight), 'S' scroll, 'P' courier start, 'E' exit door.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800

export const WALK_SPEED = 155; // pixels per second, running
export const SNEAK_SPEED = 88; // pixels per second, holding Shift
export const GUARD_PATROL_SPEED = 64;
export const GUARD_CHASE_SPEED = 138;
export const GUARD_SEARCH_SPEED = 84;
export const VISION_RANGE = 268;
export const VISION_HALF_ANGLE = (Math.PI / 180) * 38; // about a 76 degree cone
export const NOISE_RADIUS = 155; // running footsteps carry this far
export const BUSH_HIDE_RANGE = 72; // a guard must be this close to spot a courier in a bush
export const MAX_LIVES = 3;
export const SCROLL_POINTS = 100;
export const GHOST_BONUS = 250; // clearing a level without ever being spotted
export const CATCH_DISTANCE = 26;

export const LEVELS = [
  {
    name: 'The Rooftop Archive',
    sub: 'Level 1 — two lantern guards walk the stacks. Slip past, take 3 scrolls.',
    par: 75,
    map: [
      '################################',
      '#......B..........B...........#',
      '#..P......C.......C.....S....#',
      '#..........####..............#',
      '#..B.......#..#......B.......#',
      '#..........#..#.........C....#',
      '#....C.....#..#....S.........#',
      '#..........####.......B......#',
      '#......B........C............#',
      '#.............#####..........#',
      '#.........C...#...#....B.....#',
      '#.............#...#..........#',
      '#....B........#####....C.....#',
      '#......................S....#',
      '#..C......B........C.........#',
      '#..............B.............#',
      '#...............#####........#',
      '#..................#E#......#',
      '#..B.......C.......#..#......#',
      '################################',
    ],
    guards: [
      { waypoints: [[4, 2], [16, 2], [16, 6], [4, 6]] },
      { waypoints: [[24, 10], [24, 16], [10, 16], [10, 9]] },
    ],
  },
  {
    name: 'The Lantern Courtyard',
    sub: 'Level 2 — three guards cross the courtyard. Bushes are your friends.',
    par: 90,
    map: [
      '################################',
      '#..B........C...........B.....#',
      '#......S.......####..........#',
      '#..P....C......#..#....C.....#',
      '#..............#..#......S...#',
      '#..B.....####..#..#..........#',
      '#..........#...####....B.....#',
      '#....C.....#..........C......#',
      '#..........#####.............#',
      '#.......B........C......B....#',
      '#.............C.....####.....#',
      '#..C......B.........#..#.....#',
      '#..................#..#.....#',
      '#......C......B.....####.....#',
      '#............................#',
      '#..B......S......C.......B...#',
      '#..........####..............#',
      '#..C......#....#......C......#',
      '#.........#.E..#....B.......#',
      '################################',
    ],
    guards: [
      { waypoints: [[5, 3], [14, 3], [14, 7], [6, 7]] },
      { waypoints: [[24, 4], [24, 12], [10, 12], [10, 4]] },
      { waypoints: [[6, 16], [26, 16], [26, 9], [6, 9]] },
    ],
  },
  {
    name: 'The Vault of Echoes',
    sub: 'Level 3 — four guards, tight halls. One mistake and the vault wakes.',
    par: 110,
    map: [
      '################################',
      '#..B.....C..........B......S..#',
      '#........####.....C..........#',
      '#..P.....#..#..........C.....#',
      '#........#..#....B......#....#',
      '#..C.....#..#.........##.....#',
      '#........####....S....#..B...#',
      '#..B..........C.......#......#',
      '#.......#####......C.........#',
      '#.......#...#....B......C....#',
      '#........#...#...........#...#',
      '#..C.....#####....S......#...#',
      '#....................####...#',
      '#..B......C.....B............#',
      '#.........####........C......#',
      '#..........#..#......B........#',
      '#.........#..#....####.......#',
      '#..C......#..#....#..#...E...#',
      '#..B...........B...#..#......#',
      '################################',
    ],
    guards: [
      { waypoints: [[5, 3], [13, 3], [12, 7], [5, 7]] },
      { waypoints: [[22, 4], [22, 11], [14, 11], [14, 4]] },
      { waypoints: [[6, 15], [20, 15], [20, 9], [6, 9]] },
      { waypoints: [[26, 5], [26, 16], [16, 16], [16, 5]] },
    ],
  },
];

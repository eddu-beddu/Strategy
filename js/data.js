/* =============================================================
   data.js — Classes, weapons, items and constants.
   Everything hangs off the global FE namespace so the game runs
   straight from the file system (no ES modules / no server).
   ============================================================= */
var FE = window.FE || {};
window.FE = FE;

FE.STATS = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
FE.STAT_LABEL = {
  hp: 'HP', str: 'Str', mag: 'Mag', skl: 'Skl',
  spd: 'Spd', lck: 'Lck', def: 'Def', res: 'Res'
};

/* Weapon ranks, in order. WEXP thresholds to reach each rank. */
FE.RANKS = ['E', 'D', 'C', 'B', 'A'];
FE.RANK_WEXP = { E: 0, D: 25, C: 60, B: 110, A: 180 };

/* Sword > Axe > Lance > Sword.  Magic triangle: Anima > Light > Dark > Anima. */
FE.TRIANGLE = {
  sword: 'axe', axe: 'lance', lance: 'sword',
  anima: 'light', light: 'dark', dark: 'anima'
};

FE.MAX_LEVEL = 20;
FE.STAT_CAP = { hp: 60, str: 25, mag: 25, skl: 26, spd: 26, lck: 30, def: 24, res: 24 };
FE.PROMO_CAP_BONUS = 6; /* promoted classes cap higher */

/* -------------------------------------------------------------
   CLASSES
   sprite: which pixel-art silhouette to draw
   tags:   used by "effective against" weapons
   ------------------------------------------------------------- */
FE.CLASSES = {
  /* ---- Player-side tier 1 ---- */
  lord: {
    name: 'Lord', mov: 5, con: 7, sprite: 'lord', tags: ['foot'],
    weapons: ['sword'], ranks: { sword: 'D' }, promo: 'greatlord',
    bases: { hp: 18, str: 5, mag: 1, skl: 6, spd: 7, lck: 7, def: 5, res: 1 },
    growths: { hp: 80, str: 50, mag: 15, skl: 55, spd: 55, lck: 60, def: 35, res: 30 }
  },
  cavalier: {
    name: 'Cavalier', mov: 7, con: 9, sprite: 'cavalry', tags: ['horse', 'mounted'],
    weapons: ['sword', 'lance'], ranks: { sword: 'E', lance: 'D' }, promo: 'paladin',
    bases: { hp: 20, str: 6, mag: 0, skl: 5, spd: 5, lck: 3, def: 6, res: 1 },
    growths: { hp: 80, str: 45, mag: 15, skl: 40, spd: 40, lck: 35, def: 30, res: 25 }
  },
  knight: {
    name: 'Knight', mov: 4, con: 13, sprite: 'armor', tags: ['foot', 'armor'],
    weapons: ['lance'], ranks: { lance: 'D' }, promo: 'general',
    bases: { hp: 22, str: 7, mag: 0, skl: 4, spd: 3, lck: 3, def: 10, res: 0 },
    growths: { hp: 85, str: 50, mag: 10, skl: 35, spd: 20, lck: 30, def: 50, res: 20 }
  },
  mercenary: {
    name: 'Mercenary', mov: 5, con: 10, sprite: 'infantry', tags: ['foot'],
    weapons: ['sword'], ranks: { sword: 'C' }, promo: 'hero',
    bases: { hp: 20, str: 6, mag: 0, skl: 7, spd: 7, lck: 4, def: 5, res: 0 },
    growths: { hp: 80, str: 45, mag: 10, skl: 50, spd: 45, lck: 35, def: 25, res: 20 }
  },
  myrmidon: {
    name: 'Myrmidon', mov: 5, con: 8, sprite: 'swordsman', tags: ['foot'],
    weapons: ['sword'], ranks: { sword: 'D' }, promo: 'swordmaster', crit: 10,
    bases: { hp: 17, str: 4, mag: 0, skl: 9, spd: 11, lck: 5, def: 3, res: 1 },
    growths: { hp: 70, str: 40, mag: 10, skl: 60, spd: 60, lck: 40, def: 20, res: 25 }
  },
  fighter: {
    name: 'Fighter', mov: 5, con: 12, sprite: 'brute', tags: ['foot'],
    weapons: ['axe'], ranks: { axe: 'D' }, promo: 'warrior',
    bases: { hp: 25, str: 8, mag: 0, skl: 4, spd: 5, lck: 3, def: 4, res: 0 },
    growths: { hp: 90, str: 55, mag: 10, skl: 40, spd: 40, lck: 30, def: 25, res: 15 }
  },
  archer: {
    name: 'Archer', mov: 5, con: 8, sprite: 'archer', tags: ['foot'],
    weapons: ['bow'], ranks: { bow: 'D' }, promo: 'sniper',
    bases: { hp: 18, str: 5, mag: 0, skl: 7, spd: 6, lck: 3, def: 4, res: 1 },
    growths: { hp: 70, str: 45, mag: 10, skl: 60, spd: 45, lck: 30, def: 20, res: 25 }
  },
  mage: {
    name: 'Mage', mov: 5, con: 6, sprite: 'mage', tags: ['foot'],
    weapons: ['anima'], ranks: { anima: 'D' }, promo: 'sage',
    bases: { hp: 16, str: 1, mag: 6, skl: 5, spd: 6, lck: 4, def: 2, res: 6 },
    growths: { hp: 65, str: 10, mag: 55, skl: 50, spd: 50, lck: 40, def: 15, res: 45 }
  },
  cleric: {
    name: 'Cleric', mov: 5, con: 5, sprite: 'cleric', tags: ['foot'],
    weapons: ['staff'], ranks: { staff: 'D' }, promo: 'bishop',
    bases: { hp: 16, str: 0, mag: 5, skl: 3, spd: 6, lck: 8, def: 2, res: 7 },
    growths: { hp: 65, str: 10, mag: 50, skl: 40, spd: 45, lck: 60, def: 12, res: 50 }
  },
  pegasus: {
    name: 'Pegasus Knight', mov: 7, con: 6, sprite: 'flier', tags: ['flier', 'mounted'],
    weapons: ['lance'], ranks: { lance: 'D' }, promo: 'falcon',
    bases: { hp: 17, str: 5, mag: 1, skl: 7, spd: 10, lck: 6, def: 4, res: 7 },
    growths: { hp: 65, str: 40, mag: 15, skl: 50, spd: 60, lck: 45, def: 20, res: 45 }
  },
  thief: {
    name: 'Thief', mov: 6, con: 7, sprite: 'rogue', tags: ['foot', 'thief'],
    weapons: ['sword'], ranks: { sword: 'E' }, promo: 'assassin',
    bases: { hp: 16, str: 3, mag: 0, skl: 6, spd: 11, lck: 4, def: 2, res: 1 },
    growths: { hp: 65, str: 30, mag: 10, skl: 55, spd: 65, lck: 45, def: 15, res: 25 }
  },

  /* ---- Promoted ---- */
  greatlord: {
    name: 'Great Lord', mov: 6, con: 9, sprite: 'lord', tags: ['foot'], promoted: true,
    weapons: ['sword', 'lance'], ranks: { sword: 'B', lance: 'D' },
    bases: { hp: 5, str: 3, mag: 1, skl: 2, spd: 2, lck: 0, def: 4, res: 3 },
    growths: { hp: 80, str: 50, mag: 20, skl: 50, spd: 50, lck: 60, def: 40, res: 35 }
  },
  paladin: {
    name: 'Paladin', mov: 8, con: 11, sprite: 'cavalry', tags: ['horse', 'mounted'], promoted: true,
    weapons: ['sword', 'lance'], ranks: { sword: 'C', lance: 'B' },
    bases: { hp: 4, str: 2, mag: 1, skl: 2, spd: 2, lck: 0, def: 3, res: 5 },
    growths: { hp: 80, str: 45, mag: 20, skl: 40, spd: 40, lck: 35, def: 35, res: 30 }
  },
  general: {
    name: 'General', mov: 5, con: 15, sprite: 'armor', tags: ['foot', 'armor'], promoted: true,
    weapons: ['lance', 'axe'], ranks: { lance: 'A', axe: 'D' },
    bases: { hp: 6, str: 3, mag: 0, skl: 3, spd: 2, lck: 0, def: 4, res: 4 },
    growths: { hp: 85, str: 50, mag: 10, skl: 35, spd: 25, lck: 30, def: 45, res: 25 }
  },
  hero: {
    name: 'Hero', mov: 6, con: 11, sprite: 'infantry', tags: ['foot'], promoted: true,
    weapons: ['sword', 'axe'], ranks: { sword: 'A', axe: 'C' },
    bases: { hp: 5, str: 2, mag: 0, skl: 3, spd: 2, lck: 0, def: 3, res: 4 },
    growths: { hp: 80, str: 45, mag: 10, skl: 45, spd: 45, lck: 35, def: 30, res: 25 }
  },
  swordmaster: {
    name: 'Swordmaster', mov: 6, con: 9, sprite: 'swordsman', tags: ['foot'], promoted: true, crit: 30,
    weapons: ['sword'], ranks: { sword: 'A' },
    bases: { hp: 4, str: 2, mag: 0, skl: 4, spd: 4, lck: 0, def: 2, res: 4 },
    growths: { hp: 70, str: 40, mag: 10, skl: 55, spd: 55, lck: 40, def: 25, res: 30 }
  },
  warrior: {
    name: 'Warrior', mov: 6, con: 14, sprite: 'brute', tags: ['foot'], promoted: true,
    weapons: ['axe', 'bow'], ranks: { axe: 'A', bow: 'D' },
    bases: { hp: 7, str: 3, mag: 0, skl: 2, spd: 2, lck: 0, def: 2, res: 3 },
    growths: { hp: 90, str: 55, mag: 10, skl: 40, spd: 40, lck: 30, def: 30, res: 20 }
  },
  sniper: {
    name: 'Sniper', mov: 6, con: 10, sprite: 'archer', tags: ['foot'], promoted: true, crit: 10,
    weapons: ['bow'], ranks: { bow: 'A' },
    bases: { hp: 5, str: 2, mag: 0, skl: 4, spd: 3, lck: 0, def: 2, res: 4 },
    growths: { hp: 70, str: 45, mag: 10, skl: 55, spd: 45, lck: 30, def: 25, res: 30 }
  },
  sage: {
    name: 'Sage', mov: 6, con: 8, sprite: 'mage', tags: ['foot'], promoted: true,
    weapons: ['anima', 'staff'], ranks: { anima: 'A', staff: 'C' },
    bases: { hp: 4, str: 1, mag: 3, skl: 3, spd: 3, lck: 0, def: 2, res: 3 },
    growths: { hp: 65, str: 10, mag: 50, skl: 45, spd: 45, lck: 40, def: 20, res: 45 }
  },
  bishop: {
    name: 'Bishop', mov: 6, con: 7, sprite: 'cleric', tags: ['foot'], promoted: true,
    weapons: ['light', 'staff'], ranks: { light: 'A', staff: 'B' },
    bases: { hp: 4, str: 1, mag: 3, skl: 3, spd: 2, lck: 0, def: 2, res: 5 },
    growths: { hp: 65, str: 10, mag: 50, skl: 45, spd: 40, lck: 55, def: 18, res: 50 }
  },
  falcon: {
    name: 'Falcon Knight', mov: 8, con: 8, sprite: 'flier', tags: ['flier', 'mounted'], promoted: true,
    weapons: ['lance', 'sword'], ranks: { lance: 'A', sword: 'D' },
    bases: { hp: 4, str: 3, mag: 1, skl: 3, spd: 2, lck: 0, def: 3, res: 4 },
    growths: { hp: 65, str: 40, mag: 20, skl: 50, spd: 55, lck: 45, def: 25, res: 45 }
  },
  assassin: {
    name: 'Assassin', mov: 7, con: 9, sprite: 'rogue', tags: ['foot', 'thief'], promoted: true, crit: 20,
    weapons: ['sword'], ranks: { sword: 'A' },
    bases: { hp: 3, str: 2, mag: 0, skl: 4, spd: 3, lck: 0, def: 2, res: 3 },
    growths: { hp: 65, str: 35, mag: 10, skl: 55, spd: 60, lck: 45, def: 20, res: 25 }
  },

  /* ---- Enemy-flavour classes ---- */
  brigand: {
    name: 'Brigand', mov: 5, con: 13, sprite: 'brute', tags: ['foot'],
    weapons: ['axe'], ranks: { axe: 'D' },
    bases: { hp: 22, str: 7, mag: 0, skl: 3, spd: 4, lck: 0, def: 3, res: 0 },
    growths: { hp: 85, str: 50, mag: 0, skl: 30, spd: 30, lck: 10, def: 20, res: 10 }
  },
  soldier: {
    name: 'Soldier', mov: 5, con: 10, sprite: 'soldier', tags: ['foot'],
    weapons: ['lance'], ranks: { lance: 'D' },
    bases: { hp: 20, str: 5, mag: 0, skl: 4, spd: 4, lck: 1, def: 4, res: 1 },
    growths: { hp: 75, str: 40, mag: 0, skl: 35, spd: 35, lck: 15, def: 25, res: 15 }
  },
  shaman: {
    name: 'Shaman', mov: 5, con: 7, sprite: 'darkmage', tags: ['foot'],
    weapons: ['dark'], ranks: { dark: 'D' },
    bases: { hp: 18, str: 1, mag: 6, skl: 4, spd: 3, lck: 1, def: 3, res: 6 },
    growths: { hp: 70, str: 5, mag: 50, skl: 40, spd: 30, lck: 20, def: 18, res: 40 }
  },
  wyvern: {
    name: 'Wyvern Rider', mov: 7, con: 12, sprite: 'wyvern', tags: ['flier', 'mounted'],
    weapons: ['lance', 'axe'], ranks: { lance: 'D', axe: 'E' },
    bases: { hp: 24, str: 8, mag: 0, skl: 5, spd: 5, lck: 2, def: 9, res: 0 },
    growths: { hp: 85, str: 50, mag: 5, skl: 40, spd: 35, lck: 20, def: 35, res: 15 }
  },
  bandit: {
    name: 'Bandit Chief', mov: 5, con: 14, sprite: 'brute', tags: ['foot'], promoted: true,
    weapons: ['axe'], ranks: { axe: 'B' },
    bases: { hp: 32, str: 11, mag: 0, skl: 6, spd: 6, lck: 2, def: 7, res: 2 },
    growths: { hp: 85, str: 50, mag: 0, skl: 35, spd: 35, lck: 15, def: 25, res: 15 }
  },
  priest: {
    name: 'Priest', mov: 5, con: 6, sprite: 'cleric', tags: ['foot'],
    weapons: ['staff'], ranks: { staff: 'C' },
    bases: { hp: 18, str: 0, mag: 5, skl: 3, spd: 5, lck: 3, def: 2, res: 6 },
    growths: { hp: 65, str: 5, mag: 45, skl: 35, spd: 40, lck: 30, def: 12, res: 45 }
  }
};

/* -------------------------------------------------------------
   WEAPONS & ITEMS
   kind: 'weapon' | 'staff' | 'consumable' | 'promo' | 'booster'
   ------------------------------------------------------------- */
function W(id, o) { o.id = id; o.kind = o.kind || 'weapon'; FE.ITEMS[id] = o; }
FE.ITEMS = {};

/* Swords */
W('iron_sword',   { name: 'Iron Sword',   type: 'sword', rank: 'E', mt: 5,  hit: 90,  crit: 0,  wt: 5,  min: 1, max: 1, uses: 46, price: 460 });
W('slim_sword',   { name: 'Slim Sword',   type: 'sword', rank: 'E', mt: 3,  hit: 100, crit: 5,  wt: 2,  min: 1, max: 1, uses: 30, price: 480 });
W('steel_sword',  { name: 'Steel Sword',  type: 'sword', rank: 'D', mt: 8,  hit: 75,  crit: 0,  wt: 10, min: 1, max: 1, uses: 30, price: 600 });
W('armorslayer',  { name: 'Armorslayer',  type: 'sword', rank: 'D', mt: 8,  hit: 80,  crit: 0,  wt: 11, min: 1, max: 1, uses: 18, price: 1260, effective: ['armor'] });
W('killing_edge', { name: 'Killing Edge', type: 'sword', rank: 'C', mt: 9,  hit: 85,  crit: 30, wt: 7,  min: 1, max: 1, uses: 20, price: 1300 });
W('brave_sword',  { name: 'Brave Sword',  type: 'sword', rank: 'B', mt: 9,  hit: 75,  crit: 0,  wt: 12, min: 1, max: 1, uses: 30, price: 3000, brave: true });
W('silver_sword', { name: 'Silver Sword', type: 'sword', rank: 'A', mt: 13, hit: 80,  crit: 0,  wt: 8,  min: 1, max: 1, uses: 20, price: 1500 });
W('rapier',       { name: 'Rapier',       type: 'sword', rank: 'E', mt: 7,  hit: 95,  crit: 10, wt: 5,  min: 1, max: 1, uses: 40, price: 0, effective: ['armor', 'horse'], lock: 'lord' });

/* Lances */
W('iron_lance',   { name: 'Iron Lance',   type: 'lance', rank: 'E', mt: 7,  hit: 80, crit: 0,  wt: 8,  min: 1, max: 1, uses: 45, price: 360 });
W('javelin',      { name: 'Javelin',      type: 'lance', rank: 'E', mt: 6,  hit: 65, crit: 0,  wt: 11, min: 1, max: 2, uses: 20, price: 400 });
W('steel_lance',  { name: 'Steel Lance',  type: 'lance', rank: 'D', mt: 10, hit: 70, crit: 0,  wt: 13, min: 1, max: 1, uses: 30, price: 480 });
W('horseslayer',  { name: 'Horseslayer',  type: 'lance', rank: 'D', mt: 7,  hit: 70, crit: 0,  wt: 12, min: 1, max: 1, uses: 16, price: 1040, effective: ['horse'] });
W('killer_lance', { name: 'Killer Lance', type: 'lance', rank: 'C', mt: 10, hit: 75, crit: 30, wt: 9,  min: 1, max: 1, uses: 20, price: 1200 });
W('silver_lance', { name: 'Silver Lance', type: 'lance', rank: 'A', mt: 14, hit: 75, crit: 0,  wt: 10, min: 1, max: 1, uses: 20, price: 1200 });

/* Axes */
W('iron_axe',     { name: 'Iron Axe',     type: 'axe', rank: 'E', mt: 8,  hit: 75, crit: 0,  wt: 10, min: 1, max: 1, uses: 45, price: 270 });
W('hand_axe',     { name: 'Hand Axe',     type: 'axe', rank: 'E', mt: 7,  hit: 60, crit: 0,  wt: 12, min: 1, max: 2, uses: 20, price: 300 });
W('steel_axe',    { name: 'Steel Axe',    type: 'axe', rank: 'D', mt: 11, hit: 65, crit: 0,  wt: 15, min: 1, max: 1, uses: 30, price: 360 });
W('hammer',       { name: 'Hammer',       type: 'axe', rank: 'D', mt: 10, hit: 55, crit: 0,  wt: 15, min: 1, max: 1, uses: 20, price: 800, effective: ['armor'] });
W('killer_axe',   { name: 'Killer Axe',   type: 'axe', rank: 'C', mt: 11, hit: 65, crit: 30, wt: 12, min: 1, max: 1, uses: 20, price: 1000 });
W('silver_axe',   { name: 'Silver Axe',   type: 'axe', rank: 'A', mt: 15, hit: 70, crit: 0,  wt: 12, min: 1, max: 1, uses: 20, price: 1000 });

/* Bows */
W('iron_bow',     { name: 'Iron Bow',     type: 'bow', rank: 'E', mt: 6,  hit: 85, crit: 0,  wt: 5, min: 2, max: 2, uses: 45, price: 540, effective: ['flier'] });
W('steel_bow',    { name: 'Steel Bow',    type: 'bow', rank: 'D', mt: 9,  hit: 70, crit: 0,  wt: 9, min: 2, max: 2, uses: 30, price: 560, effective: ['flier'] });
W('longbow',      { name: 'Longbow',      type: 'bow', rank: 'D', mt: 5,  hit: 65, crit: 0,  wt: 9, min: 2, max: 3, uses: 20, price: 2000, effective: ['flier'] });
W('killer_bow',   { name: 'Killer Bow',   type: 'bow', rank: 'C', mt: 9,  hit: 75, crit: 30, wt: 7, min: 2, max: 2, uses: 20, price: 1400, effective: ['flier'] });
W('silver_bow',   { name: 'Silver Bow',   type: 'bow', rank: 'A', mt: 13, hit: 75, crit: 0,  wt: 9, min: 2, max: 2, uses: 20, price: 1600, effective: ['flier'] });

/* Anima / Light / Dark — these target Res */
W('fire',      { name: 'Fire',      type: 'anima', rank: 'E', mt: 5,  hit: 90, crit: 0,  wt: 4,  min: 1, max: 2, uses: 40, price: 560, magic: true });
W('thunder',   { name: 'Thunder',   type: 'anima', rank: 'D', mt: 8,  hit: 80, crit: 5,  wt: 6,  min: 1, max: 2, uses: 35, price: 700, magic: true });
W('elfire',    { name: 'Elfire',    type: 'anima', rank: 'C', mt: 10, hit: 85, crit: 0,  wt: 9,  min: 1, max: 2, uses: 30, price: 1200, magic: true });
W('fimbulvetr',{ name: 'Fimbulvetr',type: 'anima', rank: 'A', mt: 13, hit: 80, crit: 5,  wt: 11, min: 1, max: 2, uses: 20, price: 2400, magic: true });
W('lightning', { name: 'Lightning', type: 'light', rank: 'E', mt: 4,  hit: 95, crit: 5,  wt: 4,  min: 1, max: 2, uses: 35, price: 630, magic: true });
W('shine',     { name: 'Shine',     type: 'light', rank: 'D', mt: 6,  hit: 90, crit: 10, wt: 6,  min: 1, max: 2, uses: 30, price: 1080, magic: true });
W('flux',      { name: 'Flux',      type: 'dark',  rank: 'D', mt: 7,  hit: 80, crit: 0,  wt: 8,  min: 1, max: 2, uses: 45, price: 900, magic: true });
W('nosferatu', { name: 'Nosferatu', type: 'dark',  rank: 'C', mt: 8,  hit: 75, crit: 0,  wt: 11, min: 1, max: 2, uses: 20, price: 2400, magic: true, drain: true });

/* Staves */
W('heal',   { name: 'Heal',   kind: 'staff', type: 'staff', rank: 'E', min: 1, max: 1, uses: 30, price: 600,  heal: 10 });
W('mend',   { name: 'Mend',   kind: 'staff', type: 'staff', rank: 'D', min: 1, max: 1, uses: 20, price: 1000, heal: 20 });
W('physic', { name: 'Physic', kind: 'staff', type: 'staff', rank: 'C', min: 1, max: 0, uses: 15, price: 3750, heal: 10, ranged: true });

/* Consumables */
W('vulnerary', { name: 'Vulnerary', kind: 'consumable', uses: 3, price: 300, heal: 10 });
W('elixir',    { name: 'Elixir',    kind: 'consumable', uses: 3, price: 3000, heal: 999 });
W('antitoxin', { name: 'Pure Water', kind: 'consumable', uses: 3, price: 900, buff: { res: 7 } });

/* Promotion items */
W('hero_crest',    { name: 'Hero Crest',    kind: 'promo', uses: 3, price: 10000, forClasses: ['mercenary', 'myrmidon', 'fighter'] });
W('knight_crest',  { name: 'Knight Crest',  kind: 'promo', uses: 3, price: 10000, forClasses: ['cavalier', 'knight', 'soldier'] });
W('orion_bolt',    { name: "Orion's Bolt",  kind: 'promo', uses: 3, price: 10000, forClasses: ['archer'] });
W('elysian_whip',  { name: 'Elysian Whip',  kind: 'promo', uses: 3, price: 10000, forClasses: ['pegasus', 'wyvern'] });
W('guiding_ring',  { name: 'Guiding Ring',  kind: 'promo', uses: 3, price: 10000, forClasses: ['mage', 'cleric', 'shaman', 'priest'] });
W('fell_contract', { name: 'Fell Contract', kind: 'promo', uses: 3, price: 10000, forClasses: ['thief'] });
W('earth_seal',    { name: 'Earth Seal',    kind: 'promo', uses: 1, price: 20000, forClasses: '*' });

/* Stat boosters */
W('angelic_robe', { name: 'Angelic Robe', kind: 'booster', uses: 1, price: 8000, stat: 'hp',  amount: 7 });
W('energy_ring',  { name: 'Energy Ring',  kind: 'booster', uses: 1, price: 8000, stat: 'str', amount: 2 });
W('secret_book',  { name: 'Secret Book',  kind: 'booster', uses: 1, price: 8000, stat: 'skl', amount: 2 });
W('speedwing',    { name: 'Speedwing',    kind: 'booster', uses: 1, price: 8000, stat: 'spd', amount: 2 });
W('dragonshield', { name: 'Dragonshield', kind: 'booster', uses: 1, price: 8000, stat: 'def', amount: 2 });
W('goddess_icon', { name: 'Goddess Icon', kind: 'booster', uses: 1, price: 8000, stat: 'lck', amount: 2 });
W('talisman',     { name: 'Talisman',     kind: 'booster', uses: 1, price: 8000, stat: 'res', amount: 2 });

/* -------------------------------------------------------------
   TERRAIN
   cost: movement cost per movement-type
   ------------------------------------------------------------- */
FE.TERRAIN = {
  '.': { name: 'Plain',    def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 } },
  ',': { name: 'Road',     def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 } },
  'f': { name: 'Forest',   def: 1, avo: 20, cost: { foot: 2, horse: 3, flier: 1 } },
  'h': { name: 'Hill',     def: 1, avo: 10, cost: { foot: 2, horse: 3, flier: 1 } },
  'm': { name: 'Mountain', def: 2, avo: 30, cost: { foot: 4, horse: 99, flier: 1 } },
  'p': { name: 'Peak',     def: 2, avo: 25, cost: { foot: 4, horse: 99, flier: 1 } },
  '~': { name: 'Water',    def: 0, avo: 0,  cost: { foot: 99, horse: 99, flier: 1 } },
  '#': { name: 'Wall',     def: 0, avo: 0,  cost: { foot: 99, horse: 99, flier: 99 } },
  'W': { name: 'Ruins',    def: 1, avo: 15, cost: { foot: 2, horse: 99, flier: 1 } },
  'B': { name: 'Bridge',   def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 } },
  'F': { name: 'Fort',     def: 2, avo: 20, cost: { foot: 1, horse: 1, flier: 1 }, heal: 0.2 },
  'T': { name: 'Throne',   def: 3, avo: 30, cost: { foot: 1, horse: 1, flier: 1 }, heal: 0.2, seize: true },
  'G': { name: 'Gate',     def: 3, avo: 20, cost: { foot: 1, horse: 1, flier: 1 }, heal: 0.2, seize: true },
  'V': { name: 'Village',  def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 }, village: true },
  'H': { name: 'House',    def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 }, village: true },
  'E': { name: 'Escape',   def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 }, escape: true },
  'C': { name: 'Chest',    def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 }, chest: true },
  'S': { name: 'Shop',     def: 0, avo: 0,  cost: { foot: 1, horse: 1, flier: 1 }, shop: true }
};

FE.moveType = function (cls) {
  var c = FE.CLASSES[cls];
  if (!c) return 'foot';
  if (c.tags.indexOf('flier') >= 0) return 'flier';
  if (c.tags.indexOf('horse') >= 0) return 'horse';
  return 'foot';
};

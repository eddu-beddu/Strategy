/* =============================================================
   maps.js — Campaign chapters.

   Terrain legend
     .  plain     ,  road      f  forest    h  hill     m  mountain
     p  peak      ~  water     #  wall      W  ruins    B  bridge
     F  fort      T  throne    G  gate      V  village  H  house
     E  escape    C  cache
   ============================================================= */
(function (FE) {
  'use strict';

  /* ---------- The recruitable cast -------------------------------- */
  FE.ROSTER = {
    aleryn: {
      id: 'aleryn', name: 'Aleryn', cls: 'lord', level: 1, team: 'player', hair: '#c8a24a',
      title: 'Heir of Vale', lord: true,
      desc: 'Heir to a march that no longer exists. Carries the Rapier of her house.',
      bases: { hp: 2, spd: 1 }, growths: { hp: 5, str: 5, lck: 5 },
      items: ['rapier', 'vulnerary']
    },
    roderic: {
      id: 'roderic', name: 'Roderic', cls: 'cavalier', level: 3, team: 'player', hair: '#4a3a2a',
      title: 'Knight of Vale',
      desc: 'Sworn to the house since Aleryn could hold a sword. Grumbles, never leaves.',
      items: ['iron_lance', 'iron_sword', 'vulnerary']
    },
    garrick: {
      id: 'garrick', name: 'Garrick', cls: 'fighter', level: 2, team: 'player', hair: '#8a3a2a',
      title: 'Woodsman',
      desc: 'Cut trees for a living, cuts other things now. Enormous, cheerful, slow.',
      items: ['iron_axe', 'vulnerary']
    },
    kestrel: {
      id: 'kestrel', name: 'Kestrel', cls: 'archer', level: 3, team: 'player', hair: '#2a2a35',
      title: 'Poacher',
      desc: 'Hunted the old lord\'s deer for years. Never once got caught.',
      items: ['iron_bow', 'vulnerary']
    },
    mira: {
      id: 'mira', name: 'Mira', cls: 'cleric', level: 2, team: 'player', hair: '#d8d0c0',
      title: 'Acolyte',
      desc: 'Sent from the abbey to tend the wounded. Rather more stubborn than sent.',
      items: ['heal', 'vulnerary']
    },
    isolde: {
      id: 'isolde', name: 'Isolde', cls: 'mage', level: 4, team: 'player', hair: '#6a3a6a',
      title: 'Hedge Scholar',
      desc: 'Studied fire because the other elements were spoken for.',
      items: ['fire', 'vulnerary']
    },
    bern: {
      id: 'bern', name: 'Bern', cls: 'knight', level: 6, team: 'player', hair: '#3a3a3a',
      title: 'Gate Warden',
      desc: 'Held the Iron Gate for eleven years. Will not say for whom any more.',
      items: ['steel_lance', 'javelin']
    },
    elowen: {
      id: 'elowen', name: 'Elowen', cls: 'pegasus', level: 5, team: 'player', hair: '#e0e0f0',
      title: 'Wind Rider',
      desc: 'Flew south on an errand and found a war under her. Stayed anyway.',
      items: ['javelin', 'iron_lance', 'vulnerary']
    },
    sable: {
      id: 'sable', name: 'Sable', cls: 'thief', level: 4, team: 'player', hair: '#20303a',
      title: 'Cutpurse',
      desc: 'Claims to be reformed. Claims a great many things.',
      items: ['iron_sword', 'vulnerary', 'elixir']
    },
    hallow: {
      id: 'hallow', name: 'Hallow', cls: 'myrmidon', level: 7, team: 'player', hair: '#1a1a22',
      title: 'Wandering Blade',
      desc: 'Owes a debt to someone long dead and is paying it to strangers.',
      items: ['killing_edge', 'iron_sword']
    },
    tam: {
      id: 'tam', name: 'Tam', cls: 'mercenary', level: 6, team: 'player', hair: '#a06a3a',
      title: 'Free Sword',
      desc: 'Paid in advance, which he considers binding.',
      items: ['steel_sword', 'vulnerary']
    }
  };

  /* ---------- Chapters --------------------------------------------- */
  FE.CHAPTERS = [
    /* ============================ PROLOGUE ============================ */
    {
      id: 'p',
      title: 'Prologue',
      name: 'Smoke Over Vale',
      objective: { type: 'rout' },
      intro: [
        'The march of Vale burned for a day and a night.',
        'Aleryn came back to it with two men and no army at all.',
        'Brigands were still picking through what the fire had left.',
        '',
        'OBJECTIVE: Defeat every enemy.',
        'If Aleryn falls, the chapter is lost.'
      ],
      outro: [
        'The last of them ran into the trees and did not come back.',
        'Roderic wiped his lance clean. "That was the easy part, my lady."'
      ],
      tiles: [
        '###ff.........ff',
        '#ff.f...,,.....f',
        'f...V...,..f....',
        'f.......,...ff..',
        '..ff,,,,,,,,....',
        '....,.......f...',
        'f...,..hh...f..f',
        'ff..,.hhh.....ff',
        'f...,..hh...f..f',
        '#f..,......ff..#',
        '##ff.......###.#'
      ],
      deploy: [[3, 9], [4, 9], [2, 8], [5, 9], [3, 8]],
      forced: ['aleryn', 'roderic', 'garrick'],
      units: [
        { cls: 'brigand', x: 8, y: 2, level: 2, items: ['iron_axe'], ai: 'charge' },
        { cls: 'brigand', x: 11, y: 4, level: 2, items: ['iron_axe'], ai: 'charge' },
        { cls: 'brigand', x: 13, y: 7, level: 3, items: ['iron_axe', 'vulnerary'], ai: 'guard', aggro: 5 },
        { cls: 'brigand', x: 9, y: 8, level: 2, items: ['hand_axe'], ai: 'guard', aggro: 4 },
        { cls: 'brigand', name: 'Hark', title: 'Raid Leader', x: 14, y: 2, level: 4, boss: true,
          items: ['steel_axe', 'vulnerary'], ai: 'guard', aggro: 6, drops: 'steel_axe' }
      ],
      villages: {
        '4,2': { text: 'An old woman presses a bottle into Aleryn\'s hands. "For the road, my lady."', item: 'vulnerary' }
      }
    },

    /* ============================ CHAPTER 1 =========================== */
    {
      id: '1',
      title: 'Chapter 1',
      name: 'The Long Road South',
      objective: { type: 'boss' },
      intro: [
        'South, then. South to the abbey, where the roads still hold.',
        'The company that burned Vale had not gone far.',
        '',
        'OBJECTIVE: Defeat the commander.',
        'A hunter watches the road from the woods — someone should talk to her.'
      ],
      outro: [
        'Kestrel lowered her bow. "That is one road open," she said. "There are four."'
      ],
      tiles: [
        '####..ff....ff....##',
        '##...ff.......ff...#',
        '#..V...,,,,,,,..f...',
        '...f..,......,..f..f',
        'f....,....hh..,....f',
        'f...,....hhhh..,...f',
        '...,....hhhh....,..f',
        '..,......hh......,..',
        '.,...ff.........F,..',
        ',...ff...,,,,,,,,,..',
        '...ff...,........C..',
        '..f....,.....ff..V..',
        '#f....,......ff....#'
      ],
      deploy: [[1, 10], [0, 9], [2, 11], [1, 11], [2, 10], [0, 10], [3, 12]],
      join: ['mira'],
      npcs: [
        { roster: 'kestrel', x: 6, y: 4, ai: 'hold',
          talk: { by: 'aleryn', text: [
            'KESTREL: You are the Vale girl.',
            'ALERYN: I am what is left of her, yes.',
            'KESTREL: Then you will want someone who can count men before you meet them.' ] } }
      ],
      units: [
        { cls: 'brigand', x: 11, y: 2, level: 3, items: ['iron_axe'], ai: 'charge' },
        { cls: 'brigand', x: 14, y: 3, level: 3, items: ['hand_axe'], ai: 'charge' },
        { cls: 'soldier', x: 16, y: 5, level: 4, items: ['iron_lance'], ai: 'guard', aggro: 5 },
        { cls: 'soldier', x: 15, y: 8, level: 3, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'archer', x: 17, y: 7, level: 3, items: ['iron_bow'], ai: 'guard', aggro: 5 },
        { cls: 'brigand', x: 12, y: 10, level: 4, items: ['iron_axe', 'vulnerary'], ai: 'guard', aggro: 5 },
        { cls: 'bandit', name: 'Corwen', title: 'Free Company', x: 17, y: 2, level: 2, boss: true,
          items: ['steel_axe', 'hand_axe'], ai: 'boss', aggro: 3, drops: 'knight_crest' }
      ],
      villages: {
        '3,2': { text: 'A blacksmith with nothing left to guard hands over a slender blade.', item: 'slim_sword' },
        '17,11': { text: 'The miller has been hiding this since the company came through.', item: 'steel_lance' }
      },
      chests: { '17,10': { item: 'angelic_robe' } }
    },

    /* ============================ CHAPTER 2 =========================== */
    {
      id: '2',
      title: 'Chapter 2',
      name: 'Fords of the Aelin',
      objective: { type: 'rout' },
      intro: [
        'The Aelin runs fast and cold and there are exactly two ways across it.',
        'Both of them were being watched.',
        '',
        'OBJECTIVE: Defeat every enemy.',
        'Only fliers cross deep water. Everyone else takes a bridge.'
      ],
      outro: [
        'ISOLDE: "Two bridges, and they split their force between them. Amateurs."',
        'RODERIC: "They had us outnumbered three to one."',
        'ISOLDE: "Amateurs with numbers."'
      ],
      tiles: [
        '#ff....ff....ff....#',
        'f...H....f......f..#',
        '..f...,,,,,,,,,,...V',
        '....,,....,,....,,..',
        '..f,,.~~~BB~~~.,,...',
        '...,.~~~~BB~~~~.,...',
        '..,.~~~~~BB~~~~~.,..',
        '.,.~~~~~~BB~~~~~~.,.',
        ',,,~~~~~~BB~~~~~~,,,',
        '...f~~~~~BB~~~~~f...',
        '..f...~~~BB~~~...f..',
        '.f....,,,,,,,,....f.',
        '#f..F..,,,,,,..F..f#'
      ],
      deploy: [[7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [8, 11], [10, 11], [6, 12]],
      join: ['isolde'],
      units: [
        { cls: 'soldier', x: 9, y: 3, level: 5, items: ['iron_lance'], ai: 'guard', aggro: 3 },
        { cls: 'soldier', x: 10, y: 3, level: 5, items: ['iron_lance'], ai: 'guard', aggro: 3 },
        { cls: 'archer', x: 8, y: 2, level: 5, items: ['iron_bow'], ai: 'guard', aggro: 6 },
        { cls: 'archer', x: 11, y: 2, level: 4, items: ['iron_bow'], ai: 'guard', aggro: 6 },
        { cls: 'brigand', x: 3, y: 4, level: 5, items: ['hand_axe'], ai: 'charge' },
        { cls: 'brigand', x: 16, y: 4, level: 5, items: ['hand_axe'], ai: 'charge' },
        { cls: 'mercenary', x: 6, y: 2, level: 4, items: ['iron_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 14, y: 2, level: 4, items: ['iron_sword'], ai: 'charge' },
        { cls: 'priest', x: 10, y: 1, level: 5, items: ['heal'], ai: 'heal' },
        { cls: 'shaman', name: 'Velm', title: 'River Warden', x: 8, y: 1, level: 8, boss: true,
          items: ['flux', 'vulnerary'], ai: 'guard', aggro: 5, drops: 'guiding_ring' }
      ],
      villages: {
        '4,1': { text: 'A ferryman who is out of work now. "Take this. It floats, which is more than my boat does."', item: 'javelin' },
        '19,2': { text: 'A shrine keeper presses a cold blue phial into your hand.', item: 'speedwing' }
      },
      reinforcements: [
        { turn: 4, units: [
          { cls: 'brigand', x: 0, y: 8, level: 5, items: ['iron_axe'], ai: 'charge' },
          { cls: 'brigand', x: 19, y: 8, level: 5, items: ['iron_axe'], ai: 'charge' }
        ], text: 'Axes on both banks — they were waiting for us to commit.' }
      ]
    },

    /* ============================ CHAPTER 3 =========================== */
    {
      id: '3',
      title: 'Chapter 3',
      name: 'The Iron Gate',
      objective: { type: 'seize' },
      intro: [
        'The Iron Gate has never been taken by assault. It has been opened from inside,',
        'twice, by men who were tired of who they were holding it for.',
        '',
        'OBJECTIVE: Seize the gate.',
        'Armour turns blades. Hammers and armourslayers do not care about armour.'
      ],
      outro: [
        'BERN: "Eleven years I held this gate."',
        'ALERYN: "And you opened it in an afternoon."',
        'BERN: "I held it for the march of Vale. You are the march of Vale."'
      ],
      tiles: [
        '####..###G###..#####',
        '###...##...##...####',
        '##..F..#...#..F..###',
        '#...,...,.,...,....#',
        '#..,,,..,.,..,,,,..#',
        '#.,...,.,.,.,....,.#',
        '#,..f.,..,..,.f...,#',
        '#,...,,..,..,,,...,#',
        '#,..C,..,,,,..,C..,#',
        '#,,,,,,,,,,,,,,,,,,#',
        '#..f....,,,,....f..#',
        '#V.f...,,..,,...f.V#',
        '####....,,,,....####'
      ],
      deploy: [[8, 12], [9, 12], [10, 12], [11, 12], [8, 11], [11, 11], [7, 12], [12, 12]],
      npcs: [
        { roster: 'bern', x: 9, y: 3, ai: 'hold',
          talk: { by: 'aleryn', text: [
            'BERN: Halt. Name yourself.',
            'ALERYN: Aleryn of Vale.',
            'BERN: ...Vale pays my wages. Vale has paid nothing in three months.',
            'ALERYN: Vale has nothing. Only me.',
            'BERN: That will do.' ] } }
      ],
      units: [
        { cls: 'knight', x: 7, y: 8, level: 7, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 12, y: 8, level: 7, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 9, y: 6, level: 8, items: ['javelin'], ai: 'guard', aggro: 5 },
        { cls: 'knight', x: 10, y: 6, level: 8, items: ['iron_lance'], ai: 'guard', aggro: 5 },
        { cls: 'archer', x: 4, y: 2, level: 7, items: ['steel_bow'], ai: 'guard', aggro: 7 },
        { cls: 'archer', x: 14, y: 2, level: 7, items: ['steel_bow'], ai: 'guard', aggro: 7 },
        { cls: 'mage', x: 8, y: 4, level: 6, items: ['fire'], ai: 'guard', aggro: 6 },
        { cls: 'mercenary', x: 11, y: 4, level: 8, items: ['steel_sword'], ai: 'charge' },
        { cls: 'priest', x: 10, y: 1, level: 7, items: ['mend'], ai: 'heal' },
        { cls: 'general', name: 'Osric', title: 'Castellan', x: 9, y: 0, level: 3, boss: true,
          items: ['steel_lance', 'javelin'], ai: 'boss', drops: 'hero_crest' }
      ],
      villages: {
        '1,11': { text: 'A smith in the gate-town: "Take the hammer. It only has one use, but it is a good one."', item: 'hammer' },
        '18,11': { text: 'An armourer hands over a blade with a wicked notched edge.', item: 'armorslayer' }
      },
      chests: {
        '4,8': { item: 'killer_lance' },
        '15,8': { item: 'dragonshield' }
      }
    },

    /* ============================ CHAPTER 4 =========================== */
    {
      id: '4',
      title: 'Chapter 4',
      name: 'Windward Pass',
      objective: { type: 'survive', turns: 9 },
      intro: [
        'The pass is the only road north that wyverns cannot simply fly around.',
        'Which is to say: they can fly over it, and they did.',
        '',
        'OBJECTIVE: Survive 9 turns.',
        'Forts heal. Bows bring fliers down. Hold the high ground.'
      ],
      outro: [
        'ELOWEN: "They will come again in force."',
        'ALERYN: "Then we should not be here when they do."'
      ],
      tiles: [
        '#mmmpp####ppmmmm####',
        '#mm..mmm..mm..mmm..#',
        'mm.hh..mm....hh..mm#',
        'm..hh...,,,,..hh...#',
        'm.f...,,....,,...f.m',
        'm....,...FF...,....m',
        'm.hh,....FF....,hh.m',
        'm..,......,.....,..m',
        'm,,....hh..hh....,,m',
        'm....f.hh..hh.f....m',
        'mm..f..,,,,,,..f..mm',
        '#mm...,......,...mm#',
        '####mm.......mm#####'
      ],
      deploy: [[9, 5], [10, 5], [9, 6], [10, 6], [8, 6], [11, 6], [9, 7], [11, 5], [8, 5]],
      npcs: [
        { roster: 'elowen', x: 6, y: 9, ai: 'hold',
          talk: { by: 'aleryn', text: [
            'ELOWEN: You are holding the middle of a pass with nine people.',
            'ALERYN: Eight. One of them is a horse.',
            'ELOWEN: ...Move over.' ] } }
      ],
      units: [
        { cls: 'wyvern', x: 3, y: 1, level: 7, items: ['iron_lance'], ai: 'charge' },
        { cls: 'wyvern', x: 16, y: 1, level: 7, items: ['iron_lance'], ai: 'charge' },
        { cls: 'archer', x: 9, y: 1, level: 8, items: ['steel_bow'], ai: 'guard', aggro: 6 },
        { cls: 'soldier', x: 6, y: 3, level: 9, items: ['steel_lance'], ai: 'charge' },
        { cls: 'soldier', x: 13, y: 3, level: 9, items: ['steel_lance'], ai: 'charge' },
        { cls: 'mercenary', x: 2, y: 8, level: 9, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 17, y: 8, level: 9, items: ['steel_sword'], ai: 'charge' }
      ],
      reinforcements: [
        { turn: 3, units: [
          { cls: 'wyvern', x: 1, y: 11, level: 8, items: ['javelin'], ai: 'charge' },
          { cls: 'wyvern', x: 18, y: 11, level: 8, items: ['javelin'], ai: 'charge' }
        ], text: 'Wings below us as well. They mean to close the pass at both ends.' },
        { turn: 5, units: [
          { cls: 'brigand', x: 9, y: 12, level: 8, items: ['steel_axe'], ai: 'charge' },
          { cls: 'brigand', x: 10, y: 12, level: 8, items: ['hand_axe'], ai: 'charge' },
          { cls: 'shaman', x: 12, y: 1, level: 9, items: ['flux'], ai: 'charge' }
        ], text: 'More of them, from the south road.' },
        { turn: 7, units: [
          { cls: 'wyvern', name: 'Draeg', title: 'Sky Captain', x: 10, y: 0, level: 3, boss: true,
            items: ['killer_lance', 'vulnerary'], ai: 'charge', drops: 'elysian_whip' },
          { cls: 'wyvern', x: 11, y: 0, level: 9, items: ['iron_lance'], ai: 'charge' }
        ], text: 'A captain\'s banner. Hold two more turns.' }
      ],
      villages: {}
    },

    /* ============================ CHAPTER 5 =========================== */
    {
      id: '5',
      title: 'Chapter 5',
      name: 'Castle Varen',
      objective: { type: 'seize' },
      intro: [
        'Varen took Vale because Vale was small and quiet and nobody would come.',
        'Somebody came.',
        '',
        'OBJECTIVE: Seize the throne.',
        'This is the last chapter. Spend everything.'
      ],
      outro: [
        'The throne room was very quiet afterwards.',
        '',
        'ALERYN: "It does not give anything back, does it."',
        'RODERIC: "No, my lady. It only stops it getting worse."',
        '',
        '— THE END —',
        '',
        'Thank you for playing.'
      ],
      tiles: [
        '#######..TT..#######',
        '######..####..######',
        '#####.F.####.F.#####',
        '####...,,##,,...####',
        '###.C..,,##,,..C.###',
        '##...,,,,,##,,,,,.##',
        '#..,,,......,,,....#',
        '#,,.....,,,,,.....,#',
        '#,,,,,,..,,,,..,,,,#',
        '##...,,,,,,,,,,...##',
        '##f..,,,,,,,,,,..f##',
        '#ff...,,,,,,,,...ff#',
        '####...,,,,,,...####'
      ],
      deploy: [[8, 12], [9, 12], [10, 12], [7, 12], [11, 12], [8, 11], [10, 11], [6, 11], [12, 11], [9, 11]],
      join: ['hallow', 'tam', 'sable'],
      units: [
        { cls: 'knight', x: 8, y: 8, level: 12, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 10, y: 8, level: 12, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'mercenary', x: 5, y: 7, level: 12, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 14, y: 7, level: 12, items: ['steel_sword'], ai: 'charge' },
        { cls: 'archer', x: 5, y: 2, level: 11, items: ['killer_bow'], ai: 'guard', aggro: 7 },
        { cls: 'archer', x: 13, y: 2, level: 11, items: ['killer_bow'], ai: 'guard', aggro: 7 },
        { cls: 'mage', x: 7, y: 5, level: 11, items: ['elfire'], ai: 'guard', aggro: 6 },
        { cls: 'shaman', x: 12, y: 5, level: 11, items: ['flux'], ai: 'guard', aggro: 6 },
        { cls: 'wyvern', x: 3, y: 6, level: 12, items: ['javelin'], ai: 'charge' },
        { cls: 'wyvern', x: 16, y: 6, level: 12, items: ['javelin'], ai: 'charge' },
        { cls: 'priest', x: 7, y: 2, level: 10, items: ['mend'], ai: 'heal' },
        { cls: 'swordmaster', x: 12, y: 3, level: 6, items: ['steel_sword', 'vulnerary'],
          ai: 'guard', aggro: 5, name: 'Ysolt', title: 'Sword of Varen', drops: 'earth_seal' },
        { cls: 'general', name: 'Varen', title: 'The Usurper', x: 9, y: 0, level: 10, boss: true,
          items: ['silver_lance', 'javelin', 'elixir'], ai: 'boss', drops: 'silver_lance' }
      ],
      chests: {
        '4,4': { item: 'silver_sword' },
        '15,4': { item: 'elixir' }
      },
      villages: {}
    }
  ];

  /* Padding guard: a ragged map row would break the renderer silently. */
  FE.CHAPTERS.forEach(function (ch) {
    var w = 0;
    ch.tiles.forEach(function (r) { w = Math.max(w, r.length); });
    ch.tiles = ch.tiles.map(function (r) {
      while (r.length < w) r += '#';
      return r;
    });
  });
})(window.FE);

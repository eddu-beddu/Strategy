/* =============================================================
   maps.js — The campaign: cast and chapters.

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
      desc: 'Heir to a march that no longer exists. Carries the Rapier of her house and very little else.',
      bases: { hp: 2, spd: 1 }, growths: { hp: 5, str: 5, lck: 5 },
      items: ['rapier', 'vulnerary']
    },
    roderic: {
      id: 'roderic', name: 'Roderic', cls: 'cavalier', level: 3, team: 'player', hair: '#4a3a2a',
      title: 'Knight of Vale',
      desc: 'Sworn to the house since Aleryn could hold a sword. Grumbles constantly, never leaves.',
      items: ['iron_lance', 'iron_sword', 'vulnerary']
    },
    garrick: {
      id: 'garrick', name: 'Garrick', cls: 'fighter', level: 2, team: 'player', hair: '#8a3a2a',
      title: 'Woodsman',
      desc: 'Cut trees for nineteen years. Cuts other things now, and is not happy about the change.',
      items: ['iron_axe', 'vulnerary']
    },
    kestrel: {
      id: 'kestrel', name: 'Kestrel', cls: 'archer', level: 3, team: 'player', hair: '#2a2a35',
      title: 'Poacher',
      desc: "Took the old lord's deer for years and never once got caught. Counts men before she meets them.",
      items: ['iron_bow', 'vulnerary']
    },
    mira: {
      id: 'mira', name: 'Mira', cls: 'cleric', level: 2, team: 'player', hair: '#d8d0c0',
      title: 'Acolyte of Saint Ede',
      desc: 'Sent from the abbey to tend the wounded. Rather more stubborn than the abbey intended.',
      items: ['heal', 'vulnerary']
    },
    isolde: {
      id: 'isolde', name: 'Isolde', cls: 'mage', level: 4, team: 'player', hair: '#6a3a6a',
      title: 'Hedge Scholar',
      desc: 'Studied fire because the other elements were spoken for. Reads seals better than anyone living.',
      items: ['fire', 'vulnerary']
    },
    sable: {
      id: 'sable', name: 'Sable', cls: 'thief', level: 4, team: 'player', hair: '#20303a',
      title: 'Cutpurse',
      desc: 'Claims to be reformed. Claims a great many things. Can copy a document in the dark.',
      items: ['iron_sword', 'vulnerary', 'elixir']
    },
    bern: {
      id: 'bern', name: 'Bern', cls: 'knight', level: 6, team: 'player', hair: '#3a3a3a',
      title: 'Gate Warden',
      desc: 'Held the Iron Gate for eleven years. Will not say for whom any more, and keeps the ledger.',
      items: ['steel_lance', 'javelin']
    },
    tam: {
      id: 'tam', name: 'Tam', cls: 'mercenary', level: 6, team: 'player', hair: '#a06a3a',
      title: 'Free Sword',
      desc: 'Paid in advance, which he considers binding. Does not pretend it is anything nobler.',
      items: ['steel_sword', 'vulnerary']
    },
    elowen: {
      id: 'elowen', name: 'Elowen', cls: 'pegasus', level: 7, team: 'player', hair: '#e0e0f0',
      title: 'Wind Rider',
      desc: 'Flew south carrying a letter that said the roads were safe. Stayed to make one of them true.',
      items: ['javelin', 'iron_lance', 'vulnerary']
    },
    hallow: {
      id: 'hallow', name: 'Hallow', cls: 'myrmidon', level: 9, team: 'player', hair: '#1a1a22',
      title: 'Wandering Blade',
      desc: 'Owes a debt to someone long dead and has been paying it to strangers ever since.',
      items: ['killing_edge', 'iron_sword']
    }
  };

  /* ---------- Chapters --------------------------------------------- */
  FE.CHAPTERS = [
    /* ======================= 0 — PROLOGUE ========================= */
    {
      id: 'p',
      title: 'Prologue',
      name: 'Smoke Over Vale',
      objective: { type: 'rout' },
      reward: 600,
      intro: [
        'The march of Vale burned for a day and a night.',
        'Aleryn came back to it with two men and no army at all.',
        'Men were still in the ruins, going through what the fire had left.',
        '',
        'RODERIC: Bandits, my lady. Only bandits.',
        'ALERYN: Then we will start with bandits.',
        '',
        'OBJECTIVE: defeat every enemy. If Aleryn falls, the chapter is lost.'
      ],
      outro: [
        'The last of them ran into the trees and did not come back.',
        '',
        'GARRICK: They left the grain.',
        'RODERIC: What?',
        'GARRICK: The granary. It is burnt, not emptied. Bandits do not burn a granary.',
        'RODERIC: ...No. They do not.'
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
          items: ['steel_axe', 'vulnerary'], ai: 'guard', aggro: 6, drops: 'steel_axe',
          quote: ['HARK: We were told the place would be empty!', 'ALERYN: Told by whom?', 'HARK: ...By the man with the money. Who else.'] }
      ],
      villages: {
        '4,2': { text: 'An old woman presses a bottle into Aleryn’s hands. "For the road, my lady. There is nothing here now."', item: 'vulnerary' }
      }
    },

    /* ======================= 1 — THE LONG ROAD ===================== */
    {
      id: '1',
      title: 'Chapter 1',
      name: 'The Long Road South',
      objective: { type: 'boss' },
      reward: 900,
      intro: [
        'South, then. South to the abbey, where the roads still hold.',
        'The men who burned Vale had not gone far, and they were not travelling like bandits.',
        'They were travelling like a company: in order, with a baggage train, unhurried.',
        '',
        'OBJECTIVE: defeat the commander.',
        'A hunter is watching the road from the woods. Someone should talk to her.'
      ],
      outro: [
        'Kestrel lowered her bow. "That is one road open," she said. "There are four."',
        '',
        'Corwen had a strongbox. In it: a payment order for two hundred crowns,',
        'unsigned, and a broken seal in red wax that no free company should have owned.'
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
            'KESTREL: Your father hanged men for taking his deer. I took four hundred.',
            'ALERYN: My father is ash. Take what you like.',
            'KESTREL: ...Then you will want someone who can count men before you meet them.' ] } }
      ],
      units: [
        { cls: 'brigand', x: 11, y: 2, level: 3, items: ['iron_axe'], ai: 'charge' },
        { cls: 'brigand', x: 14, y: 3, level: 3, items: ['hand_axe'], ai: 'charge' },
        { cls: 'soldier', x: 16, y: 5, level: 4, items: ['iron_lance'], ai: 'guard', aggro: 5 },
        { cls: 'soldier', x: 15, y: 8, level: 3, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'archer', x: 17, y: 7, level: 3, items: ['iron_bow'], ai: 'guard', aggro: 5 },
        { cls: 'brigand', x: 12, y: 10, level: 4, items: ['iron_axe', 'vulnerary'], ai: 'guard', aggro: 5 },
        { cls: 'bandit', name: 'Corwen', title: 'Free Company', x: 17, y: 2, level: 2, boss: true,
          items: ['steel_axe', 'hand_axe'], ai: 'boss', aggro: 3, drops: 'knight_crest',
          quote: ['CORWEN: I took a contract. It was witnessed and it was legal.',
                  'ALERYN: You burned a granary.',
                  'CORWEN: I burned what I was told to burn. Read the order, girl. Then go and shout at whoever sealed it.'] }
      ],
      villages: {
        '3,2': { text: 'A blacksmith with nothing left to guard hands over a slender blade.', item: 'slim_sword' },
        '17,11': { text: 'The miller has been hiding this since the company came through.', item: 'steel_lance' }
      },
      chests: { '17,10': { item: 'angelic_robe' } }
    },

    /* ======================= 2 — THE FORDS ========================= */
    {
      id: '2',
      title: 'Chapter 2',
      name: 'Fords of the Aelin',
      objective: { type: 'rout' },
      reward: 1100,
      intro: [
        'ISOLDE: The wax is crown wax. Not a copy, not a forgery — the colour is wrong for a forgery.',
        'ALERYN: Say the rest of it.',
        'ISOLDE: Somebody in the capital paid a free company to burn your march. That is the rest of it.',
        '',
        'The Aelin runs fast and cold, and there are exactly two ways across.',
        'Both of them were being watched by men in livery.',
        '',
        'OBJECTIVE: defeat every enemy. Only fliers cross deep water; everyone else takes a bridge.'
      ],
      outro: [
        'VELM, dying: "The March was forfeit. It was signed over. Go and look at the ledger if you—"',
        '',
        'RODERIC: A march cannot be forfeit. Not by a company, not by a warden.',
        'ISOLDE: No. A march can only be signed away by the lord who holds it.',
        'ALERYN: ...Say that again.',
        'ISOLDE: I would rather not.'
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
          items: ['flux', 'vulnerary'], ai: 'guard', aggro: 5, drops: 'guiding_ring',
          quote: ['VELM: You have no standing here. The March of Vale is forfeit.',
                  'ALERYN: Forfeit to whom?',
                  'VELM: To whoever held the pen. It was not me, girl, and it was not you.'] }
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

    /* ======================= 3 — THE ABBEY ========================= */
    {
      id: '3',
      title: 'Chapter 3',
      name: 'The Abbey of Saint Ede',
      objective: { type: 'escape' },
      reward: 1300,
      intro: [
        'The abbey took them in because Mira asked, and because abbeys do.',
        'By the second night there were banners on the north road: not a company this time,',
        'but a column, with a herald, riding under the crown.',
        '',
        'MIRA: They will not burn an abbey.',
        'KESTREL: They burned a granary.',
        '',
        'OBJECTIVE: get Aleryn to the escape point in the south-west.',
        'Any unit standing on an escape tile can leave. When Aleryn goes, the chapter ends.'
      ],
      outro: [
        'They came out of the abbey wood at dawn with the smoke behind them and nobody dead.',
        '',
        'SABLE: You are being hunted by your own crown, you have no land, no money and no name.',
        'ALERYN: Yes.',
        'SABLE: Splendid. I am extremely good at being all of those things.'
      ],
      tiles: [
        '#########GG#########',
        '#####..##..##..#####',
        '####.F.##..##.F.####',
        '###.....,,,,.....###',
        '##...,,,,,,,,,,...##',
        '#..,,,,......,,,,..#',
        '#.f..,,,,,,,,,,..f.#',
        '#..f...,,,,,,...f..#',
        '#....h...,,...h....#',
        '#f..hh..,,,,..hh..f#',
        '#..f....,,,,....f..#',
        '#EE.....,,,,.....ff#',
        '#EE..............###'
      ],
      deploy: [[4, 3], [5, 3], [6, 3], [3, 3], [7, 3], [4, 2], [6, 2], [13, 3], [14, 3]],
      npcs: [
        { roster: 'sable', x: 14, y: 2, ai: 'hold',
          talk: { by: 'aleryn', text: [
            'SABLE: Before you ask — I was in the cellar for the wine, not the plate.',
            'ALERYN: I do not care what you were in the cellar for.',
            'SABLE: That is refreshing. Most people care enormously.',
            'ALERYN: There is a column on the north road and I have eight people.',
            'SABLE: Nine.' ] } }
      ],
      units: [
        { cls: 'soldier', x: 9, y: 0, level: 7, items: ['steel_lance'], ai: 'charge' },
        { cls: 'soldier', x: 10, y: 0, level: 7, items: ['iron_lance'], ai: 'charge' },
        { cls: 'mercenary', x: 5, y: 1, level: 6, items: ['iron_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 14, y: 1, level: 6, items: ['iron_sword'], ai: 'charge' },
        { cls: 'archer', x: 5, y: 2, level: 6, items: ['iron_bow'], ai: 'guard', aggro: 6 },
        { cls: 'cavalier', x: 2, y: 8, level: 7, items: ['iron_lance', 'iron_sword'], ai: 'charge' },
        { cls: 'cavalier', x: 17, y: 8, level: 7, items: ['iron_lance'], ai: 'charge' },
        { cls: 'brigand', x: 18, y: 6, level: 7, items: ['hand_axe'], ai: 'charge' }
      ],
      reinforcements: [
        { turn: 2, units: [
          { cls: 'cavalier', x: 9, y: 0, level: 8, items: ['iron_lance'], ai: 'charge' },
          { cls: 'cavalier', x: 10, y: 0, level: 8, items: ['javelin'], ai: 'charge' }
        ], text: 'Horse through the gate. Do not let them pin you against the wall.' },
        { turn: 4, units: [
          { cls: 'soldier', x: 9, y: 0, level: 8, items: ['steel_lance'], ai: 'charge' },
          { cls: 'archer', x: 10, y: 0, level: 8, items: ['steel_bow'], ai: 'charge' }
        ], text: 'The column is still coming. It will not stop coming.' },
        { turn: 6, units: [
          { cls: 'cavalier', x: 9, y: 0, level: 9, items: ['steel_lance'], ai: 'charge' },
          { cls: 'cavalier', x: 10, y: 0, level: 9, items: ['javelin'], ai: 'charge' },
          { cls: 'mercenary', x: 1, y: 5, level: 9, items: ['steel_sword'], ai: 'charge' }
        ], text: 'Go. Whatever you are still doing here, stop doing it and go.' }
      ],
      villages: {}
    },

    /* ======================= 4 — THE IRON GATE ===================== */
    {
      id: '4',
      title: 'Chapter 4',
      name: 'The Iron Gate',
      objective: { type: 'seize' },
      reward: 1500,
      intro: [
        'The Iron Gate has never been taken by assault. It has been opened from inside, twice,',
        'by men who were tired of who they were holding it for.',
        'The ledger of the march is kept there. Aleryn wants the ledger more than she wants the gate.',
        '',
        'OBJECTIVE: seize the gate.',
        'Armour turns blades. Hammers and armourslayers do not care about armour.'
      ],
      outro: [
        'BERN: Eleven years I held this gate.',
        'ALERYN: And you opened it in an afternoon.',
        'BERN: I held it for the march of Vale. You are the march of Vale. Here is the ledger.',
        '',
        'The transfer was entered in a clear clerk’s hand, countersigned, and dated.',
        'It was dated eleven days before the raid.'
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
            'BERN: Three months ago the warrant on this gate changed hands. Nobody told me whose it is now.',
            'ALERYN: Then come and find out with me.' ] } }
      ],
      units: [
        { cls: 'knight', x: 7, y: 8, level: 8, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 12, y: 8, level: 8, items: ['iron_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 9, y: 6, level: 9, items: ['javelin'], ai: 'guard', aggro: 5 },
        { cls: 'knight', x: 10, y: 6, level: 9, items: ['iron_lance'], ai: 'guard', aggro: 5 },
        { cls: 'archer', x: 4, y: 2, level: 8, items: ['steel_bow'], ai: 'guard', aggro: 7 },
        { cls: 'archer', x: 14, y: 2, level: 8, items: ['steel_bow'], ai: 'guard', aggro: 7 },
        { cls: 'mage', x: 8, y: 4, level: 7, items: ['fire'], ai: 'guard', aggro: 6 },
        { cls: 'mercenary', x: 11, y: 4, level: 9, items: ['steel_sword'], ai: 'charge' },
        { cls: 'priest', x: 10, y: 1, level: 8, items: ['mend'], ai: 'heal' },
        { cls: 'general', name: 'Osric', title: 'Castellan', x: 9, y: 0, level: 4, boss: true,
          items: ['steel_lance', 'javelin'], ai: 'boss', drops: 'hero_crest',
          quote: ['OSRIC: You want the ledger. Everyone wants the ledger.',
                  'ALERYN: Then everyone has read it but me.',
                  'OSRIC: Aye. And not one of them enjoyed it.'] }
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

    /* ======================= 5 — THE LEDGER ROAD =================== */
    {
      id: '5',
      title: 'Chapter 5',
      name: 'The Ledger Road',
      objective: { type: 'defend', turns: 8, tile: [9, 6] },
      reward: 1700,
      intro: [
        'A ledger is only evidence while it exists. Sable can copy it — four copies, four riders,',
        'four directions — but copying takes time, and the crossroads chapel is the only shelter',
        'with a table in it.',
        '',
        'SABLE: Eight turns. Give me eight turns and it is in four places at once.',
        'RODERIC: And if they take the chapel?',
        'SABLE: Then it is in none.',
        '',
        'OBJECTIVE: hold the marked ground for 8 turns. If an enemy ends a turn on it, you lose.'
      ],
      outro: [
        'Four riders went out of the crossroads at dusk in four directions.',
        '',
        'SABLE: One of them will get through. Probably.',
        'ALERYN: Probably.',
        'SABLE: My lady, in my experience "probably" is the finest word in the language.'
      ],
      tiles: [
        '##ff...,,,,...ff####',
        '#f.....,,,,.....f..#',
        '#.......,,......f..#',
        '#..f....,,....f....#',
        '#.......,,.........#',
        ',,,,,,,,,,,,,,,,,,,,',
        ',,,,,,,,FFFF,,,,,,,,',
        ',,,,,,,,FFFF,,,,,,,,',
        ',,,,,,,,,,,,,,,,,,,,',
        '#.......,,.........#',
        '#..f....,,....f....#',
        '#f......,,......f..#',
        '##ff...,,,,...ff####'
      ],
      deploy: [[8, 5], [9, 5], [10, 5], [11, 5], [8, 8], [9, 8], [10, 8], [11, 8], [7, 6], [12, 7]],
      join: ['tam'],
      units: [
        { cls: 'soldier', x: 0, y: 5, level: 10, items: ['steel_lance'], ai: 'charge' },
        { cls: 'soldier', x: 19, y: 5, level: 10, items: ['steel_lance'], ai: 'charge' },
        { cls: 'mercenary', x: 0, y: 8, level: 10, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 19, y: 8, level: 10, items: ['steel_sword'], ai: 'charge' },
        { cls: 'archer', x: 9, y: 0, level: 9, items: ['steel_bow'], ai: 'charge' },
        { cls: 'archer', x: 10, y: 12, level: 9, items: ['steel_bow'], ai: 'charge' },
        { cls: 'cavalier', x: 8, y: 0, level: 10, items: ['javelin'], ai: 'charge' },
        { cls: 'cavalier', x: 9, y: 12, level: 10, items: ['javelin'], ai: 'charge' }
      ],
      reinforcements: [
        { turn: 2, units: [
          { cls: 'cavalier', x: 0, y: 5, level: 10, items: ['steel_lance'], ai: 'charge' },
          { cls: 'cavalier', x: 19, y: 5, level: 10, items: ['steel_lance'], ai: 'charge' }
        ], text: 'Horse on the east and west roads.' },
        { turn: 4, units: [
          { cls: 'wyvern', x: 2, y: 0, level: 10, items: ['javelin'], ai: 'charge' },
          { cls: 'wyvern', x: 15, y: 12, level: 10, items: ['javelin'], ai: 'charge' },
          { cls: 'mage', x: 10, y: 0, level: 9, items: ['elfire'], ai: 'charge' }
        ], text: 'Wings. They are not trying to pass us any more — they are trying to reach the table.' },
        { turn: 6, units: [
          { cls: 'brigand', x: 4, y: 12, level: 10, items: ['steel_axe'], ai: 'charge' },
          { cls: 'brigand', x: 15, y: 0, level: 10, items: ['steel_axe'], ai: 'charge' },
          { cls: 'knight', name: 'Dray', title: 'Road Marshal', x: 9, y: 0, level: 2, boss: true,
            items: ['killer_lance', 'vulnerary'], ai: 'charge', drops: 'orion_bolt' }
        ], text: 'A marshal’s pennant. Two more turns. Hold the table.' }
      ],
      villages: {}
    },

    /* ======================= 6 — WINDWARD PASS ===================== */
    {
      id: '6',
      title: 'Chapter 6',
      name: 'Windward Pass',
      objective: { type: 'survive', turns: 9 },
      reward: 1900,
      intro: [
        'The crown’s half of the bargain — the countersigned warrant — rides north with a',
        'courier, and the only road north that wyverns cannot simply fly around is the pass.',
        'Which is to say: they can fly over it, and they did.',
        '',
        'OBJECTIVE: survive 9 turns.',
        'Forts heal. Bows bring fliers down. Hold the high ground.'
      ],
      outro: [
        'ELOWEN: They will come again in force.',
        'ALERYN: Then we should not be here when they do.',
        '',
        'Draeg carried the countersigned warrant in a wax tube against his ribs.',
        'It was signed by a clerk of the treasury, and the clause was three lines long:',
        'the march of Vale, its mine and its road, in settlement of one debt.'
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
        { cls: 'wyvern', x: 3, y: 1, level: 9, items: ['iron_lance'], ai: 'charge' },
        { cls: 'wyvern', x: 16, y: 1, level: 9, items: ['iron_lance'], ai: 'charge' },
        { cls: 'archer', x: 9, y: 1, level: 10, items: ['steel_bow'], ai: 'guard', aggro: 6 },
        { cls: 'soldier', x: 6, y: 3, level: 11, items: ['steel_lance'], ai: 'charge' },
        { cls: 'soldier', x: 13, y: 3, level: 11, items: ['steel_lance'], ai: 'charge' },
        { cls: 'mercenary', x: 2, y: 8, level: 11, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 17, y: 8, level: 11, items: ['steel_sword'], ai: 'charge' }
      ],
      reinforcements: [
        { turn: 3, units: [
          { cls: 'wyvern', x: 1, y: 11, level: 10, items: ['javelin'], ai: 'charge' },
          { cls: 'wyvern', x: 18, y: 11, level: 10, items: ['javelin'], ai: 'charge' }
        ], text: 'Wings below us as well. They mean to close the pass at both ends.' },
        { turn: 5, units: [
          { cls: 'brigand', x: 9, y: 12, level: 10, items: ['steel_axe'], ai: 'charge' },
          { cls: 'brigand', x: 10, y: 12, level: 10, items: ['hand_axe'], ai: 'charge' },
          { cls: 'shaman', x: 12, y: 1, level: 11, items: ['flux'], ai: 'charge' }
        ], text: 'More of them, from the south road.' },
        { turn: 7, units: [
          { cls: 'wyvern', name: 'Draeg', title: 'Sky Captain', x: 10, y: 0, level: 4, boss: true,
            items: ['killer_lance', 'vulnerary'], ai: 'charge', drops: 'elysian_whip',
            quote: ['DRAEG: You are chasing a piece of paper.',
                    'ALERYN: I am chasing the name at the bottom of it.',
                    'DRAEG: Then I am sorry for you. It is a name you already know.'] },
          { cls: 'wyvern', x: 11, y: 0, level: 11, items: ['iron_lance'], ai: 'charge' }
        ], text: 'A captain’s banner. Hold two more turns.' }
      ],
      villages: {}
    },

    /* ======================= 7 — THE SILVER VEIN =================== */
    {
      id: '7',
      title: 'Chapter 7',
      name: 'The Silver Vein',
      objective: { type: 'rout' },
      reward: 2100,
      intro: [
        'The debt had a shape after all, and the shape was a hole in a hill.',
        'Vale’s silver ran out nine years ago. Aleryn’s father went on borrowing against it',
        'for six of those years, and then sold the march to a man who had not checked.',
        '',
        'ALERYN: He sold them for a mine that was already empty.',
        'ISOLDE: He sold them for the *idea* of a mine. It is worse, I am afraid.',
        '',
        'OBJECTIVE: defeat every enemy. Varen’s people are still digging for something that is not there.'
      ],
      outro: [
        'The lowest gallery had been worked out so thoroughly that the walls rang hollow.',
        'Somebody had kept a tally on the stone: nine years of nothing, scratched in fours.',
        '',
        'HALLOW: So it was for nothing.',
        'ALERYN: It was for a debt. That is not the same as nothing. It is worse than nothing.'
      ],
      tiles: [
        '####################',
        '#....,,,,,,,,,,....#',
        '#.##.,,##..##,,.##.#',
        '#.C..,,......,,..C.#',
        '#...,,,,,,,,,,,,...#',
        '#.##.,,,,,,,,,,.##.#',
        '#....,,,WWWW,,,....#',
        '#.##.,,,WWWW,,,.##.#',
        '#....,,,,,,,,,,....#',
        '#.##.,,......,,.##.#',
        '#.C..,,,,,,,,,,..C.#',
        '#....,,,,,,,,,,....#',
        '####################'
      ],
      deploy: [[8, 11], [9, 11], [10, 11], [11, 11], [7, 11], [12, 11], [8, 10], [11, 10], [6, 11], [13, 11]],
      npcs: [
        { roster: 'hallow', x: 16, y: 3, ai: 'hold',
          talk: { by: 'aleryn', text: [
            'HALLOW: You are the Vale heir.',
            'ALERYN: Are you going to tell me what my father did? Everyone else has.',
            'HALLOW: No. I was going to ask whether you intend to finish it.',
            'ALERYN: I intend to finish it.',
            'HALLOW: Good. Then I will come, and we can both stop explaining ourselves.' ] } }
      ],
      units: [
        { cls: 'knight', x: 8, y: 8, level: 12, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 11, y: 8, level: 12, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'mercenary', x: 6, y: 5, level: 12, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 13, y: 5, level: 12, items: ['steel_sword'], ai: 'charge' },
        { cls: 'archer', x: 5, y: 1, level: 12, items: ['killer_bow'], ai: 'guard', aggro: 7 },
        { cls: 'archer', x: 14, y: 1, level: 12, items: ['steel_bow'], ai: 'guard', aggro: 7 },
        { cls: 'brigand', x: 6, y: 9, level: 12, items: ['steel_axe'], ai: 'charge' },
        { cls: 'brigand', x: 13, y: 9, level: 12, items: ['hand_axe'], ai: 'charge' },
        { cls: 'priest', x: 9, y: 4, level: 11, items: ['mend'], ai: 'heal' },
        { cls: 'shaman', x: 10, y: 4, level: 12, items: ['flux'], ai: 'guard', aggro: 6 },
        { cls: 'shaman', name: 'Ossen', title: 'Mine Warden', x: 9, y: 6, level: 5, boss: true,
          items: ['nosferatu', 'flux', 'elixir'], ai: 'boss', drops: 'fell_contract',
          quote: ['OSSEN: Nine years. Nine years of digging a hill that was already dead.',
                  'ALERYN: Then stop digging.',
                  'OSSEN: I am paid by the month, my lady. Nobody is paid to stop.'] }
      ],
      chests: {
        '2,3': { item: 'earth_seal' },
        '17,3': { item: 'silver_bow' },
        '2,10': { item: 'talisman' },
        '17,10': { item: 'secret_book' }
      },
      reinforcements: [
        { turn: 5, units: [
          { cls: 'soldier', x: 1, y: 1, level: 12, items: ['steel_lance'], ai: 'charge' },
          { cls: 'soldier', x: 18, y: 1, level: 12, items: ['steel_lance'], ai: 'charge' }
        ], text: 'Men coming down the upper gallery.' }
      ],
      villages: {}
    },

    /* ======================= 8 — CASTLE VAREN ====================== */
    {
      id: '8',
      title: 'Chapter 8',
      name: 'Castle Varen',
      objective: { type: 'seize' },
      reward: 0,
      intro: [
        'Varen bought the march legally, from a desperate man, with a warrant the crown countersigned.',
        'There is no court in the realm where Aleryn wins this.',
        '',
        'RODERIC: If we do this you are an outlaw by nightfall.',
        'ALERYN: If we do not do this, I am an heir to nothing, legally, for the rest of my life.',
        'RODERIC: ...Yes, my lady. I only wanted it said out loud once.',
        '',
        'OBJECTIVE: seize the throne. This is the last chapter. Spend everything.'
      ],
      outro: [
        'VAREN, at the end: "I did not steal it. I *bought* it. Do you understand the difference?"',
        'ALERYN: "I understand it perfectly. It is the only part of this I understand."',
        '',
        'The throne room was very quiet afterwards.',
        '',
        'ALERYN: It does not give anything back, does it.',
        'RODERIC: No, my lady. It only stops it getting worse.'
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
      units: [
        { cls: 'knight', x: 8, y: 8, level: 14, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'knight', x: 10, y: 8, level: 14, items: ['steel_lance'], ai: 'guard', aggro: 4 },
        { cls: 'mercenary', x: 5, y: 7, level: 14, items: ['steel_sword'], ai: 'charge' },
        { cls: 'mercenary', x: 14, y: 7, level: 14, items: ['steel_sword'], ai: 'charge' },
        { cls: 'archer', x: 5, y: 2, level: 13, items: ['killer_bow'], ai: 'guard', aggro: 7 },
        { cls: 'archer', x: 13, y: 2, level: 13, items: ['killer_bow'], ai: 'guard', aggro: 7 },
        { cls: 'mage', x: 7, y: 5, level: 13, items: ['elfire'], ai: 'guard', aggro: 6 },
        { cls: 'shaman', x: 12, y: 5, level: 13, items: ['flux'], ai: 'guard', aggro: 6 },
        { cls: 'wyvern', x: 3, y: 6, level: 14, items: ['javelin'], ai: 'charge' },
        { cls: 'wyvern', x: 16, y: 6, level: 14, items: ['javelin'], ai: 'charge' },
        { cls: 'priest', x: 7, y: 2, level: 12, items: ['mend'], ai: 'heal' },
        { cls: 'swordmaster', x: 12, y: 3, level: 6, items: ['steel_sword', 'vulnerary'],
          ai: 'guard', aggro: 5, name: 'Ysolt', title: 'Sword of Varen', drops: 'earth_seal',
          quote: ['YSOLT: He pays me. That is the whole of my position.',
                  'ALERYN: Everyone in this castle says that.',
                  'YSOLT: Everyone in this castle is telling the truth.'] },
        { cls: 'general', name: 'Varen', title: 'The Usurper', x: 9, y: 0, level: 12, boss: true,
          items: ['silver_lance', 'javelin', 'elixir'], ai: 'boss', drops: 'silver_lance',
          quote: ['VAREN: Your father came to me. Not the other way round.',
                  'ALERYN: I know.',
                  'VAREN: ...Ah. Then you know there is nothing here to take back.',
                  'ALERYN: I am not taking it back. I am taking it off you.'] }
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

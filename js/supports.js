/* =============================================================
   supports.js — Bonds between units.

   Units who fight side by side accumulate support points. At C, B and A
   they fight better when adjacent, and each rank unlocks a conversation
   that plays in the interlude after the chapter.
   ============================================================= */
(function (FE) {
  'use strict';

  FE.SUPPORT_THRESHOLDS = { C: 16, B: 40, A: 72 };
  FE.SUPPORT_BONUS = {
    C: { hit: 5,  avo: 5,  dmg: 0, crit: 0 },
    B: { hit: 10, avo: 10, dmg: 1, crit: 2 },
    A: { hit: 15, avo: 15, dmg: 2, crit: 5 }
  };
  FE.SUPPORT_CAP_PER_CHAPTER = 20;

  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  FE.pairKey = pairKey;

  /* ---------- who can support whom, and what they say ------------- */
  FE.SUPPORT_PAIRS = [
    {
      a: 'aleryn', b: 'roderic',
      C: [
        'RODERIC: You are holding the sword wrong again.',
        'ALERYN: I am holding it the way my father held it.',
        'RODERIC: Your father held it wrong. I never told him because he was my lord.',
        'ALERYN: And you are telling me because...?',
        'RODERIC: Because you are my lord, and I would like you to survive being it.'
      ],
      B: [
        'ALERYN: You have not asked me what I intend to do after.',
        'RODERIC: No, my lady.',
        'ALERYN: Why not?',
        'RODERIC: Because you have not decided, and asking would make you pretend you had.',
        'ALERYN: ...That is the most useful thing anyone has said to me in a month.'
      ],
      A: [
        'RODERIC: When it is finished, I will go back to Vale and rebuild the west gate.',
        'ALERYN: There is no west gate. There is no Vale.',
        'RODERIC: There is a hill with a burnt gate on it and I know where every stone fell.',
        'ALERYN: Roderic.',
        'RODERIC: My lady?',
        'ALERYN: Build it wide. I am tired of narrow gates.'
      ]
    },
    {
      a: 'aleryn', b: 'kestrel',
      C: [
        'KESTREL: Your father hanged two men for taking deer off that ridge.',
        'ALERYN: I know.',
        'KESTREL: I took forty.',
        'ALERYN: I know that too. He was very bad at counting deer.'
      ],
      B: [
        'KESTREL: You keep looking at me like you are working out what to say.',
        'ALERYN: I am working out whether an apology from me is worth anything.',
        'KESTREL: It is not. Your father is dead and I am still hungry.',
        'ALERYN: Then I will feed you and say nothing.',
        'KESTREL: ...That will do nicely.'
      ],
      A: [
        'ALERYN: If I take Vale back, the deer are yours. All of them.',
        'KESTREL: That is a stupid law.',
        'ALERYN: It is a better one than my father had.',
        'KESTREL: Aye. But make it a proper law, with a seal on it. I want to frame the thing.'
      ]
    },
    {
      a: 'roderic', b: 'garrick',
      C: [
        'GARRICK: Your horse does not like me.',
        'RODERIC: My horse does not like anyone who smells of pine sap.',
        'GARRICK: That is most of the world, then.',
        'RODERIC: He is a very particular horse.'
      ],
      B: [
        'GARRICK: I cut trees for nineteen years. I was good at it.',
        'RODERIC: You swing an axe like a man who was good at it.',
        'GARRICK: A tree does not swing back, though.',
        'RODERIC: No. Stay on my left and neither will they.'
      ],
      A: [
        'GARRICK: When it is over I am going back to the woods.',
        'RODERIC: The woods are gone, Garrick. They burned them for the siege lines.',
        'GARRICK: Then I will plant them.',
        'RODERIC: That takes a lifetime.',
        'GARRICK: I have got one of those spare.'
      ]
    },
    {
      a: 'mira', b: 'isolde',
      C: [
        'ISOLDE: Does the praying help?',
        'MIRA: It helps me. The bandages help them.',
        'ISOLDE: That is a more honest answer than I expected from an abbey.',
        'MIRA: The abbey did not send its best liar.'
      ],
      B: [
        'MIRA: You set a man on fire today.',
        'ISOLDE: He was going to put a lance through Garrick.',
        'MIRA: I know. I am not scolding you. I am asking how you sleep.',
        'ISOLDE: Badly. Thank you for asking properly.'
      ],
      A: [
        'ISOLDE: If we live, come to the college with me. They would take you.',
        'MIRA: To study what?',
        'ISOLDE: Whatever you like. You have the patience for it and I do not.',
        'MIRA: I will come. On one condition.',
        'ISOLDE: Name it.',
        'MIRA: You stop pretending you sleep fine.'
      ]
    },
    {
      a: 'kestrel', b: 'sable',
      C: [
        'SABLE: You shot a man through a window at ninety paces.',
        'KESTREL: Eighty.',
        'SABLE: I am trying to compliment you.',
        'KESTREL: Then get it right.'
      ],
      B: [
        'SABLE: Do you ever think about what we are, the two of us? Poacher, cutpurse.',
        'KESTREL: We are the only two here who were hungry before the war.',
        'SABLE: ...Yes. That is it exactly.'
      ],
      A: [
        'SABLE: I have not stolen anything in four months.',
        'KESTREL: I know. I have been counting.',
        'SABLE: You have been counting?',
        'KESTREL: Someone has to notice when a person changes. Might as well be me.'
      ]
    },
    {
      a: 'roderic', b: 'bern',
      C: [
        'BERN: Vale cavalry. I drilled against your lot at Marrowford.',
        'RODERIC: I was at Marrowford.',
        'BERN: Then you know why I do not like cavalry.',
        'RODERIC: I know why you should not stand in the open, yes.'
      ],
      B: [
        'RODERIC: Eleven years on one gate. Did you never want a field?',
        'BERN: A gate you can hold. A field just moves.',
        'RODERIC: And when the gate is opened from inside?',
        'BERN: Then you find out what you were really holding.'
      ],
      A: [
        'BERN: I opened it for a girl with no army and a dead name.',
        'RODERIC: You opened it for the march of Vale.',
        'BERN: Same thing. I have decided they are the same thing.',
        'RODERIC: Then you have decided better than most men twice paid.'
      ]
    },
    {
      a: 'elowen', b: 'mira',
      C: [
        'ELOWEN: You should not be this far forward.',
        'MIRA: Neither should the wounded, but there they are.',
        'ELOWEN: ...Get on. I will fly you out if it turns.'
      ],
      B: [
        'MIRA: Does she have a name? Your pegasus.',
        'ELOWEN: Sorrow.',
        'MIRA: That is a terrible name for a horse.',
        'ELOWEN: She is a terrible horse. She bites. It suits her.'
      ],
      A: [
        'ELOWEN: I was carrying a letter south when I found your war.',
        'MIRA: Did you ever deliver it?',
        'ELOWEN: No. I read it. It said the roads were safe.',
        'MIRA: ...Ah.',
        'ELOWEN: So I stayed and made one of them true.'
      ]
    },
    {
      a: 'aleryn', b: 'hallow',
      C: [
        'ALERYN: Who are you paying?',
        'HALLOW: A debt.',
        'ALERYN: To whom?',
        'HALLOW: Someone who is not here to be paid. That is rather the problem with debts.'
      ],
      B: [
        'HALLOW: You fight like someone who expects to lose and intends to be difficult about it.',
        'ALERYN: Is that a criticism?',
        'HALLOW: It is the highest compliment I have. I do not have many.'
      ],
      A: [
        'HALLOW: The debt was my brother. He held a gate for a lord who had already sold it.',
        'ALERYN: ...Which gate.',
        'HALLOW: Does it matter? There are a great many gates and a great many lords.',
        'ALERYN: It matters to me.',
        'HALLOW: Then it is paid. That is what I came to find out.'
      ]
    },
    {
      a: 'garrick', b: 'mira',
      C: [
        'MIRA: Sit down. You are bleeding on my bandages.',
        'GARRICK: They are bandages. That is what they are for.',
        'MIRA: They are for wounds you tell me about. Sit.'
      ],
      B: [
        'GARRICK: You are very small to be shouting at me.',
        'MIRA: I am very small and you are very stitched. Consider that.',
        'GARRICK: ...Fair.'
      ],
      A: [
        'GARRICK: If I go down, do not come forward for me.',
        'MIRA: No.',
        'GARRICK: Mira.',
        'MIRA: I said no. You do not get to decide which of us is worth the walk.'
      ]
    },
    {
      a: 'tam', b: 'sable',
      C: [
        'SABLE: What are they paying you?',
        'TAM: Enough.',
        'SABLE: That is not a number.',
        'TAM: No, it is a boundary. Stay on your side of it.'
      ],
      B: [
        'SABLE: You were paid in advance. You could have walked at the river.',
        'TAM: I could have.',
        'SABLE: Why did you not?',
        'TAM: Because I took the coin. That is the whole of it. There is no second reason.'
      ],
      A: [
        'SABLE: I used to think men like you were the worst of it. Swords for hire.',
        'TAM: And now?',
        'SABLE: Now I have met men who do it for free, out of loyalty, and they frighten me more.',
        'TAM: ...You are not wrong.'
      ]
    }
  ];

  /* pairId -> pair, for quick lookup */
  var PAIR_INDEX = {};
  FE.SUPPORT_PAIRS.forEach(function (p) { PAIR_INDEX[pairKey(p.a, p.b)] = p; });

  FE.supportPair = function (aId, bId) { return PAIR_INDEX[pairKey(aId, bId)] || null; };

  FE.canSupport = function (a, b) {
    return !!(a && b && a.id && b.id && PAIR_INDEX[pairKey(a.id, b.id)]);
  };

  FE.supportPoints = function (unit, otherId) {
    return (unit.supports && unit.supports[otherId]) || 0;
  };

  FE.rankFor = function (points) {
    if (points >= FE.SUPPORT_THRESHOLDS.A) return 'A';
    if (points >= FE.SUPPORT_THRESHOLDS.B) return 'B';
    if (points >= FE.SUPPORT_THRESHOLDS.C) return 'C';
    return null;
  };

  FE.supportRank = function (a, b) {
    if (!FE.canSupport(a, b)) return null;
    return FE.rankFor(FE.supportPoints(a, b.id));
  };

  /**
   * Adds points to both halves of a pair and returns the rank reached, if
   * this push crossed a threshold. Gains are capped per chapter so a pair
   * cannot be farmed to A in one map.
   */
  FE.addSupport = function (a, b, amount) {
    if (!FE.canSupport(a, b)) return null;
    a.supports = a.supports || {};
    b.supports = b.supports || {};
    a.supportGain = a.supportGain || {};
    var spent = a.supportGain[b.id] || 0;
    var room = FE.SUPPORT_CAP_PER_CHAPTER - spent;
    if (room <= 0) return null;
    var give = Math.min(amount, room);

    var before = FE.rankFor(a.supports[b.id] || 0);
    a.supports[b.id] = (a.supports[b.id] || 0) + give;
    b.supports[a.id] = a.supports[b.id];
    a.supportGain[b.id] = spent + give;
    b.supportGain = b.supportGain || {};
    b.supportGain[a.id] = a.supportGain[b.id];

    var after = FE.rankFor(a.supports[b.id]);
    return (after && after !== before) ? after : null;
  };

  FE.resetChapterSupportGain = function (units) {
    units.forEach(function (u) { u.supportGain = {}; });
  };

  /**
   * The combat bonus a unit gets from the supported allies standing next
   * to it. Two neighbours at most, as in the games.
   */
  FE.supportBonus = function (board, unit) {
    return FE.supportBonusAt(board, unit, unit);
  };

  /* `at` lets the forecast ask "what if this unit stood here instead". */
  FE.supportBonusAt = function (board, unit, at) {
    var out = { hit: 0, avo: 0, dmg: 0, crit: 0, partners: [] };
    if (!board || !unit || !unit.id) return out;
    for (var d = 0; d < FE.DIRS.length; d++) {
      var o = board.unitAt(at.x + FE.DIRS[d][0], at.y + FE.DIRS[d][1]);
      if (o === unit) continue;
      if (!o || !o.alive || FE.hostile(unit, o)) continue;
      var rank = FE.supportRank(unit, o);
      if (!rank) continue;
      var bonus = FE.SUPPORT_BONUS[rank];
      out.hit += bonus.hit;
      out.avo += bonus.avo;
      out.dmg += bonus.dmg;
      out.crit += bonus.crit;
      out.partners.push({ unit: o, rank: rank });
      if (out.partners.length >= 2) break;
    }
    return out;
  };

  FE.supportConversation = function (aId, bId, rank) {
    var p = PAIR_INDEX[pairKey(aId, bId)];
    return p && p[rank] ? p[rank] : null;
  };

  /** Every pair this unit could ever build, for the prep screen. */
  FE.partnersOf = function (id) {
    var out = [];
    FE.SUPPORT_PAIRS.forEach(function (p) {
      if (p.a === id) out.push(p.b);
      else if (p.b === id) out.push(p.a);
    });
    return out;
  };
})(window.FE);

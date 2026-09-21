/* =============================================================
   core.js — Units, stats, inventory, experience and levelling.
   ============================================================= */
(function (FE) {
  'use strict';

  /* ---------- RNG ---------------------------------------------------- */
  var seed = (Date.now() ^ 0x5f3759df) >>> 0;
  FE.setSeed = function (s) { seed = (s >>> 0) || 1; };
  FE.rand = function () { /* xorshift32 — deterministic and replayable */
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 4294967296;
  };
  FE.roll = function (pct) { return FE.rand() * 100 < pct; };
  /* Fire Emblem's "2RN": the average of two rolls, which makes displayed
     hit rates above 50 far more reliable than they look, and below 50 far
     less. Keeping it makes the maths feel like the real thing. */
  FE.roll2 = function (pct) {
    if (pct >= 100) return true;
    if (pct <= 0) return false;
    return ((FE.rand() + FE.rand()) / 2) * 100 < pct;
  };
  FE.randInt = function (n) { return Math.floor(FE.rand() * n); };

  /* ---------- Items -------------------------------------------------- */
  FE.item = function (idOrStack) {
    var id = typeof idOrStack === 'string' ? idOrStack : idOrStack.id;
    return FE.ITEMS[id];
  };
  FE.makeItem = function (id, uses) {
    var def = FE.ITEMS[id];
    if (!def) { console.warn('unknown item', id); return null; }
    return { id: id, uses: uses === undefined ? def.uses : uses };
  };

  FE.rankValue = function (r) { return FE.RANKS.indexOf(r); };

  FE.canUse = function (u, stack) {
    var it = FE.item(stack);
    if (!it) return false;
    if (it.lock && it.lock !== u.cls && it.lockName !== u.name) {
      /* class-locked weapons also accept the promoted form of that class */
      var promoted = FE.CLASSES[it.lock] && FE.CLASSES[it.lock].promo === u.cls;
      if (!promoted) return false;
    }
    if (it.kind === 'weapon' || it.kind === 'staff') {
      var cls = FE.CLASSES[u.cls];
      if (cls.weapons.indexOf(it.type) < 0) return false;
      return FE.rankValue(u.wexp ? rankOf(u, it.type) : 'E') >= FE.rankValue(it.rank);
    }
    return true;
  };

  function rankOf(u, type) {
    var wexp = u.wexp[type] || 0;
    var best = 'E';
    for (var i = 0; i < FE.RANKS.length; i++) {
      if (wexp >= FE.RANK_WEXP[FE.RANKS[i]]) best = FE.RANKS[i];
    }
    return best;
  }
  FE.weaponRank = rankOf;

  FE.isWeapon = function (stack) {
    var it = FE.item(stack);
    return it && it.kind === 'weapon';
  };
  FE.isStaff = function (stack) {
    var it = FE.item(stack);
    return it && it.kind === 'staff';
  };

  /* First usable weapon in the inventory is the equipped one — same as
     the GBA games. `preferred` lets combat pick a reaching weapon. */
  FE.equipped = function (u, preferred) {
    if (preferred !== undefined && u.items[preferred]) return u.items[preferred];
    for (var i = 0; i < u.items.length; i++) {
      if (FE.isWeapon(u.items[i]) && FE.canUse(u, u.items[i])) return u.items[i];
    }
    return null;
  };

  FE.usableWeapons = function (u) {
    return u.items.filter(function (s) { return FE.isWeapon(s) && FE.canUse(u, s); });
  };
  FE.usableStaves = function (u) {
    return u.items.filter(function (s) { return FE.isStaff(s) && FE.canUse(u, s); });
  };

  /* Every range this unit can strike at with anything it can wield. */
  FE.attackRanges = function (u) {
    var set = {};
    FE.usableWeapons(u).forEach(function (s) {
      var it = FE.item(s);
      for (var r = it.min; r <= it.max; r++) set[r] = true;
    });
    return Object.keys(set).map(Number).sort();
  };
  FE.maxAttackRange = function (u) {
    var r = FE.attackRanges(u);
    return r.length ? r[r.length - 1] : 0;
  };
  FE.staffRanges = function (u) {
    var set = {};
    FE.usableStaves(u).forEach(function (s) {
      var it = FE.item(s);
      var max = it.ranged ? Math.floor(FE.stat(u, 'mag') / 2) + 1 : it.max;
      for (var r = it.min; r <= Math.max(it.min, max); r++) set[r] = true;
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  };

  /* ---------- Stats -------------------------------------------------- */
  FE.stat = function (u, s) {
    var v = u.stats[s] || 0;
    if (u.buffs && u.buffs[s]) v += u.buffs[s];
    return v;
  };

  FE.cap = function (u, s) {
    var base = FE.STAT_CAP[s];
    return FE.CLASSES[u.cls].promoted ? base + FE.PROMO_CAP_BONUS : base;
  };

  FE.con = function (u) { return FE.CLASSES[u.cls].con + (u.conBonus || 0); };
  FE.mov = function (u) { return FE.CLASSES[u.cls].mov + (u.movBonus || 0); };

  /* Attack speed: heavy weapons slow you down when you lack the build. */
  FE.attackSpeed = function (u, stack) {
    var it = stack ? FE.item(stack) : null;
    var burden = it && it.wt ? Math.max(0, it.wt - FE.con(u)) : 0;
    return FE.stat(u, 'spd') - burden;
  };

  FE.avoid = function (u, terrain) {
    var t = terrain ? (FE.TERRAIN[terrain] || FE.TERRAIN['.']) : null;
    return FE.attackSpeed(u, FE.equipped(u)) * 2 + FE.stat(u, 'lck') + (t ? t.avo : 0);
  };

  FE.hitRate = function (u, stack) {
    var it = FE.item(stack);
    if (!it) return 0;
    return (it.hit || 0) + FE.stat(u, 'skl') * 2 + Math.floor(FE.stat(u, 'lck') / 2);
  };

  FE.critRate = function (u, stack) {
    var it = FE.item(stack);
    if (!it) return 0;
    var cls = FE.CLASSES[u.cls];
    var rankBonus = FE.rankValue(FE.weaponRank(u, it.type)) >= 4 ? 5 : 0;
    return (it.crit || 0) + Math.floor(FE.stat(u, 'skl') / 2) + (cls.crit || 0) + rankBonus;
  };

  FE.dodge = function (u) { return FE.stat(u, 'lck'); };

  /* ---------- Unit construction -------------------------------------- */
  var uid = 1;

  function blankStats() {
    var o = {};
    FE.STATS.forEach(function (s) { o[s] = 0; });
    return o;
  }

  /* Rolls `n` level-ups' worth of growth onto a stat block. */
  function autoLevel(stats, growths, n, u) {
    for (var i = 0; i < n; i++) {
      FE.STATS.forEach(function (s) {
        if (FE.roll(growths[s] || 0)) {
          var cap = u ? FE.cap(u, s) : FE.STAT_CAP[s];
          if (stats[s] < cap) stats[s]++;
        }
      });
    }
  }

  /**
   * def: { name, cls, level, team, items:[id|{id,uses}], growths:{}, bases:{},
   *        ai, boss, hair, talk, drops }
   */
  FE.makeUnit = function (def) {
    var cls = FE.CLASSES[def.cls];
    if (!cls) throw new Error('unknown class ' + def.cls);
    var u = {
      uid: uid++,
      id: def.id || (def.cls + '_' + uid),
      name: def.name || cls.name,
      cls: def.cls,
      team: def.team || 'enemy',
      level: def.level || 1,
      exp: 0,
      stats: blankStats(),
      growths: {},
      wexp: {},
      items: [],
      x: def.x === undefined ? 0 : def.x,
      y: def.y === undefined ? 0 : def.y,
      acted: false,
      alive: true,
      ai: def.ai || 'charge',
      aggro: def.aggro === undefined ? 4 : def.aggro,
      boss: !!def.boss,
      hair: def.hair || null,
      talk: def.talk || null,
      drops: def.drops || null,
      title: def.title || null,
      desc: def.desc || '',
      buffs: {},
      kills: 0,
      battles: 0
    };

    FE.STATS.forEach(function (s) {
      u.stats[s] = cls.bases[s] + ((def.bases && def.bases[s]) || 0);
      u.growths[s] = (def.growths && def.growths[s] !== undefined)
        ? def.growths[s] : cls.growths[s];
    });

    Object.keys(cls.ranks || {}).forEach(function (t) {
      u.wexp[t] = FE.RANK_WEXP[cls.ranks[t]];
    });

    /* Enemies are generated at their listed level; recruits keep the level
       given in the chapter data and grow from their class bases. */
    var levels = Math.max(0, u.level - 1);
    if (levels > 0 && def.autolevel !== false) {
      var g = {};
      FE.STATS.forEach(function (s) {
        g[s] = u.growths[s] * (u.team === 'enemy' ? 0.7 : 1);
      });
      autoLevel(u.stats, g, levels, u);
    }

    (def.items || []).forEach(function (it) {
      var stack = typeof it === 'string' ? FE.makeItem(it) : FE.makeItem(it.id, it.uses);
      if (stack) u.items.push(stack);
    });

    u.maxHp = u.stats.hp;
    u.hp = u.maxHp;
    return u;
  };

  FE.maxHp = function (u) { return FE.stat(u, 'hp'); };

  /* ---------- Experience --------------------------------------------- */
  function powerRank(u) {
    return u.level + (FE.CLASSES[u.cls].promoted ? 20 : 0);
  }

  FE.hitExp = function (attacker, target) {
    return clamp(31 + powerRank(target) - powerRank(attacker), 1, 100);
  };

  FE.killExp = function (attacker, target) {
    var base = FE.hitExp(attacker, target);
    var bonus = (powerRank(target) * 3 + 20) - (powerRank(attacker) * 3);
    if (target.boss) bonus += 40;
    if (FE.CLASSES[target.cls].promoted) bonus += 20;
    return clamp(base + Math.max(0, bonus), base + 10, 100);
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  FE.clamp = clamp;

  /**
   * Awards exp; returns a list of level-up results ({gains:{}, level}).
   * Units at max level in an unpromoted class stop at 99 exp.
   */
  FE.gainExp = function (u, amount, log) {
    if (u.team !== 'player' || amount <= 0) return [];
    var ups = [];
    u.exp += Math.round(amount);
    while (u.exp >= 100) {
      if (u.level >= FE.MAX_LEVEL) { u.exp = 99; break; }
      u.exp -= 100;
      ups.push(FE.levelUp(u));
    }
    if (u.level >= FE.MAX_LEVEL && u.exp > 99) u.exp = 99;
    if (log) log(u.name + ' gained ' + Math.round(amount) + ' EXP.');
    return ups;
  };

  FE.levelUp = function (u) {
    u.level++;
    var gains = {};
    FE.STATS.forEach(function (s) {
      if (FE.roll(u.growths[s]) && u.stats[s] < FE.cap(u, s)) {
        u.stats[s]++;
        gains[s] = 1;
      }
    });
    /* A level-up that gives nothing feels awful; nudge one random stat. */
    if (Object.keys(gains).length === 0) {
      var open = FE.STATS.filter(function (s) { return u.stats[s] < FE.cap(u, s); });
      if (open.length) {
        var s2 = open[FE.randInt(open.length)];
        u.stats[s2]++; gains[s2] = 1;
      }
    }
    if (gains.hp) u.hp += gains.hp;
    u.maxHp = FE.stat(u, 'hp');
    return { gains: gains, level: u.level };
  };

  FE.gainWexp = function (u, type, amount) {
    if (!type) return null;
    var before = FE.weaponRank(u, type);
    u.wexp[type] = (u.wexp[type] || 0) + amount;
    var after = FE.weaponRank(u, type);
    return before !== after ? after : null;
  };

  /* ---------- Promotion ---------------------------------------------- */
  FE.canPromote = function (u, itemStack) {
    var cls = FE.CLASSES[u.cls];
    if (!cls.promo) return false;
    if (u.level < 10) return false;
    var it = FE.item(itemStack);
    if (!it || it.kind !== 'promo') return false;
    return it.forClasses === '*' || it.forClasses.indexOf(u.cls) >= 0;
  };

  FE.promote = function (u) {
    var cls = FE.CLASSES[u.cls];
    var next = FE.CLASSES[cls.promo];
    var gains = {};
    FE.STATS.forEach(function (s) {
      var add = next.bases[s];
      var cap = FE.STAT_CAP[s] + FE.PROMO_CAP_BONUS;
      var v = Math.min(cap, u.stats[s] + add);
      gains[s] = v - u.stats[s];
      u.stats[s] = v;
    });
    Object.keys(next.ranks).forEach(function (t) {
      var floor = FE.RANK_WEXP[next.ranks[t]];
      if ((u.wexp[t] || 0) < floor) u.wexp[t] = floor;
    });
    var oldName = cls.name;
    u.cls = cls.promo;
    u.growths = {};
    FE.STATS.forEach(function (s) { u.growths[s] = next.growths[s]; });
    u.level = 1;
    u.exp = 0;
    u.maxHp = FE.stat(u, 'hp');
    u.hp += gains.hp;
    return { from: oldName, to: next.name, gains: gains };
  };

  /* ---------- Inventory helpers -------------------------------------- */
  FE.consume = function (u, stack, n) {
    stack.uses -= (n || 1);
    if (stack.uses <= 0) {
      var i = u.items.indexOf(stack);
      if (i >= 0) u.items.splice(i, 1);
      return true; /* broke */
    }
    return false;
  };

  FE.heal = function (u, amount) {
    var before = u.hp;
    u.hp = Math.min(FE.maxHp(u), u.hp + amount);
    return u.hp - before;
  };

  FE.hasSpace = function (u) { return u.items.length < 5; };

  FE.give = function (u, stack) {
    if (!FE.hasSpace(u)) return false;
    u.items.push(stack);
    return true;
  };
})(window.FE);

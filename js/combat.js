/* =============================================================
   combat.js — Battle forecasts and resolution.
   Formulas follow the GBA Fire Emblem games closely enough that
   the numbers behave the way a series veteran expects.
   ============================================================= */
(function (FE) {
  'use strict';

  function triangle(aType, dType) {
    if (!aType || !dType) return 0;
    if (FE.TRIANGLE[aType] === dType) return 1;
    if (FE.TRIANGLE[dType] === aType) return -1;
    return 0;
  }

  function effectiveAgainst(item, target) {
    if (!item.effective) return false;
    var tags = FE.CLASSES[target.cls].tags || [];
    for (var i = 0; i < item.effective.length; i++) {
      if (tags.indexOf(item.effective[i]) >= 0) return true;
    }
    return false;
  }

  /** Best usable weapon that reaches `distance`, preferring the equipped one. */
  FE.weaponFor = function (u, distance) {
    var list = FE.usableWeapons(u);
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < list.length; i++) {
      var it = FE.item(list[i]);
      if (distance < it.min || distance > it.max) continue;
      /* prefer higher might, then earlier slot */
      var score = it.mt * 2 - i;
      if (score > bestScore) { bestScore = score; best = list[i]; }
    }
    return best;
  };

  FE.canCounter = function (defender, distance) {
    return !!FE.weaponFor(defender, distance);
  };

  function terrainDefAt(board, x, y) {
    var t = board.terrainAt(x, y);
    return t.def;
  }

  /**
   * One side's numbers in a matchup.
   * tile: {x,y} the unit will be standing on.
   */
  function side(board, unit, tile, foe, foeTile, weaponStack) {
    var out = {
      unit: unit, weapon: weaponStack, canAttack: !!weaponStack,
      atk: 0, hit: 0, crit: 0, dmg: 0, hits: 1, as: 0, effective: false
    };
    if (!weaponStack) return out;
    var it = FE.item(weaponStack);
    var foeWeapon = FE.equipped(foe);
    var foeType = foeWeapon ? FE.item(foeWeapon).type : null;
    var tri = triangle(it.type, foeType);

    var power = it.magic ? FE.stat(unit, 'mag') : FE.stat(unit, 'str');
    var mt = it.mt + tri;
    out.effective = effectiveAgainst(it, foe);
    if (out.effective) mt = it.mt * 3 + tri;
    out.atk = power + mt;

    var defStat = it.magic ? FE.stat(foe, 'res') : FE.stat(foe, 'def');
    var defTerrain = terrainDefAt(board, foeTile.x, foeTile.y);

    /* Standing beside someone you have fought alongside is worth real
       numbers — and so is the fact that your target has company. */
    /* measured from the tile this unit will actually be standing on */
    var mySup = FE.supportBonus ? FE.supportBonusAt(board, unit, tile) : { hit: 0, avo: 0, dmg: 0, crit: 0 };
    var foeSup = FE.supportBonus ? FE.supportBonusAt(board, foe, foeTile) : { hit: 0, avo: 0, dmg: 0, crit: 0 };
    out.dmg = Math.max(0, out.atk + mySup.dmg - defStat - defTerrain);
    out.support = mySup;

    var acc = FE.hitRate(unit, weaponStack) + tri * 15 + mySup.hit;
    var avo = FE.attackSpeed(foe, foeWeapon) * 2 + FE.stat(foe, 'lck')
            + board.terrainAt(foeTile.x, foeTile.y).avo + foeSup.avo;
    out.hit = FE.clamp(Math.round(acc - avo), 0, 100);
    out.crit = FE.clamp(FE.critRate(unit, weaponStack) + mySup.crit - FE.dodge(foe), 0, 100);
    out.as = FE.attackSpeed(unit, weaponStack);
    out.brave = !!it.brave;
    out.drain = !!it.drain;
    out.type = it.type;
    return out;
  }

  /**
   * Full forecast for attacker standing on `atkTile` hitting `defender`.
   * Returns { a, d, distance, valid }.
   */
  FE.forecast = function (board, attacker, atkTile, defender, forcedWeapon) {
    var dTile = { x: defender.x, y: defender.y };
    var distance = Math.abs(atkTile.x - dTile.x) + Math.abs(atkTile.y - dTile.y);
    var aw = forcedWeapon || FE.weaponFor(attacker, distance);
    if (!aw) return { valid: false };
    var dw = FE.weaponFor(defender, distance);
    var a = side(board, attacker, atkTile, defender, dTile, aw);
    var d = side(board, defender, dTile, attacker, atkTile, dw);

    /* doubling */
    a.doubles = d.canAttack ? a.as >= d.as + 4 : a.as >= (FE.stat(defender, 'spd') + 4);
    d.doubles = d.canAttack && d.as >= a.as + 4;
    a.hits = (a.brave ? 2 : 1) * (a.doubles ? 2 : 1);
    d.hits = d.canAttack ? (d.brave ? 2 : 1) * (d.doubles ? 2 : 1) : 0;

    return { valid: true, a: a, d: d, distance: distance };
  };

  /**
   * Runs the exchange. Produces a list of strike events for the animator
   * and mutates HP. Does NOT award exp — the caller does that so the UI
   * can sequence level-ups after the animation.
   */
  FE.resolveCombat = function (board, attacker, defender, forcedWeapon) {
    var atkTile = { x: attacker.x, y: attacker.y };
    var f = FE.forecast(board, attacker, atkTile, defender, forcedWeapon);
    if (!f.valid) return null;

    var events = [];
    var order = [];
    /* attacker's first round */
    pushRound(order, 'a', f.a.brave ? 2 : 1);
    if (f.d.canAttack) pushRound(order, 'd', f.d.brave ? 2 : 1);
    if (f.a.doubles) pushRound(order, 'a', f.a.brave ? 2 : 1);
    else if (f.d.doubles) pushRound(order, 'd', f.d.brave ? 2 : 1);

    function pushRound(arr, who, n) { for (var i = 0; i < n; i++) arr.push(who); }

    var used = { a: 0, d: 0 };
    for (var i = 0; i < order.length; i++) {
      if (attacker.hp <= 0 || defender.hp <= 0) break;
      var who = order[i];
      var src = who === 'a' ? f.a : f.d;
      var tgt = who === 'a' ? defender : attacker;
      var actor = who === 'a' ? attacker : defender;
      if (!src.canAttack) continue;

      var ev = { who: who, actor: actor, target: tgt, hit: false, crit: false, dmg: 0 };
      if (FE.roll2(src.hit)) {
        ev.hit = true;
        ev.crit = FE.roll(src.crit);
        ev.dmg = src.dmg * (ev.crit ? 3 : 1);
        tgt.hp = Math.max(0, tgt.hp - ev.dmg);
        if (src.drain && ev.dmg > 0) {
          ev.drain = FE.heal(actor, ev.dmg);
        }
      }
      used[who]++;
      actor.battles++;
      events.push(ev);
      if (tgt.hp <= 0) { ev.kill = true; }
    }

    /* Spend weapon uses: one per round entered, as in the GBA games. */
    var aWeapon = f.a.weapon, dWeapon = f.d.weapon;
    var broke = [];
    if (used.a > 0 && aWeapon) {
      var n = f.a.brave ? Math.ceil(used.a / 2) : used.a;
      if (FE.consume(attacker, aWeapon, n)) broke.push({ unit: attacker, item: FE.item(aWeapon) });
    }
    if (used.d > 0 && dWeapon) {
      var m = f.d.brave ? Math.ceil(used.d / 2) : used.d;
      if (FE.consume(defender, dWeapon, m)) broke.push({ unit: defender, item: FE.item(dWeapon) });
    }

    return {
      forecast: f, events: events, broke: broke,
      attackerWeapon: aWeapon, defenderWeapon: dWeapon,
      used: used
    };
  };

  /** Exp for an exchange, applied after the animation finishes. */
  FE.combatExp = function (result, attacker, defender) {
    var out = [];
    function award(actor, foe, didAct, killed) {
      if (!didAct || actor.team !== 'player') return;
      var amount = killed ? FE.killExp(actor, foe) : FE.hitExp(actor, foe);
      out.push({ unit: actor, amount: amount });
    }
    award(attacker, defender, result.used.a > 0, defender.hp <= 0);
    award(defender, attacker, result.used.d > 0, attacker.hp <= 0);
    return out;
  };

  /* ---------- Staves ------------------------------------------------- */
  FE.staffHeal = function (user, stack) {
    var it = FE.item(stack);
    return (it.heal || 0) + FE.stat(user, 'mag');
  };
  FE.STAFF_EXP = 18;
})(window.FE);

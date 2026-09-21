/* =============================================================
   ai.js — Enemy decision making.
   Produces a plan object; game.js animates and applies it.
     { type:'attack', path, target, weapon }
     { type:'staff',  path, target, staff }
     { type:'item',   path, item }
     { type:'move',   path }
     { type:'wait' }
   ============================================================= */
(function (FE) {
  'use strict';

  function key(x, y) { return x + ',' + y; }

  function hostilesOf(board, unit) {
    return board.livingUnits().filter(function (o) { return FE.hostile(unit, o); });
  }

  /* How much this unit wants to be standing on that tile. */
  function terrainScore(board, unit, x, y) {
    var t = board.terrainAt(x, y);
    return t.def * 2 + t.avo * 0.15;
  }

  /**
   * Score one "stand here and hit that" option.
   * The AI is deliberately a little greedy and a little cowardly — it
   * values kills highly and avoids trades that get it killed for nothing,
   * which is roughly how GBA-era enemy phases feel.
   */
  function scoreAttack(board, unit, tile, target) {
    var f = FE.forecast(board, unit, tile, target);
    if (!f.valid) return null;
    var expDmg = Math.min(target.hp, f.a.dmg * f.a.hits * (f.a.hit / 100));
    var killChance = (f.a.dmg * f.a.hits >= target.hp) ? f.a.hit / 100 : 0;
    var taken = f.d.canAttack ? f.d.dmg * f.d.hits * (f.d.hit / 100) : 0;
    var deathRisk = (f.d.canAttack && f.d.dmg * f.d.hits >= unit.hp) ? f.d.hit / 100 : 0;

    var score = expDmg * 2.0
      + killChance * 45
      - taken * 1.1
      - deathRisk * 35
      + terrainScore(board, unit, tile.x, tile.y)
      - FE.dist(tile, { x: unit.x, y: unit.y }) * 0.05;

    /* Finish off wounded and squishy targets first. */
    if (target.hp <= target.maxHp * 0.4) score += 6;
    if (target.lordRef) score += 4;
    return { score: score, forecast: f, target: target, tile: tile };
  }

  function bestAttack(board, unit, tiles) {
    var ranges = FE.attackRanges(unit);
    if (!ranges.length) return null;
    var targets = hostilesOf(board, unit);
    if (!targets.length) return null;
    var best = null;
    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i];
      for (var j = 0; j < targets.length; j++) {
        var d = Math.abs(tile.x - targets[j].x) + Math.abs(tile.y - targets[j].y);
        if (ranges.indexOf(d) < 0) continue;
        var s = scoreAttack(board, unit, tile, targets[j]);
        if (s && (!best || s.score > best.score)) best = s;
      }
    }
    return best;
  }

  /* Walk as far along `path` as movement allows, stopping on a free tile. */
  function truncatePath(board, unit, path, mov) {
    var mt = FE.moveType(unit.cls);
    var used = 0, out = [path[0]];
    for (var i = 1; i < path.length; i++) {
      var t = board.terrainAt(path[i].x, path[i].y);
      used += t.cost[mt];
      if (used > mov) break;
      out.push(path[i]);
    }
    /* back off until we end somewhere unoccupied */
    while (out.length > 1) {
      var last = out[out.length - 1];
      var occ = board.unitAt(last.x, last.y);
      if (!occ || occ === unit) break;
      out.pop();
    }
    return out;
  }

  /** Move toward the nearest hostile even when we cannot reach it this turn. */
  function approach(board, unit) {
    var targets = hostilesOf(board, unit);
    if (!targets.length) return null;
    var full = board.moveMap(unit, 999);
    var ranges = FE.attackRanges(unit);
    if (!ranges.length) ranges = [1];
    var bestKey = null, bestCost = Infinity, bestTarget = null;
    for (var i = 0; i < targets.length; i++) {
      var ring = board.ring(targets[i].x, targets[i].y, ranges);
      for (var j = 0; j < ring.length; j++) {
        var k = key(ring[j].x, ring[j].y);
        var c = full.cost[k];
        if (c === undefined) continue;
        var occ = board.unitAt(ring[j].x, ring[j].y);
        if (occ && occ !== unit) continue;
        if (c < bestCost) { bestCost = c; bestKey = k; bestTarget = targets[i]; }
      }
    }
    if (!bestKey) return null;
    var p = bestKey.split(',');
    var path = board.pathTo(full, +p[0], +p[1]);
    if (path.length <= 1) return null;
    var walk = truncatePath(board, unit, path, FE.mov(unit));
    if (walk.length <= 1) return null;
    return { type: 'move', path: walk, toward: bestTarget };
  }

  /* Staff users look after the wounded and otherwise keep their distance. */
  function healerPlan(board, unit, tiles) {
    var staves = FE.usableStaves(unit);
    if (!staves.length) return approachOrHold(board, unit);
    var staff = staves[0];
    var it = FE.item(staff);
    var maxR = it.ranged ? Math.floor(FE.stat(unit, 'mag') / 2) + 1 : it.max;
    var allies = board.livingUnits().filter(function (o) {
      return o !== unit && !FE.hostile(unit, o) && o.hp < FE.maxHp(o);
    });
    var best = null;
    for (var i = 0; i < tiles.length; i++) {
      for (var j = 0; j < allies.length; j++) {
        var d = Math.abs(tiles[i].x - allies[j].x) + Math.abs(tiles[i].y - allies[j].y);
        if (d < it.min || d > maxR) continue;
        var missing = FE.maxHp(allies[j]) - allies[j].hp;
        var score = Math.min(missing, FE.staffHeal(unit, staff)) + (allies[j].boss ? 5 : 0);
        if (!best || score > best.score) {
          best = { score: score, tile: tiles[i], target: allies[j] };
        }
      }
    }
    if (best) {
      return {
        type: 'staff', path: pathToTile(board, unit, tiles, best.tile),
        target: best.target, staff: staff
      };
    }
    /* Nobody to mend — shuffle toward the most hurt friend, or sit tight. */
    if (allies.length) {
      var full = board.moveMap(unit, 999);
      var target = allies[0];
      var path = board.pathTo(full, target.x, target.y);
      if (path.length > 2) {
        var walk = truncatePath(board, unit, path.slice(0, path.length - 1), FE.mov(unit));
        if (walk.length > 1) return { type: 'move', path: walk };
      }
    }
    return { type: 'wait' };
  }

  function pathToTile(board, unit, tiles, tile) {
    var mm = tiles._map || board.reachable(unit)._map;
    var path = board.pathTo(mm, tile.x, tile.y);
    return path.length ? path : [{ x: unit.x, y: unit.y }];
  }

  function approachOrHold(board, unit) {
    return approach(board, unit) || { type: 'wait' };
  }

  function anyHostileWithin(board, unit, radius) {
    var hs = hostilesOf(board, unit);
    for (var i = 0; i < hs.length; i++) {
      if (FE.dist(unit, hs[i]) <= radius) return true;
    }
    return false;
  }

  /**
   * Decide what one enemy unit does this turn.
   */
  FE.planTurn = function (board, unit) {
    if (unit.ai === 'hold') return { type: 'wait' };

    var tiles = board.reachable(unit);
    var here = [{ x: unit.x, y: unit.y, cost: 0 }];
    here._map = { cost: {}, from: {} };
    here._map.cost[key(unit.x, unit.y)] = 0;

    if (unit.ai === 'heal') return healerPlan(board, unit, tiles);

    /* Bosses hold their throne and strike whatever comes into reach. */
    if (unit.ai === 'boss' && !unit.aggroed) {
      var atHome = bestAttack(board, unit, here);
      if (atHome) {
        return {
          type: 'attack', path: [{ x: unit.x, y: unit.y }],
          target: atHome.target, forecast: atHome.forecast
        };
      }
      return { type: 'wait' };
    }

    /* Guards sit still until something wanders close enough (or hits them). */
    if (unit.ai === 'guard' && !unit.aggroed) {
      var threat = anyHostileWithin(board, unit, unit.aggro === undefined ? 4 : unit.aggro);
      if (!threat) {
        var reply = bestAttack(board, unit, here);
        if (reply) {
          return {
            type: 'attack', path: [{ x: unit.x, y: unit.y }],
            target: reply.target, forecast: reply.forecast
          };
        }
        return { type: 'wait' };
      }
      unit.aggroed = true;
    }

    var attack = bestAttack(board, unit, tiles);
    if (attack && attack.score > 0) {
      return {
        type: 'attack',
        path: pathToTile(board, unit, tiles, attack.tile),
        target: attack.target,
        forecast: attack.forecast
      };
    }

    /* Badly hurt with nothing worth hitting? Drink something. */
    if (unit.hp < FE.maxHp(unit) * 0.5) {
      for (var i = 0; i < unit.items.length; i++) {
        var it = FE.item(unit.items[i]);
        if (it && it.kind === 'consumable' && it.heal) {
          return { type: 'item', path: [{ x: unit.x, y: unit.y }], item: unit.items[i] };
        }
      }
    }

    /* A bad trade is still better than standing in the open doing nothing,
       but only if we would otherwise have no move at all. */
    if (attack) {
      return {
        type: 'attack',
        path: pathToTile(board, unit, tiles, attack.tile),
        target: attack.target,
        forecast: attack.forecast
      };
    }

    return approachOrHold(board, unit);
  };
})(window.FE);

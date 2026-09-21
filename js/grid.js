/* =============================================================
   grid.js — The board, movement costs, pathfinding and ranges.
   ============================================================= */
(function (FE) {
  'use strict';

  function Board(def) {
    this.w = def.tiles[0].length;
    this.h = def.tiles.length;
    this.tiles = def.tiles.slice();
    this.units = [];
    this.def = def;
    this.visited = {};   /* villages already visited, keyed "x,y" */
    this.opened = {};    /* chests already opened */
  }

  Board.prototype.inside = function (x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  };
  Board.prototype.charAt = function (x, y) {
    if (!this.inside(x, y)) return '#';
    return this.tiles[y][x];
  };
  Board.prototype.terrainAt = function (x, y) {
    return FE.TERRAIN[this.charAt(x, y)] || FE.TERRAIN['.'];
  };
  Board.prototype.unitAt = function (x, y) {
    for (var i = 0; i < this.units.length; i++) {
      var u = this.units[i];
      if (u.alive && u.x === x && u.y === y) return u;
    }
    return null;
  };
  Board.prototype.livingUnits = function (team) {
    return this.units.filter(function (u) {
      return u.alive && (!team || u.team === team);
    });
  };
  Board.prototype.setTile = function (x, y, ch) {
    var row = this.tiles[y];
    this.tiles[y] = row.substring(0, x) + ch + row.substring(x + 1);
  };

  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  FE.DIRS = DIRS;

  FE.hostile = function (a, b) {
    if (a.team === b.team) return false;
    /* player and ally (green) units fight the same side */
    var sideOf = function (t) { return t === 'enemy' ? 1 : 0; };
    return sideOf(a.team) !== sideOf(b.team);
  };

  /**
   * Dijkstra over movement cost. Friendly units may be moved through but
   * not stopped on; hostile units block entirely.
   * Returns { cost: {"x,y": n}, from: {"x,y": "px,py"} }
   */
  Board.prototype.moveMap = function (unit, maxMov) {
    var mt = FE.moveType(unit.cls);
    var mov = maxMov === undefined ? FE.mov(unit) : maxMov;
    var cost = {}, from = {};
    var startKey = unit.x + ',' + unit.y;
    cost[startKey] = 0;
    /* Small bucket queue: costs are tiny integers, so this is plenty. */
    var frontier = [[unit.x, unit.y, 0]];
    while (frontier.length) {
      /* pop cheapest */
      var bi = 0;
      for (var i = 1; i < frontier.length; i++) if (frontier[i][2] < frontier[bi][2]) bi = i;
      var cur = frontier.splice(bi, 1)[0];
      var cx = cur[0], cy = cur[1], cc = cur[2];
      if (cc > cost[cx + ',' + cy]) continue;
      for (var d = 0; d < DIRS.length; d++) {
        var nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (!this.inside(nx, ny)) continue;
        var t = this.terrainAt(nx, ny);
        var step = t.cost[mt];
        if (step >= 99) continue;
        var occupant = this.unitAt(nx, ny);
        if (occupant && FE.hostile(unit, occupant)) continue;
        var nc = cc + step;
        if (nc > mov) continue;
        var key = nx + ',' + ny;
        if (cost[key] === undefined || nc < cost[key]) {
          cost[key] = nc;
          from[key] = cx + ',' + cy;
          frontier.push([nx, ny, nc]);
        }
      }
    }
    return { cost: cost, from: from };
  };

  /** Tiles the unit can actually finish its move on. */
  Board.prototype.reachable = function (unit, maxMov) {
    var mm = this.moveMap(unit, maxMov);
    var out = [];
    for (var key in mm.cost) {
      var p = key.split(',');
      var x = +p[0], y = +p[1];
      var occ = this.unitAt(x, y);
      if (occ && occ !== unit) continue;
      out.push({ x: x, y: y, cost: mm.cost[key] });
    }
    out._map = mm;
    return out;
  };

  Board.prototype.pathTo = function (mm, x, y) {
    var path = [];
    var key = x + ',' + y;
    if (mm.cost[key] === undefined) return path;
    while (key) {
      var p = key.split(',');
      path.unshift({ x: +p[0], y: +p[1] });
      key = mm.from[key];
    }
    return path;
  };

  FE.dist = function (a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  /** All tiles at exactly the given Manhattan distances from (x,y). */
  Board.prototype.ring = function (x, y, ranges) {
    var out = [], seen = {};
    var self = this;
    ranges.forEach(function (r) {
      for (var dx = -r; dx <= r; dx++) {
        var dy = r - Math.abs(dx);
        [[x + dx, y + dy], [x + dx, y - dy]].forEach(function (p) {
          var k = p[0] + ',' + p[1];
          if (seen[k] || !self.inside(p[0], p[1])) return;
          seen[k] = true;
          out.push({ x: p[0], y: p[1] });
        });
      }
    });
    return out;
  };

  /**
   * Tiles this unit could attack after moving: union of rings around every
   * reachable tile. Used for the red danger overlay and for the AI.
   */
  Board.prototype.threatTiles = function (unit, ranges, reach) {
    var rs = ranges || FE.attackRanges(unit);
    if (!rs.length) return {};
    var tiles = reach || this.reachable(unit);
    var out = {};
    for (var i = 0; i < tiles.length; i++) {
      var ring = this.ring(tiles[i].x, tiles[i].y, rs);
      for (var j = 0; j < ring.length; j++) out[ring[j].x + ',' + ring[j].y] = true;
    }
    return out;
  };

  /** Combined threat of every living enemy — the "danger zone" toggle. */
  Board.prototype.dangerZone = function () {
    var out = {};
    var enemies = this.livingUnits('enemy');
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!FE.attackRanges(e).length) continue;
      var t = this.threatTiles(e);
      for (var k in t) out[k] = true;
    }
    return out;
  };

  FE.Board = Board;
})(window.FE);

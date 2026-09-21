/* =============================================================
   render.js — Canvas drawing: terrain, overlays, units, cursor.
   The static terrain is baked once per chapter; only overlays and
   units are redrawn each frame.
   ============================================================= */
(function (FE) {
  'use strict';

  var TS = 32; /* tile size in canvas pixels */
  FE.TS = TS;

  /* Deterministic per-tile noise so terrain detail never flickers. */
  function hash(x, y, s) {
    var n = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  var PAL = {
    grass1: '#54873a', grass2: '#487a31', grass3: '#679d47', grassLit: '#79ad55',
    road: '#b7a173', roadDark: '#9d885a', roadEdge: '#8d7a4e',
    trunk: '#5a3a1f', leaf1: '#2d5a26', leaf2: '#3c7433', leaf3: '#4d8c3e',
    hill: '#77954a', hillLit: '#8dab5c', hillDark: '#5c7838',
    rock: '#7e7e8a', rockDark: '#585865', rockLit: '#9d9daa', snow: '#e9eef6',
    water1: '#2a5c8a', water2: '#356f9f', water3: '#4d8cbd', foam: '#bfe0f2',
    wall: '#3d3849', wallDark: '#272232', wallLit: '#544e66', mortar: '#1d1926',
    wood: '#8a5f36', woodDark: '#5f4022', woodLit: '#a2723f',
    stone: '#90909e', stoneDark: '#6a6a78', stoneLit: '#a8a8b6',
    gold: '#dfb84f', goldDark: '#a07f28', purple: '#6c4a8f', purpleDark: '#432c5c',
    roof: '#ab4530', roofDark: '#7c2d1e', roofLit: '#c45a42',
    plaster: '#d3c19a'
  };

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  /* Terrain families, used to decide where one surface meets another. */
  function family(ch) {
    if (ch === '~') return 'water';
    if (ch === ',' || ch === 'B') return 'path';
    if (ch === '#') return 'wall';
    if (ch === 'm' || ch === 'p') return 'rock';
    return 'land';
  }

  function drawGrass(ctx, px, py, x, y) {
    var tint = hash(x, y, 90);
    rect(ctx, px, py, TS, TS, tint > 0.72 ? PAL.grass3 : (tint < 0.28 ? PAL.grass2 : PAL.grass1));
    for (var i = 0; i < 6; i++) {
      var h1 = hash(x, y, i), h2 = hash(x, y, i + 40);
      var gx = px + Math.floor(h1 * (TS - 4)), gy = py + Math.floor(h2 * (TS - 4));
      rect(ctx, gx, gy + 1, 1, 2, PAL.grass2);
      rect(ctx, gx + 2, gy, 1, 3, h1 > 0.5 ? PAL.grassLit : PAL.grass3);
      rect(ctx, gx + 4, gy + 1, 1, 2, PAL.grass2);
    }
  }

  function drawTree(ctx, tx, ty, seed, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(tx + 4, ty + 15, 6, 2.5, 0, 0, 6.3);
    ctx.fill();
    rect(ctx, tx + 3, ty + 8, 2, 7, PAL.trunk);
    var lean = hash(x, y, seed + 60) > 0.5 ? 1 : 0;
    ctx.fillStyle = PAL.leaf1;
    ctx.beginPath();
    ctx.moveTo(tx + 4, ty - 3); ctx.lineTo(tx + 10, ty + 10); ctx.lineTo(tx - 2, ty + 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = hash(x, y, seed) > 0.5 ? PAL.leaf2 : PAL.leaf3;
    ctx.beginPath();
    ctx.moveTo(tx + 4 - lean, ty - 2); ctx.lineTo(tx + 8, ty + 8); ctx.lineTo(tx + 1, ty + 8);
    ctx.closePath(); ctx.fill();
  }

  /* Water: a still base that gets animated highlights each frame. */
  function drawWaterBase(ctx, px, py, x, y, board) {
    var g = ctx.createLinearGradient(px, py, px, py + TS);
    g.addColorStop(0, PAL.water2);
    g.addColorStop(1, PAL.water1);
    ctx.fillStyle = g;
    ctx.fillRect(px, py, TS, TS);
    /* shoreline wherever water meets something solid */
    if (board) {
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function (d) {
        if (family(board.charAt(x + d[0], y + d[1])) === 'water') return;
        ctx.fillStyle = PAL.foam;
        ctx.globalAlpha = 0.55;
        if (d[1] === -1) ctx.fillRect(px, py, TS, 3);
        else if (d[1] === 1) ctx.fillRect(px, py + TS - 3, TS, 3);
        else if (d[0] === -1) ctx.fillRect(px, py, 3, TS);
        else ctx.fillRect(px + TS - 3, py, 3, TS);
        ctx.globalAlpha = 1;
      });
    }
  }

  function drawTile(ctx, board, x, y) {
    var ch = board.charAt(x, y);
    var px = x * TS, py = y * TS;
    var i, n;

    switch (ch) {
      case '.':
        drawGrass(ctx, px, py, x, y);
        break;

      case ',': {
        drawGrass(ctx, px, py, x, y);
        /* the road narrows where it meets anything that is not a road */
        var pad = { t: 0, r: 0, b: 0, l: 0 };
        if (family(board.charAt(x, y - 1)) !== 'path') pad.t = 2;
        if (family(board.charAt(x, y + 1)) !== 'path') pad.b = 2;
        if (family(board.charAt(x - 1, y)) !== 'path') pad.l = 2;
        if (family(board.charAt(x + 1, y)) !== 'path') pad.r = 2;
        rect(ctx, px + pad.l, py + pad.t, TS - pad.l - pad.r, TS - pad.t - pad.b, PAL.road);
        for (i = 0; i < 10; i++) {
          rect(ctx, px + 3 + Math.floor(hash(x, y, i) * (TS - 8)),
            py + 3 + Math.floor(hash(x, y, i + 70) * (TS - 8)), 2, 2,
            hash(x, y, i + 5) > 0.5 ? PAL.roadDark : PAL.roadEdge);
        }
        break;
      }

      case 'f':
        drawGrass(ctx, px, py, x, y);
        drawTree(ctx, px + 2 + hash(x, y, 1) * 3, py + 9 + hash(x, y, 2) * 3, 1, x, y);
        drawTree(ctx, px + 18 + hash(x, y, 3) * 3, py + 12 + hash(x, y, 4) * 3, 3, x, y);
        drawTree(ctx, px + 10 + hash(x, y, 5) * 3, py + 3 + hash(x, y, 6) * 3, 5, x, y);
        break;

      case 'h': {
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = PAL.hillDark;
        ctx.beginPath();
        ctx.moveTo(px, py + TS); ctx.quadraticCurveTo(px + 15, py + 5, px + TS, py + TS);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.hill;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + TS); ctx.quadraticCurveTo(px + 15, py + 8, px + TS - 2, py + TS);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.hillLit;
        ctx.beginPath();
        ctx.ellipse(px + 13, py + 12, 6, 3, -0.3, 0, 6.3);
        ctx.fill();
        break;
      }

      case 'm':
      case 'p': {
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = PAL.rockDark;
        ctx.beginPath();
        ctx.moveTo(px - 1, py + TS); ctx.lineTo(px + 15, py + 1); ctx.lineTo(px + TS + 1, py + TS);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.rock;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + TS); ctx.lineTo(px + 15, py + 2); ctx.lineTo(px + 23, py + TS);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.rockLit;
        ctx.beginPath();
        ctx.moveTo(px + 15, py + 2); ctx.lineTo(px + 20, py + 13); ctx.lineTo(px + 10, py + 13);
        ctx.closePath(); ctx.fill();
        if (ch === 'p') {
          ctx.fillStyle = PAL.snow;
          ctx.beginPath();
          ctx.moveTo(px + 15, py + 1); ctx.lineTo(px + 20, py + 9);
          ctx.lineTo(px + 16, py + 7); ctx.lineTo(px + 13, py + 10); ctx.lineTo(px + 10, py + 9);
          ctx.closePath(); ctx.fill();
        }
        break;
      }

      case '~':
        drawWaterBase(ctx, px, py, x, y, board);
        break;

      case '#': {
        rect(ctx, px, py, TS, TS, PAL.mortar);
        for (var r = 0; r < 4; r++) {
          var off = (r % 2) * 8;
          for (var c = -1; c < 3; c++) {
            var bx = px + c * 16 + off, by = py + r * 8;
            var bw = 15;
            if (bx + bw <= px || bx >= px + TS) continue;
            var x0 = Math.max(px, bx), x1 = Math.min(px + TS, bx + bw);
            var tone = hash(x, y, r * 4 + c + 2);
            rect(ctx, x0, by, x1 - x0, 7, tone > 0.66 ? PAL.wallLit : (tone < 0.33 ? PAL.wallDark : PAL.wall));
            rect(ctx, x0, by, x1 - x0, 1, 'rgba(255,255,255,0.08)');
          }
        }
        break;
      }

      case 'W':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 3, py + 7, 9, 21, PAL.stoneDark);
        rect(ctx, px + 3, py + 7, 9, 2, PAL.stoneLit);
        rect(ctx, px + 17, py + 12, 11, 16, PAL.stone);
        rect(ctx, px + 17, py + 12, 11, 2, PAL.stoneLit);
        rect(ctx, px + 12, py + 21, 6, 7, PAL.stoneDark);
        break;

      case 'B':
        drawWaterBase(ctx, px, py, x, y, board);
        rect(ctx, px, py + 3, TS, TS - 6, PAL.wood);
        for (var b = 0; b < 4; b++) rect(ctx, px, py + 5 + b * 7, TS, 1, PAL.woodDark);
        rect(ctx, px, py + 3, TS, 2, PAL.woodLit);
        rect(ctx, px, py + TS - 5, TS, 2, PAL.woodDark);
        break;

      case 'F':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 3, py + 9, TS - 6, TS - 11, PAL.stone);
        rect(ctx, px + 3, py + 9, TS - 6, 2, PAL.stoneLit);
        rect(ctx, px + 3, py + 9, 2, TS - 11, PAL.stoneDark);
        for (n = 0; n < 3; n++) {
          rect(ctx, px + 4 + n * 9, py + 4, 6, 6, PAL.stone);
          rect(ctx, px + 4 + n * 9, py + 4, 6, 1, PAL.stoneLit);
        }
        rect(ctx, px + 12, py + 18, 8, 10, PAL.wallDark);
        rect(ctx, px + 12, py + 18, 8, 1, PAL.stoneDark);
        break;

      case 'T':
      case 'G': {
        rect(ctx, px, py, TS, TS, PAL.stoneDark);
        rect(ctx, px + 1, py + 1, TS - 2, TS - 2, PAL.stone);
        rect(ctx, px + 1, py + 1, TS - 2, 2, PAL.stoneLit);
        if (ch === 'T') {
          /* a dais, a seat and a great deal of trouble */
          rect(ctx, px + 5, py + 24, 22, 5, PAL.stoneDark);
          rect(ctx, px + 8, py + 8, 16, 17, PAL.purple);
          rect(ctx, px + 8, py + 8, 16, 2, PAL.gold);
          rect(ctx, px + 10, py + 14, 12, 11, PAL.purpleDark);
          rect(ctx, px + 13, py + 3, 6, 6, PAL.gold);
          rect(ctx, px + 14, py + 4, 4, 4, PAL.goldDark);
        } else {
          rect(ctx, px + 5, py + 5, 22, 24, PAL.wallDark);
          for (var gg = 0; gg < 4; gg++) {
            rect(ctx, px + 7 + gg * 5, py + 7, 2, 20, PAL.gold);
            rect(ctx, px + 7 + gg * 5, py + 7, 2, 1, '#fff3c4');
          }
          for (var gh = 0; gh < 3; gh++) rect(ctx, px + 6, py + 9 + gh * 7, 20, 2, PAL.goldDark);
        }
        break;
      }

      case 'V':
      case 'H':
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + 4, py + 27, 24, 3);
        rect(ctx, px + 5, py + 15, 22, 13, PAL.plaster);
        rect(ctx, px + 5, py + 15, 22, 1, '#eadcc0');
        ctx.fillStyle = PAL.roofDark;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 16); ctx.lineTo(px + 16, py + 3); ctx.lineTo(px + 31, py + 16);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.roof;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 15); ctx.lineTo(px + 16, py + 4); ctx.lineTo(px + 29, py + 15);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.roofLit;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 4); ctx.lineTo(px + 22, py + 10); ctx.lineTo(px + 16, py + 10);
        ctx.closePath(); ctx.fill();
        rect(ctx, px + 13, py + 19, 7, 9, PAL.woodDark);
        rect(ctx, px + 13, py + 19, 7, 1, PAL.woodLit);
        rect(ctx, px + 7, py + 18, 4, 4, '#7fb6de');
        rect(ctx, px + 22, py + 18, 4, 4, '#7fb6de');
        break;

      case 'C':
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + 5, py + 26, 22, 3);
        rect(ctx, px + 6, py + 11, 20, 16, PAL.wood);
        rect(ctx, px + 6, py + 11, 20, 4, PAL.woodLit);
        rect(ctx, px + 6, py + 17, 20, 2, PAL.woodDark);
        rect(ctx, px + 14, py + 16, 5, 6, PAL.gold);
        rect(ctx, px + 15, py + 18, 3, 2, PAL.goldDark);
        break;

      case 'E':
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = '#e8d778';
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 5); ctx.lineTo(px + 27, py + 18); ctx.lineTo(px + 21, py + 18);
        ctx.lineTo(px + 21, py + 28); ctx.lineTo(px + 11, py + 28); ctx.lineTo(px + 11, py + 18);
        ctx.lineTo(px + 5, py + 18); ctx.closePath(); ctx.fill();
        break;

      default:
        drawGrass(ctx, px, py, x, y);
    }

    /* A soft lip where land meets a cliff or a wall reads as height. */
    var below = board.charAt(x, y + 1);
    if ((family(ch) === 'rock' || ch === '#') && family(below) !== 'rock' && below !== '#') {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px, py + TS - 3, TS, 3);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.11)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1);
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.base = null;
    this.floaters = [];
  }

  Renderer.prototype.bake = function (board) {
    var cv = document.createElement('canvas');
    cv.width = board.w * TS;
    cv.height = board.h * TS;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.waterTiles = [];
    for (var y = 0; y < board.h; y++) {
      for (var x = 0; x < board.w; x++) {
        drawTile(ctx, board, x, y);
        var c = board.charAt(x, y);
        if (c === '~' || c === 'B') this.waterTiles.push({ x: x, y: y, bridge: c === 'B' });
      }
    }
    this.base = cv;
    this.canvas.width = cv.width;
    this.canvas.height = cv.height;
    this.ctx.imageSmoothingEnabled = false;
    this.fit();
  };

  /* Scale the canvas up to fill the stage. Pixel art stays crisp because
     the element keeps image-rendering: pixelated. */
  Renderer.prototype.fit = function () {
    var stage = this.canvas.parentElement;
    if (!stage) return;
    var availW = stage.clientWidth - 20;
    var availH = stage.clientHeight - 20;
    if (availW <= 0 || availH <= 0) return;
    var scale = Math.min(availW / this.canvas.width, availH / this.canvas.height);
    scale = Math.max(0.5, scale);
    this.canvas.style.width = Math.floor(this.canvas.width * scale) + 'px';
    this.canvas.style.height = Math.floor(this.canvas.height * scale) + 'px';
  };

  /* Re-bake a single tile (a village becomes a ruin once visited). */
  Renderer.prototype.rebakeTile = function (board, x, y) {
    if (!this.base) return;
    var ctx = this.base.getContext('2d');
    drawTile(ctx, board, x, y);
  };

  /* Water is baked like everything else; the moving glints are painted
     over the top so the map stays a single cached image. */
  Renderer.prototype.drawWaterShimmer = function () {
    if (!this.waterTiles || !this.waterTiles.length) return;
    var ctx = this.ctx;
    var t = Date.now() / 900;
    ctx.save();
    ctx.fillStyle = PAL.water3;
    for (var i = 0; i < this.waterTiles.length; i++) {
      var w = this.waterTiles[i];
      if (w.bridge) continue;
      var px = w.x * TS, py = w.y * TS;
      for (var k = 0; k < 3; k++) {
        var phase = t + hash(w.x, w.y, k) * 6.28;
        var off = (Math.sin(phase) * 0.5 + 0.5) * (TS - 14);
        ctx.globalAlpha = 0.28 + Math.sin(phase * 1.7) * 0.16;
        ctx.fillRect(px + 3 + off, py + 6 + k * 9, 9, 2);
      }
    }
    ctx.restore();
  };

  Renderer.prototype.addFloater = function (x, y, text, color) {
    this.floaters.push({ x: x, y: y, text: text, color: color, t: 0 });
  };

  /* The danger zone overlaps the move and attack overlays, so it is drawn
     as hatching with a hard border rather than another flat wash — otherwise
     every red tile looks the same. */
  function dangerOverlay(ctx, tiles, w, h) {
    var keys = Object.keys(tiles);
    if (!keys.length) return;
    ctx.save();
    ctx.beginPath();
    keys.forEach(function (k) {
      var p = k.split(',');
      ctx.rect(+p[0] * TS, +p[1] * TS, TS, TS);
    });
    ctx.clip();
    ctx.fillStyle = 'rgba(190,30,30,0.13)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,72,58,0.34)';
    ctx.lineWidth = 3;
    for (var i = -h; i < w + h; i += 11) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    ctx.restore();

    /* outline only the rim of the zone */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,92,78,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    keys.forEach(function (k) {
      var p = k.split(',');
      var x = +p[0], y = +p[1];
      var px = x * TS, py = y * TS;
      if (!tiles[x + ',' + (y - 1)]) { ctx.moveTo(px, py + 1); ctx.lineTo(px + TS, py + 1); }
      if (!tiles[x + ',' + (y + 1)]) { ctx.moveTo(px, py + TS - 1); ctx.lineTo(px + TS, py + TS - 1); }
      if (!tiles[(x - 1) + ',' + y]) { ctx.moveTo(px + 1, py); ctx.lineTo(px + 1, py + TS); }
      if (!tiles[(x + 1) + ',' + y]) { ctx.moveTo(px + TS - 1, py); ctx.lineTo(px + TS - 1, py + TS); }
    });
    ctx.stroke();
    ctx.restore();
  }

  function overlay(ctx, tiles, fill, stroke) {
    ctx.save();
    for (var k in tiles) {
      var p = k.split(',');
      var px = +p[0] * TS, py = +p[1] * TS;
      ctx.fillStyle = fill;
      ctx.fillRect(px, py, TS, TS);
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1);
      }
    }
    ctx.restore();
  }

  Renderer.prototype.drawUnit = function (u, px, py, opts) {
    var ctx = this.ctx;
    opts = opts || {};
    var cls = FE.CLASSES[u.cls];
    var sprite = FE.getSprite(cls.sprite, u.team, 2, u.hair);

    ctx.save();
    if (opts.ghost) ctx.globalAlpha = 0.45;
    if (u.acted && !opts.noGrey) {
      ctx.globalAlpha = (opts.ghost ? 0.4 : 0.85);
      ctx.filter = 'grayscale(1) brightness(0.8)';
    }
    /* drop shadow keeps units legible on busy terrain */
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + TS / 2, py + TS - 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (opts.ring) {
      var pulse = 0.55 + Math.sin(Date.now() / 220) * 0.3;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = opts.ring;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px + TS / 2, py + TS - 4, 13, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.drawImage(sprite, px, py + (opts.bob || 0));
    ctx.restore();

    if (opts.ghost) return;

    /* team pip + HP bar */
    var barW = 24, hpPct = Math.max(0, u.hp / FE.maxHp(u));
    var bx = px + (TS - barW) / 2, by = py + TS - 5;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, 5);
    ctx.fillStyle = u.team === 'player' ? '#3fa9f5' : (u.team === 'enemy' ? '#e8483a' : '#45c46a');
    ctx.fillRect(bx, by, Math.round(barW * hpPct), 3);
    if (hpPct < 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(bx + Math.round(barW * hpPct), by, barW - Math.round(barW * hpPct), 3);
    }
    if (u.boss) {
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.moveTo(px + TS - 6, py + 2); ctx.lineTo(px + TS - 2, py + 8);
      ctx.lineTo(px + TS - 10, py + 8); ctx.closePath(); ctx.fill();
    }
    if (u.talk) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('!', px + 3, py + 10);
    }
  };

  /**
   * view = {
   *   board, moveTiles, attackTiles, staffTiles, danger, path,
   *   cursor:{x,y}, hideUnit, ghost:{unit,x,y}, anim:{unit,px,py}, blink
   * }
   */
  Renderer.prototype.draw = function (view) {
    var ctx = this.ctx, board = view.board;
    if (!this.base) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.base, 0, 0);
    this.drawWaterShimmer();

    if (view.danger) dangerOverlay(ctx, view.danger, this.canvas.width, this.canvas.height);
    if (view.moveTiles) overlay(ctx, view.moveTiles, 'rgba(46,124,240,0.42)', 'rgba(160,205,255,0.6)');
    if (view.attackTiles) overlay(ctx, view.attackTiles, 'rgba(226,44,34,0.42)', 'rgba(255,140,128,0.6)');
    if (view.staffTiles) overlay(ctx, view.staffTiles, 'rgba(56,214,172,0.36)', 'rgba(150,255,230,0.55)');

    /* movement path arrow */
    if (view.path && view.path.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ffe37a';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i < view.path.length; i++) {
        var p = view.path[i];
        var cx = p.x * TS + TS / 2, cy = p.y * TS + TS / 2;
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      var last = view.path[view.path.length - 1];
      var prev = view.path[view.path.length - 2];
      var dx = last.x - prev.x, dy = last.y - prev.y;
      var hx = last.x * TS + TS / 2, hy = last.y * TS + TS / 2;
      ctx.fillStyle = '#ffe37a';
      ctx.beginPath();
      ctx.moveTo(hx + dx * 9, hy + dy * 9);
      ctx.lineTo(hx - dy * 7 - dx * 2, hy - dx * 7 - dy * 2);
      ctx.lineTo(hx + dy * 7 - dx * 2, hy + dx * 7 - dy * 2);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /* units, sorted so lower rows overlap higher ones */
    var units = board.livingUnits().slice().sort(function (a, b) { return a.y - b.y; });
    for (var u = 0; u < units.length; u++) {
      var unit = units[u];
      if (view.hideUnit === unit) continue;
      var bob = 0, ring = null;
      if (view.blinkUnit === unit) {
        bob = Math.sin(Date.now() / 160) * 2;
        ring = unit.team === 'player' ? '#9cc8ff' : '#ff9a8c';
      }
      this.drawUnit(unit, unit.x * TS, unit.y * TS, { bob: bob, ring: ring });
    }
    if (view.ghost) {
      this.drawUnit(view.ghost.unit, view.ghost.x * TS, view.ghost.y * TS, { ghost: true });
    }
    if (view.anim) {
      this.drawUnit(view.anim.unit, view.anim.px, view.anim.py, { noGrey: true });
    }

    /* the ground a defend map tells you to hold */
    if (view.objectiveTile) {
      var ox = view.objectiveTile.x * TS, oy = view.objectiveTile.y * TS;
      var beat = 0.5 + Math.sin(Date.now() / 300) * 0.35;
      ctx.save();
      ctx.globalAlpha = beat;
      ctx.strokeStyle = '#ffd45e';
      ctx.lineWidth = 3;
      ctx.strokeRect(ox + 2, oy + 2, TS - 4, TS - 4);
      ctx.globalAlpha = beat * 0.3;
      ctx.fillStyle = '#ffd45e';
      ctx.fillRect(ox, oy, TS, TS);
      ctx.restore();
    }

    /* cursor */
    if (view.cursor) {
      var cx2 = view.cursor.x * TS, cy2 = view.cursor.y * TS;
      var pulse = 1 + Math.sin(Date.now() / 200) * 0.12;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      var pad = 2 * pulse;
      ctx.strokeRect(cx2 + pad, cy2 + pad, TS - pad * 2, TS - pad * 2);
      ctx.strokeStyle = '#1b1726';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx2 + pad - 1.5, cy2 + pad - 1.5, TS - pad * 2 + 3, TS - pad * 2 + 3);
      ctx.restore();
    }

    /* floating damage / heal numbers */
    var keep = [];
    for (var f = 0; f < this.floaters.length; f++) {
      var fl = this.floaters[f];
      fl.t += 1;
      if (fl.t > 55) continue;
      keep.push(fl);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - fl.t / 55);
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#120f1a';
      var fx = fl.x * TS + TS / 2, fy = fl.y * TS + 14 - fl.t * 0.45;
      ctx.strokeText(fl.text, fx, fy);
      ctx.fillStyle = fl.color;
      ctx.fillText(fl.text, fx, fy);
      ctx.restore();
    }
    this.floaters = keep;
  };

  FE.Renderer = Renderer;
})(window.FE);

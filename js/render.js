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
    grass1: '#5a8a3c', grass2: '#4d7a33', grass3: '#6b9a46',
    road: '#b39b6e', roadDark: '#9c854c',
    forest: '#2f5a28', forestLeaf: '#3f7a33',
    hill: '#77954a', hillDark: '#5e7a3a',
    rock: '#7b7b86', rockDark: '#5a5a64', rockLight: '#9a9aa6',
    water: '#2a5c8a', waterLight: '#3b76a8',
    wall: '#3a3543', wallDark: '#262130', wallLight: '#4d4759',
    wood: '#8a5f36', woodDark: '#6a4526',
    stone: '#8e8e9c', stoneDark: '#6b6b78',
    gold: '#d8b34a', purple: '#6a4a8a',
    roof: '#a8452f', roofDark: '#7d2f1f'
  };

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function drawGrass(ctx, px, py, x, y) {
    rect(ctx, px, py, TS, TS, PAL.grass1);
    for (var i = 0; i < 7; i++) {
      var h1 = hash(x, y, i), h2 = hash(x, y, i + 40);
      rect(ctx, px + Math.floor(h1 * (TS - 3)), py + Math.floor(h2 * (TS - 3)), 3, 2,
        h1 > 0.5 ? PAL.grass2 : PAL.grass3);
    }
  }

  function drawTile(ctx, ch, x, y) {
    var px = x * TS, py = y * TS;
    switch (ch) {
      case '.':
        drawGrass(ctx, px, py, x, y);
        break;
      case ',':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px, py, TS, TS, PAL.road);
        for (var i = 0; i < 9; i++) {
          rect(ctx, px + Math.floor(hash(x, y, i) * (TS - 3)),
            py + Math.floor(hash(x, y, i + 70) * (TS - 3)), 3, 2, PAL.roadDark);
        }
        break;
      case 'f':
        drawGrass(ctx, px, py, x, y);
        for (var t = 0; t < 3; t++) {
          var tx = px + 4 + t * 9 + Math.floor(hash(x, y, t) * 3);
          var ty = py + 6 + Math.floor(hash(x, y, t + 9) * 8);
          ctx.fillStyle = PAL.woodDark;
          ctx.fillRect(tx + 3, ty + 8, 2, 6);
          ctx.fillStyle = t % 2 ? PAL.forest : PAL.forestLeaf;
          ctx.beginPath();
          ctx.moveTo(tx + 4, ty - 2); ctx.lineTo(tx + 9, ty + 9); ctx.lineTo(tx - 1, ty + 9);
          ctx.closePath(); ctx.fill();
        }
        break;
      case 'h':
        rect(ctx, px, py, TS, TS, PAL.hill);
        ctx.fillStyle = PAL.hillDark;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + TS - 4); ctx.lineTo(px + 11, py + 12);
        ctx.lineTo(px + 20, py + TS - 4); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 14, py + TS - 4); ctx.lineTo(px + 23, py + 16);
        ctx.lineTo(px + TS - 1, py + TS - 4); ctx.closePath(); ctx.fill();
        break;
      case 'm':
      case 'p':
        rect(ctx, px, py, TS, TS, PAL.hillDark);
        ctx.fillStyle = PAL.rock;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + TS); ctx.lineTo(px + 16, py + 3); ctx.lineTo(px + TS - 1, py + TS);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = PAL.rockLight;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 3); ctx.lineTo(px + 22, py + 13); ctx.lineTo(px + 10, py + 13);
        ctx.closePath(); ctx.fill();
        if (ch === 'p') { rect(ctx, px + 13, py + 4, 6, 4, '#e8eef5'); }
        ctx.fillStyle = PAL.rockDark;
        ctx.beginPath();
        ctx.moveTo(px + TS, py + TS); ctx.lineTo(px + 24, py + 10); ctx.lineTo(px + 14, py + TS);
        ctx.closePath(); ctx.fill();
        break;
      case '~':
        rect(ctx, px, py, TS, TS, PAL.water);
        for (var w = 0; w < 3; w++) {
          var wx = px + 3 + Math.floor(hash(x, y, w) * 18);
          var wy = py + 5 + w * 9 + Math.floor(hash(x, y, w + 5) * 3);
          rect(ctx, wx, wy, 9, 2, PAL.waterLight);
          rect(ctx, wx + 11, wy + 3, 5, 2, PAL.waterLight);
        }
        break;
      case '#':
        rect(ctx, px, py, TS, TS, PAL.wallDark);
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 2; c++) {
            var ox = (r % 2) * 8;
            rect(ctx, px + c * 16 + ox - (ox ? 8 : 0), py + r * 8, 15, 7,
              hash(x, y, r * 4 + c) > 0.5 ? PAL.wall : PAL.wallLight);
          }
        }
        break;
      case 'W':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 3, py + 8, 9, 20, PAL.stoneDark);
        rect(ctx, px + 18, py + 12, 10, 16, PAL.stone);
        rect(ctx, px + 12, py + 20, 7, 8, PAL.stoneDark);
        break;
      case 'B':
        rect(ctx, px, py, TS, TS, PAL.water);
        rect(ctx, px, py + 2, TS, TS - 4, PAL.wood);
        for (var b = 0; b < 4; b++) rect(ctx, px, py + 3 + b * 7, TS, 2, PAL.woodDark);
        rect(ctx, px, py + 2, TS, 2, PAL.stoneDark);
        rect(ctx, px, py + TS - 4, TS, 2, PAL.stoneDark);
        break;
      case 'F':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 3, py + 8, TS - 6, TS - 10, PAL.stone);
        rect(ctx, px + 3, py + 8, TS - 6, 3, PAL.stoneDark);
        for (var m = 0; m < 3; m++) rect(ctx, px + 4 + m * 9, py + 4, 6, 5, PAL.stone);
        rect(ctx, px + 12, py + 18, 8, 10, PAL.wallDark);
        break;
      case 'T':
      case 'G':
        rect(ctx, px, py, TS, TS, PAL.stoneDark);
        rect(ctx, px + 2, py + 2, TS - 4, TS - 4, PAL.stone);
        if (ch === 'T') {
          rect(ctx, px + 8, py + 6, 16, 20, PAL.purple);
          rect(ctx, px + 10, py + 4, 12, 4, PAL.gold);
          rect(ctx, px + 11, py + 16, 10, 10, '#4a3266');
        } else {
          rect(ctx, px + 6, py + 6, 20, 22, PAL.wallDark);
          for (var g = 0; g < 4; g++) rect(ctx, px + 8 + g * 5, py + 8, 2, 18, PAL.gold);
        }
        break;
      case 'V':
      case 'H':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 5, py + 14, 22, 14, '#c9b48c');
        ctx.fillStyle = PAL.roof;
        ctx.beginPath();
        ctx.moveTo(px + 2, py + 15); ctx.lineTo(px + 16, py + 4); ctx.lineTo(px + 30, py + 15);
        ctx.closePath(); ctx.fill();
        rect(ctx, px + 13, py + 19, 7, 9, PAL.woodDark);
        rect(ctx, px + 7, py + 18, 4, 4, '#6fa8d8');
        break;
      case 'C':
        drawGrass(ctx, px, py, x, y);
        rect(ctx, px + 6, py + 12, 20, 15, PAL.wood);
        rect(ctx, px + 6, py + 12, 20, 4, PAL.woodDark);
        rect(ctx, px + 14, py + 16, 5, 7, PAL.gold);
        break;
      case 'E':
        drawGrass(ctx, px, py, x, y);
        ctx.fillStyle = '#e0d070';
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 6); ctx.lineTo(px + 26, py + 18); ctx.lineTo(px + 20, py + 18);
        ctx.lineTo(px + 20, py + 27); ctx.lineTo(px + 12, py + 27); ctx.lineTo(px + 12, py + 18);
        ctx.lineTo(px + 6, py + 18); ctx.closePath(); ctx.fill();
        break;
      default:
        drawGrass(ctx, px, py, x, y);
    }
    /* subtle grid so ranges are easy to count */
    ctx.strokeStyle = 'rgba(0,0,0,0.13)';
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
    for (var y = 0; y < board.h; y++) {
      for (var x = 0; x < board.w; x++) drawTile(ctx, board.charAt(x, y), x, y);
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
    drawTile(ctx, board.charAt(x, y), x, y);
  };

  Renderer.prototype.addFloater = function (x, y, text, color) {
    this.floaters.push({ x: x, y: y, text: text, color: color, t: 0 });
  };

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
    ctx.globalAlpha *= 1;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(px + TS / 2, py + TS - 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
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

    if (view.danger) overlay(ctx, view.danger, 'rgba(210,40,40,0.24)', 'rgba(255,90,90,0.25)');
    if (view.moveTiles) overlay(ctx, view.moveTiles, 'rgba(60,140,255,0.38)', 'rgba(150,200,255,0.55)');
    if (view.attackTiles) overlay(ctx, view.attackTiles, 'rgba(230,50,40,0.38)', 'rgba(255,130,120,0.5)');
    if (view.staffTiles) overlay(ctx, view.staffTiles, 'rgba(70,220,180,0.34)', 'rgba(150,255,230,0.5)');

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
      var bob = 0;
      if (view.blinkUnit === unit) bob = Math.sin(Date.now() / 160) * 2;
      this.drawUnit(unit, unit.x * TS, unit.y * TS, { bob: bob });
    }
    if (view.ghost) {
      this.drawUnit(view.ghost.unit, view.ghost.x * TS, view.ghost.y * TS, { ghost: true });
    }
    if (view.anim) {
      this.drawUnit(view.anim.unit, view.anim.px, view.anim.py, { noGrey: true });
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

/* =============================================================
   battle.js — The side-view duel scene.

   When two units fight, the map fades back and the fight plays out
   as a proper cutaway: both combatants drawn large, a background
   built from the defender's terrain, wind-up, lunge, impact, recoil.
   Ranged weapons fire a projectile instead of closing.
   ============================================================= */
(function (FE) {
  'use strict';

  var W = 720, H = 296;          /* logical canvas size */
  var GROUND = 240;              /* y of the ground line */
  var LEFT_X = 185, RIGHT_X = 530;
  var SPRITE_PX = 8;             /* 16x16 matrix -> 128x128 */

  var scene = null;

  /* ---------- background -------------------------------------- */
  var SKY = {
    day:    ['#20304f', '#5878a8', '#8fb0cf'],
    dusk:   ['#2a1f3e', '#7a4a5e', '#d08a6a'],
    forest: ['#132a1d', '#2a4c33', '#4e7a52'],
    stone:  ['#1f1c2c', '#3d3651', '#6a5f84'],
    water:  ['#14263c', '#2c557c', '#5b92bd'],
    peak:   ['#243050', '#4c5f8c', '#93a5c6']
  };

  /* Each terrain gets its own horizon silhouette, ground colour and
     scatter, so a fight in a forest never looks like a fight on a bridge. */
  function backdropFor(ch) {
    switch (ch) {
      case 'f': return { sky:'forest', horizon:'trees',   ground:'#2d5226', grass:'#3d6b31', scatter:'ferns' };
      case 'm': case 'p': return { sky:'peak', horizon:'peaks', ground:'#5f5f6b', grass:'#71717d', scatter:'rocks' };
      case 'h': return { sky:'day', horizon:'hills', ground:'#6d8a45', grass:'#7f9c53', scatter:'grass' };
      case '~': return { sky:'water', horizon:'hills', ground:'#2a5c8a', grass:'#3b76a8', scatter:'waves' };
      case 'B': return { sky:'water', horizon:'hills', ground:'#7a5330', grass:'#8a5f36', scatter:'planks' };
      case '#': case 'W': return { sky:'stone', horizon:'wall', ground:'#464152', grass:'#544e63', scatter:'rubble' };
      case 'F': return { sky:'stone', horizon:'wall', ground:'#6f6f7c', grass:'#7d7d8a', scatter:'rubble' };
      case 'T': case 'G': return { sky:'dusk', horizon:'castle', ground:'#6a6676', grass:'#787484', scatter:'rubble' };
      case 'V': case 'H': return { sky:'dusk', horizon:'village', ground:'#527f37', grass:'#5f9040', scatter:'grass' };
      case ',': return { sky:'day', horizon:'hills', ground:'#a8905f', grass:'#b39b6e', scatter:'grass' };
      default: return { sky:'day', horizon:'hills', ground:'#4f7d34', grass:'#5a8a3c', scatter:'grass' };
    }
  }

  function hash(i, s) {
    var n = (i * 374761393 + (s || 0) * 668265263) | 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  /* Lighten or darken a #rrggbb by a fraction. */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt)))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  /* --- horizon silhouettes, drawn in two parallax layers --- */
  function silhouette(ctx, kind, y, scale, alpha, seedOff) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    var i, x;
    if (kind === 'peaks') {
      for (i = 0; i < 8; i++) {
        x = i * 100 - 40 + hash(i, 3 + seedOff) * 50;
        var ph = (70 + hash(i, 7 + seedOff) * 80) * scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 52 * scale, y - ph);
        ctx.lineTo(x + 104 * scale, y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'hills') {
      ctx.beginPath();
      ctx.moveTo(-10, y);
      for (x = -10; x <= W + 10; x += 12) {
        var hy = y - (26 + Math.sin(x / 90 + seedOff) * 16 + Math.sin(x / 37 + seedOff * 2) * 7) * scale;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(W + 10, y);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'trees') {
      for (i = 0; i < 16; i++) {
        x = i * 48 - 20 + hash(i, 11 + seedOff) * 24;
        var th = (80 + hash(i, 13 + seedOff) * 70) * scale;
        ctx.fillRect(x + 7 * scale, y - th * 0.3, 5 * scale, th * 0.3);
        ctx.beginPath();
        ctx.moveTo(x + 9 * scale, y - th);
        ctx.lineTo(x + 30 * scale, y - th * 0.25);
        ctx.lineTo(x - 12 * scale, y - th * 0.25);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'wall') {
      var wallTop = y - 70 * scale;
      ctx.fillRect(0, wallTop, W, y - wallTop);
      ctx.clearRect(0, 0, 0, 0);
      for (i = 0; i * 44 < W; i++) {
        ctx.fillRect(i * 44, wallTop - 16 * scale, 26 * scale, 16 * scale);
      }
    } else if (kind === 'castle') {
      var ct = y - 96 * scale;
      ctx.fillRect(0, y - 56 * scale, W, 56 * scale);
      [90, 300, 520].forEach(function (tx, n) {
        var tw = 84 * scale, th2 = (96 + n % 2 * 26) * scale;
        ctx.fillRect(tx, y - th2, tw, th2);
        for (var m = 0; m * 22 * scale < tw; m++) {
          ctx.fillRect(tx + m * 22 * scale, y - th2 - 14 * scale, 13 * scale, 14 * scale);
        }
      });
    } else if (kind === 'village') {
      for (i = 0; i < 6; i++) {
        x = i * 130 - 30 + hash(i, 17 + seedOff) * 40;
        var bw = 70 * scale, bh = (46 + hash(i, 19 + seedOff) * 22) * scale;
        ctx.fillRect(x, y - bh, bw, bh);
        ctx.beginPath();
        ctx.moveTo(x - 8 * scale, y - bh);
        ctx.lineTo(x + bw / 2, y - bh - 30 * scale);
        ctx.lineTo(x + bw + 8 * scale, y - bh);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawBackdrop(ctx, bd) {
    var sky = SKY[bd.sky] || SKY.day;
    var g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, sky[0]);
    g.addColorStop(0.62, sky[1]);
    g.addColorStop(1, sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND);

    /* a low sun or moon, only where a sky would actually show one, and
       dim enough that the silhouettes in front of it still read */
    if (bd.sky === 'day' || bd.sky === 'dusk' || bd.sky === 'peak') {
      ctx.save();
      var warm = bd.sky === 'dusk';
      var sg = ctx.createRadialGradient(W * 0.79, GROUND - 168, 8, W * 0.79, GROUND - 168, 96);
      sg.addColorStop(0, warm ? 'rgba(255,214,160,0.30)' : 'rgba(232,240,255,0.22)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(W * 0.79 - 96, GROUND - 264, 192, 192);
      ctx.restore();
    }

    /* two parallax layers: far and near */
    silhouette(ctx, bd.horizon, GROUND + 2, 1.15, 0.16, 0);
    silhouette(ctx, bd.horizon, GROUND + 4, 0.75, 0.26, 3);

    /* ground, shaded so it recedes toward the horizon */
    var gg = ctx.createLinearGradient(0, GROUND, 0, H);
    gg.addColorStop(0, bd.grass);
    gg.addColorStop(0.25, bd.ground);
    gg.addColorStop(1, shade(bd.ground, -0.3));
    ctx.fillStyle = gg;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(0, GROUND, W, 2);

    /* ground scatter */
    var n;
    for (n = 0; n < 70; n++) {
      var gx = hash(n, 23) * W;
      var gy = GROUND + 8 + hash(n, 29) * (H - GROUND - 12);
      var sz = 3 + hash(n, 31) * 7;
      if (bd.scatter === 'waves') {
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(gx, gy, sz * 3, 2);
      } else if (bd.scatter === 'planks') {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, GROUND + 12 + (n % 5) * 13, W, 2);
      } else if (bd.scatter === 'rocks' || bd.scatter === 'rubble') {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.ellipse(gx, gy, sz, sz * 0.55, 0, 0, 6.3);
        ctx.fill();
      } else if (bd.scatter === 'ferns') {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(gx, gy - sz, 2, sz);
        ctx.fillRect(gx - 3, gy - sz * 0.6, 8, 2);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.13)';
        ctx.fillRect(gx, gy, sz, 2);
      }
    }

    /* vignette keeps the eye on the fighters */
    var vg = ctx.createRadialGradient(W / 2, GROUND - 50, 90, W / 2, GROUND - 50, W * 0.66);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.65, 'rgba(0,0,0,0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---------- combatant drawing -------------------------------- */
  function drawFighter(ctx, f, t) {
    var cls = FE.CLASSES[f.unit.cls];
    var sprite = FE.getSprite(cls.sprite, f.unit.team, SPRITE_PX, f.unit.hair);
    var x = f.baseX + f.offset * f.facing;
    var breathe = Math.sin(t / 420 + f.phase) * 1.6;
    var y = GROUND - sprite.height + 6 + f.hop + breathe;

    ctx.save();
    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND + 2, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y + sprite.height);
    ctx.scale(f.facing, 1);
    ctx.translate(0, -sprite.height);
    if (f.shake) ctx.translate(Math.sin(t / 22) * f.shake, 0);

    if (f.flash > 0) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite, -sprite.width / 2, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,' + f.flash + ')';
      ctx.fillRect(-sprite.width / 2, 0, sprite.width, sprite.height);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, -sprite.width / 2, 0);
    }
    ctx.restore();
  }

  /* A slash arc or an impact burst, depending on the weapon. */
  function drawEffect(ctx, fx) {
    if (!fx || fx.life <= 0) return;
    var p = 1 - fx.life / fx.max;
    ctx.save();
    ctx.translate(fx.x, fx.y);
    if (fx.kind === 'slash') {
      ctx.rotate(fx.facing > 0 ? -0.5 : 0.5 + Math.PI);
      ctx.globalAlpha = Math.sin(p * Math.PI);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 7 - p * 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 44 + p * 18, -0.9 + p * 1.6, 0.9 + p * 1.6);
      ctx.stroke();
    } else if (fx.kind === 'burst') {
      ctx.globalAlpha = 1 - p;
      for (var i = 0; i < 9; i++) {
        var a = (i / 9) * Math.PI * 2 + fx.seed;
        var d = 12 + p * 52;
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.7, 5 - p * 4, 0, 6.3);
        ctx.fill();
      }
    } else if (fx.kind === 'magic') {
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      for (var r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, 14 + r * 16 + p * 40, 0, 6.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawProjectile(ctx, pr) {
    if (!pr) return;
    var x = pr.from + (pr.to - pr.from) * pr.t;
    var y = pr.y - Math.sin(pr.t * Math.PI) * 26;
    ctx.save();
    if (pr.kind === 'arrow') {
      ctx.strokeStyle = '#e8d9b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 16 * pr.dir, y + 4 * pr.dir);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = '#cfd8e6';
      ctx.beginPath();
      ctx.moveTo(x + 8 * pr.dir, y);
      ctx.lineTo(x - 2 * pr.dir, y - 4);
      ctx.lineTo(x - 2 * pr.dir, y + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      var g = ctx.createRadialGradient(x, y, 2, x, y, 16);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, pr.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- HP plates (DOM, so the text stays crisp) ---------- */
  function plateHtml(side, unit, weaponStack, triangle) {
    var it = weaponStack ? FE.item(weaponStack) : null;
    var tri = triangle === 1 ? '<span class="bp__tri bp__tri--up">&#9650;</span>'
      : (triangle === -1 ? '<span class="bp__tri bp__tri--down">&#9660;</span>' : '');
    return '<div class="bplate bplate--' + side + ' ' + FE.UI.teamClass(unit) + '">'
      + '<div class="bp__top"><b>' + FE.UI.esc(unit.name) + '</b>'
      + '<span>' + FE.UI.esc(FE.CLASSES[unit.cls].name) + '</span></div>'
      + '<div class="bp__weapon">' + (it ? FE.UI.esc(it.name) + tri : '<em>unarmed</em>') + '</div>'
      + '<div class="bp__hp"><span class="bp__num">' + unit.hp + '</span>'
      + '<div class="bp__bar"><i style="width:' + (unit.hp / FE.maxHp(unit) * 100) + '%"></i></div></div>'
      + '</div>';
  }

  function updatePlate(el, unit) {
    if (!el) return;
    el.querySelector('.bp__num').textContent = unit.hp;
    el.querySelector('.bp__bar i').style.width = (unit.hp / FE.maxHp(unit) * 100) + '%';
    el.classList.toggle('bplate--dead', unit.hp <= 0);
  }

  /* ---------- the scene ---------------------------------------- */
  function ensureDom() {
    var host = document.getElementById('battleScene');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'battleScene';
    host.className = 'battle';
    host.innerHTML =
      '<div class="battle__frame">'
      + '<canvas id="battleCanvas" width="' + W + '" height="' + H + '"></canvas>'
      + '<div class="battle__plates"></div>'
      + '<div class="battle__banner"></div>'
      + '<div class="battle__skip">click or press Esc to skip</div>'
      + '</div>';
    document.body.appendChild(host);
    return host;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }

  /**
   * Plays one exchange.
   * opts = { board, attacker, defender, result, speed }
   * `result` is the object FE.resolveCombat returned; HP must already be
   * rewound to the pre-combat values by the caller.
   */
  FE.playBattle = function (opts) {
    return new Promise(function (resolve) {
      var host = ensureDom();
      var canvas = host.querySelector('#battleCanvas');
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      var platesHost = host.querySelector('.battle__plates');
      var banner = host.querySelector('.battle__banner');

      var A = opts.attacker, D = opts.defender;
      var f = opts.result.forecast;
      var tri = 0;
      if (f.a.weapon && f.d.weapon) {
        var at = FE.item(f.a.weapon).type, dt = FE.item(f.d.weapon).type;
        if (FE.TRIANGLE[at] === dt) tri = 1;
        else if (FE.TRIANGLE[dt] === at) tri = -1;
      }
      platesHost.innerHTML = plateHtml('left', A, f.a.weapon, tri)
        + plateHtml('right', D, f.d.weapon, -tri);
      var plateA = platesHost.querySelector('.bplate--left');
      var plateD = platesHost.querySelector('.bplate--right');

      var bd = backdropFor(opts.board.charAt(D.x, D.y));
      var fighters = {
        a: { unit: A, baseX: LEFT_X, facing: 1, offset: 0, hop: 0, flash: 0, shake: 0, phase: 0 },
        d: { unit: D, baseX: RIGHT_X, facing: -1, offset: 0, hop: 0, flash: 0, shake: 0, phase: 2.1 }
      };

      var effects = [];
      var projectile = null;
      var shakeScreen = 0;
      var flashScreen = 0;
      var floaters = [];
      var speed = opts.speed || 1;
      var skipped = false;

      host.classList.add('is-open');

      function skip() { skipped = true; }
      host.addEventListener('click', skip);
      function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); }
      document.addEventListener('keydown', onKey);

      /* ---- build the timeline ---- */
      var steps = [];
      steps.push({ t: 'wait', ms: 260 });
      opts.result.events.forEach(function (ev) {
        steps.push({ t: 'strike', ev: ev });
      });
      steps.push({ t: 'wait', ms: 420 });

      var i = 0;
      var running = null;
      var last = performance.now();

      function weaponColor(type) {
        return ({
          sword: '#dfe6f2', lance: '#cfe0f0', axe: '#f0d8a8', bow: '#e8d9b0',
          anima: '#ff8a4c', light: '#ffe98a', dark: '#c38aff', staff: '#8ed4c5'
        })[type] || '#ffffff';
      }

      function startStrike(ev) {
        var who = ev.who;
        var src = who === 'a' ? fighters.a : fighters.d;
        var tgt = who === 'a' ? fighters.d : fighters.a;
        var sideInfo = who === 'a' ? f.a : f.d;
        var it = sideInfo.weapon ? FE.item(sideInfo.weapon) : null;
        var ranged = it && (it.min > 1 || it.magic || it.kind === 'staff');
        var phase = 0, elapsed = 0;

        return function (dt) {
          elapsed += dt;
          var windup = 200, travel = ranged ? 420 : 200, recover = 260;

          if (phase === 0) {                       /* wind up */
            var p = Math.min(1, elapsed / windup);
            src.offset = -18 * easeOut(p);
            if (ev.crit && p > 0.5) src.flash = (p - 0.5) * 0.8;
            if (p >= 1) { phase = 1; elapsed = 0; src.flash = 0;
              if (ranged) {
                projectile = {
                  from: src.baseX + 40 * src.facing, to: tgt.baseX - 30 * src.facing,
                  y: GROUND - 58, t: 0, dir: src.facing,
                  kind: it.magic || it.kind === 'staff' ? 'orb' : 'arrow',
                  color: weaponColor(it.type)
                };
              }
            }
            return false;
          }

          if (phase === 1) {                       /* close or fire */
            var p2 = Math.min(1, elapsed / travel);
            if (ranged) {
              if (projectile) projectile.t = p2;
              src.offset = -18 * (1 - p2);
            } else {
              src.offset = -18 + (Math.abs(tgt.baseX - src.baseX) - 96) * easeIn(p2);
            }
            if (p2 >= 1) {
              phase = 2; elapsed = 0;
              projectile = null;
              impact(ev, src, tgt, it);
            }
            return false;
          }

          /* recover */
          var p3 = Math.min(1, elapsed / recover);
          src.offset = src.offset * (1 - easeOut(p3));
          if (p3 >= 1) { src.offset = 0; return true; }
          return false;
        };
      }

      function impact(ev, src, tgt, it) {
        var fxX = tgt.baseX, fxY = GROUND - 58;
        if (!ev.hit) {
          tgt.hop = -22;
          floaters.push({ x: fxX, y: fxY, text: 'MISS', color: '#d8d8e4', life: 46, max: 46 });
          setTimeout(function () { tgt.hop = 0; }, 180 / speed);
          return;
        }
        var kind = it && (it.magic || it.kind === 'staff') ? 'magic'
          : (it && it.min > 1 ? 'burst' : 'slash');
        effects.push({
          kind: kind, x: fxX, y: fxY, facing: src.facing,
          color: weaponColor(it ? it.type : 'sword'),
          life: 26, max: 26, seed: Math.random() * 6
        });
        tgt.flash = 1;
        tgt.shake = ev.crit ? 7 : 4;
        shakeScreen = ev.crit ? 14 : 6;
        if (ev.crit) flashScreen = 0.85;

        var target = ev.who === 'a' ? D : A;
        target.hp = Math.max(0, target.hp - ev.dmg);
        if (ev.drain) {
          var healer = ev.who === 'a' ? A : D;
          healer.hp = Math.min(FE.maxHp(healer), healer.hp + ev.drain);
          floaters.push({ x: src.baseX, y: fxY, text: '+' + ev.drain, color: '#7ce38b', life: 50, max: 50 });
        }
        updatePlate(ev.who === 'a' ? plateD : plateA, target);
        floaters.push({
          x: fxX, y: fxY, text: (ev.crit ? '' : '') + ev.dmg,
          color: ev.crit ? '#ffd166' : '#ff8a7a',
          life: 52, max: 52, big: ev.crit
        });
        if (ev.crit) {
          banner.textContent = 'CRITICAL!';
          banner.classList.add('is-show');
          setTimeout(function () { banner.classList.remove('is-show'); }, 700 / speed);
        }
        setTimeout(function () { tgt.flash = 0; tgt.shake = 0; }, 220 / speed);
      }

      function finish() {
        host.classList.remove('is-open');
        host.removeEventListener('click', skip);
        document.removeEventListener('keydown', onKey);
        scene = null;
        resolve();
      }

      function frame(now) {
        var dt = Math.min(64, Math.max(0, now - last)) * speed;
        last = now;

        if (skipped) {
          /* apply whatever is left instantly, then close */
          for (; i < steps.length; i++) {
            var s = steps[i];
            if (s.t !== 'strike' || !s.ev.hit) continue;
            var target = s.ev.who === 'a' ? D : A;
            if (s.ev.applied) continue;
            target.hp = Math.max(0, target.hp - s.ev.dmg);
            if (s.ev.drain) {
              var h = s.ev.who === 'a' ? A : D;
              h.hp = Math.min(FE.maxHp(h), h.hp + s.ev.drain);
            }
          }
          finish();
          return;
        }

        if (!running) {
          var step = steps[i];
          if (!step) { finish(); return; }
          if (step.t === 'wait') {
            var left = step.ms;
            running = function (d) { left -= d; return left <= 0; };
          } else {
            /* a dead unit stops swinging */
            if (A.hp <= 0 || D.hp <= 0) { i++; running = null; requestAnimationFrame(frame); return; }
            step.ev.applied = true;
            running = startStrike(step.ev);
          }
        }

        if (running(dt)) { running = null; i++; }

        /* ---- render ---- */
        ctx.save();
        if (shakeScreen > 0) {
          ctx.translate((Math.random() - 0.5) * shakeScreen, (Math.random() - 0.5) * shakeScreen);
          shakeScreen *= 0.86;
          if (shakeScreen < 0.4) shakeScreen = 0;
        }
        drawBackdrop(ctx, bd);
        var order = fighters.a.offset > fighters.d.offset ? ['d', 'a'] : ['a', 'd'];
        order.forEach(function (k) { drawFighter(ctx, fighters[k], now); });
        drawProjectile(ctx, projectile);
        effects = effects.filter(function (e) { e.life -= dt / 16; return e.life > 0; });
        effects.forEach(function (e) { drawEffect(ctx, e); });

        floaters = floaters.filter(function (fl) { fl.life -= dt / 16; return fl.life > 0; });
        floaters.forEach(function (fl) {
          var p = 1 - fl.life / fl.max;
          ctx.save();
          ctx.globalAlpha = Math.min(1, (1 - p) * 2);
          ctx.font = 'bold ' + (fl.big ? 44 : 32) + 'px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#120f1a';
          ctx.strokeText(fl.text, fl.x, fl.y - p * 34);
          ctx.fillStyle = fl.color;
          ctx.fillText(fl.text, fl.x, fl.y - p * 34);
          ctx.restore();
        });
        ctx.restore();

        if (flashScreen > 0) {
          ctx.fillStyle = 'rgba(255,255,255,' + flashScreen + ')';
          ctx.fillRect(0, 0, W, H);
          flashScreen *= 0.8;
          if (flashScreen < 0.02) flashScreen = 0;
        }

        requestAnimationFrame(frame);
      }

      scene = { skip: skip };
      requestAnimationFrame(function (t) { last = t; frame(t); });
    });
  };

  FE.battleSceneOpen = function () { return !!scene; };
})(window.FE);

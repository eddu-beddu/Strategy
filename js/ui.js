/* =============================================================
   ui.js — DOM construction for panels, menus and screens.
   Pure presentation; game.js owns all state.
   ============================================================= */
(function (FE) {
  'use strict';

  var UI = FE.UI = {};

  UI.$ = function (sel) { return document.querySelector(sel); };
  UI.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  UI.teamClass = function (u) {
    return u.team === 'player' ? 'is-player' : (u.team === 'enemy' ? 'is-enemy' : 'is-ally');
  };

  /* ---------- Small pieces ----------------------------------------- */
  function bar(cur, max, cls) {
    var pct = Math.max(0, Math.min(100, (cur / max) * 100));
    return '<div class="bar ' + cls + '"><i style="width:' + pct + '%"></i></div>';
  }
  UI.bar = bar;

  UI.itemLine = function (stack, unit, opts) {
    opts = opts || {};
    var it = FE.item(stack);
    if (!it) return '';
    var usable = !unit || FE.canUse(unit, stack);
    var cls = 'item' + (usable ? '' : ' item--unusable') + (opts.equipped ? ' item--equipped' : '');
    var right = it.uses !== undefined ? (stack.uses + '/' + it.uses) : '--';
    var tag = '';
    if (it.kind === 'weapon' || it.kind === 'staff') tag = '<em class="wtype wtype--' + it.type + '">' + it.rank + '</em>';
    return '<div class="' + cls + '" data-idx="' + (opts.idx === undefined ? '' : opts.idx) + '">'
      + '<span class="item__name">' + tag + UI.esc(it.name) + '</span>'
      + '<span class="item__uses">' + right + '</span></div>';
  };

  UI.weaponDetail = function (stack) {
    var it = FE.item(stack);
    if (!it) return '';
    if (it.kind === 'weapon') {
      return '<div class="wdetail">Mt ' + it.mt + ' &middot; Hit ' + it.hit + ' &middot; Crit ' + it.crit
        + ' &middot; Wt ' + it.wt + ' &middot; Rng ' + (it.min === it.max ? it.min : it.min + '-' + it.max)
        + (it.effective ? ' &middot; <b>eff. ' + it.effective.join('/') + '</b>' : '')
        + (it.brave ? ' &middot; <b>brave</b>' : '')
        + (it.drain ? ' &middot; <b>drains</b>' : '')
        + '</div>';
    }
    if (it.kind === 'staff') return '<div class="wdetail">Heals ' + it.heal + ' + Mag' + (it.ranged ? ' &middot; long range' : '') + '</div>';
    if (it.kind === 'consumable') return '<div class="wdetail">' + (it.heal >= 999 ? 'Restores all HP' : 'Restores ' + it.heal + ' HP') + '</div>';
    if (it.kind === 'booster') return '<div class="wdetail">Permanently +' + it.amount + ' ' + FE.STAT_LABEL[it.stat] + '</div>';
    if (it.kind === 'promo') return '<div class="wdetail">Promotes an eligible unit at level 10+</div>';
    return '';
  };

  /* ---------- Unit info card (sidebar) ------------------------------ */
  UI.unitCard = function (u, board) {
    if (!u) return '<div class="card card--empty">No unit selected.</div>';
    var cls = FE.CLASSES[u.cls];
    var w = FE.equipped(u);
    var terr = board ? board.terrainAt(u.x, u.y) : null;
    var html = '';
    html += '<div class="card ' + UI.teamClass(u) + '">';
    html += '<div class="card__head"><canvas class="portrait" width="64" height="64" data-sprite="' + cls.sprite + '" data-team="' + u.team + '" data-hair="' + (u.hair || '') + '"></canvas>';
    html += '<div class="card__id"><h3>' + UI.esc(u.name) + (u.boss ? ' <span class="boss-tag">BOSS</span>' : '') + '</h3>';
    html += '<p>' + UI.esc(cls.name) + ' &middot; Lv ' + u.level + (u.team === 'player' ? ' &middot; ' + u.exp + ' exp' : '') + '</p>';
    if (u.title) html += '<p class="muted">' + UI.esc(u.title) + '</p>';
    html += '</div></div>';

    html += '<div class="hpline"><span>HP</span>' + bar(u.hp, FE.maxHp(u), 'bar--hp')
      + '<b>' + u.hp + '/' + FE.maxHp(u) + '</b></div>';
    if (u.team === 'player') {
      html += '<div class="hpline"><span>EXP</span>' + bar(u.exp, 100, 'bar--exp') + '<b>' + u.exp + '</b></div>';
    }

    html += '<div class="stats">';
    ['str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'].forEach(function (s) {
      html += '<div class="stat"><span>' + FE.STAT_LABEL[s] + '</span><b>' + FE.stat(u, s) + '</b></div>';
    });
    html += '<div class="stat"><span>Mov</span><b>' + FE.mov(u) + '</b></div>';
    html += '<div class="stat"><span>Con</span><b>' + FE.con(u) + '</b></div>';
    html += '<div class="stat"><span>AS</span><b>' + FE.attackSpeed(u, w) + '</b></div>';
    html += '</div>';

    if (w) {
      var it = FE.item(w);
      html += '<div class="derived">'
        + '<span>Atk <b>' + (it.magic ? FE.stat(u, 'mag') : FE.stat(u, 'str')) + '+' + it.mt + '</b></span>'
        + '<span>Hit <b>' + FE.hitRate(u, w) + '</b></span>'
        + '<span>Crit <b>' + FE.critRate(u, w) + '</b></span>'
        + '<span>Avo <b>' + FE.avoid(u, board ? board.charAt(u.x, u.y) : null) + '</b></span>'
        + '</div>';
    }

    html += '<div class="inv">';
    u.items.forEach(function (s, i) {
      html += UI.itemLine(s, u, { idx: i, equipped: s === w });
    });
    if (!u.items.length) html += '<div class="muted small">Carrying nothing.</div>';
    html += '</div>';

    if (terr) {
      html += '<div class="terrainline">On <b>' + terr.name + '</b>'
        + (terr.def ? ' &middot; Def +' + terr.def : '')
        + (terr.avo ? ' &middot; Avo +' + terr.avo : '')
        + (terr.heal ? ' &middot; heals' : '') + '</div>';
    }
    html += '</div>';
    return html;
  };

  /* Sprites inside HTML cards are painted after insertion. */
  UI.paintPortraits = function (root) {
    var list = (root || document).querySelectorAll('canvas.portrait');
    for (var i = 0; i < list.length; i++) {
      var cv = list[i];
      if (cv.dataset.painted) continue;
      var ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      var sp = FE.getSprite(cv.dataset.sprite, cv.dataset.team, 4, cv.dataset.hair || null);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(sp, (cv.width - sp.width) / 2, (cv.height - sp.height) / 2);
      cv.dataset.painted = '1';
    }
  };

  /* ---------- Battle forecast --------------------------------------- */
  UI.forecast = function (f, attacker, defender) {
    if (!f || !f.valid) return '';
    function col(side, unit, foe) {
      var dmg = side.canAttack ? side.dmg : '--';
      var hit = side.canAttack ? side.hit : '--';
      var crit = side.canAttack ? side.crit : '--';
      var x = side.hits > 1 ? ' <em>x' + side.hits + '</em>' : '';
      var total = side.canAttack ? side.dmg * side.hits : 0;
      var lethal = side.canAttack && total >= foe.hp;
      return '<div class="fc__col ' + UI.teamClass(unit) + (lethal ? ' fc__col--lethal' : '') + '">'
        + '<div class="fc__name">' + UI.esc(unit.name) + '</div>'
        + '<div class="fc__hp">' + unit.hp + ' <span>HP</span></div>'
        + '<div class="fc__row"><span>Dmg</span><b>' + dmg + x + '</b></div>'
        + '<div class="fc__row"><span>Hit</span><b>' + hit + '</b></div>'
        + '<div class="fc__row"><span>Crit</span><b>' + crit + '</b></div>'
        + (side.effective ? '<div class="fc__eff">effective!</div>' : '')
        + (lethal ? '<div class="fc__eff fc__eff--kill">can kill</div>' : '')
        + '</div>';
    }
    return '<div class="fc">' + col(f.a, attacker, defender)
      + '<div class="fc__vs">vs</div>'
      + col(f.d, defender, attacker) + '</div>';
  };

  /* ---------- Action menu ------------------------------------------- */
  UI.buildMenu = function (host, options, onPick) {
    host.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'menu';
    options.forEach(function (opt, i) {
      var b = document.createElement('button');
      b.className = 'menu__item' + (opt.danger ? ' menu__item--danger' : '');
      b.textContent = opt.label;
      b.dataset.index = i;
      if (opt.disabled) b.disabled = true;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        onPick(opt, i);
      });
      box.appendChild(b);
    });
    host.appendChild(box);
    host.classList.add('is-open');
    var first = box.querySelector('button:not([disabled])');
    if (first) first.focus();
    return box;
  };

  UI.closeMenu = function (host) {
    host.innerHTML = '';
    host.classList.remove('is-open');
  };

  /* Keeps the floating menu on screen next to the acting unit. */
  UI.placeMenu = function (host, canvas, tileX, tileY) {
    var rect = canvas.getBoundingClientRect();
    var stage = canvas.parentElement.getBoundingClientRect();
    var scale = rect.width / canvas.width;
    var x = (tileX + 1) * FE.TS * scale + (rect.left - stage.left);
    var y = tileY * FE.TS * scale + (rect.top - stage.top);
    host.style.left = Math.round(x) + 'px';
    host.style.top = Math.round(y) + 'px';
    host.style.right = 'auto';
    /* flip to the other side if it would fall off */
    requestAnimationFrame(function () {
      var box = host.firstChild;
      if (!box) return;
      var bw = box.offsetWidth, bh = box.offsetHeight;
      if (x + bw > stage.width - 4) {
        host.style.left = Math.max(4, Math.round(x - bw - FE.TS * scale)) + 'px';
      }
      if (y + bh > stage.height - 4) {
        host.style.top = Math.max(4, Math.round(stage.height - bh - 4)) + 'px';
      }
    });
  };

  /* ---------- Log ---------------------------------------------------- */
  UI.log = function (msg, cls) {
    var box = UI.$('#log');
    if (!box) return;
    var line = document.createElement('div');
    line.className = 'log__line' + (cls ? ' log__line--' + cls : '');
    line.innerHTML = msg;
    box.appendChild(line);
    while (box.children.length > 120) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  };

  /* ---------- Modal dialog ------------------------------------------- */
  UI.dialog = function (opts) {
    var host = UI.$('#modal');
    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'modal__box' + (opts.wide ? ' modal__box--wide' : '');
    if (opts.title) {
      var h = document.createElement('h2');
      h.innerHTML = opts.title;
      wrap.appendChild(h);
    }
    var body = document.createElement('div');
    body.className = 'modal__body';
    body.innerHTML = opts.body || '';
    wrap.appendChild(body);
    if (opts.buttons && opts.buttons.length) {
      var row = document.createElement('div');
      row.className = 'modal__buttons';
      opts.buttons.forEach(function (b) {
        var el = document.createElement('button');
        el.className = 'btn' + (b.primary ? ' btn--primary' : '');
        el.textContent = b.label;
        el.addEventListener('click', function () {
          if (b.action) b.action();
        });
        row.appendChild(el);
      });
      wrap.appendChild(row);
    }
    host.appendChild(wrap);
    host.classList.add('is-open');
    UI.paintPortraits(host);
    var btn = wrap.querySelector('.btn--primary') || wrap.querySelector('.btn');
    if (btn) btn.focus();
    return { host: host, body: body };
  };

  UI.closeDialog = function () {
    var host = UI.$('#modal');
    host.innerHTML = '';
    host.classList.remove('is-open');
  };

  UI.isDialogOpen = function () {
    return UI.$('#modal').classList.contains('is-open');
  };
})(window.FE);

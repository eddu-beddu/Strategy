/* =============================================================
   game.js — Turn flow, player actions, enemy phase, campaign.
   ============================================================= */
(function (FE) {
  'use strict';

  var UI = FE.UI;
  var TS = FE.TS;
  var SAVE_KEY = 'fe_valeSave_v1';        /* rolling: start of every turn */
  var CHAPTER_KEY = 'fe_valeChapter_v1';  /* written once, at chapter start */

  var G = FE.Game = {
    screen: 'title',      /* title | prep | map */
    mode: 'idle',         /* idle | moving | menu | target | item | busy | over */
    board: null,
    renderer: null,
    cursor: { x: 0, y: 0 },
    selected: null,
    origin: null,
    moveTiles: null,
    attackTiles: null,
    staffTiles: null,
    path: [],
    danger: false,
    dangerTiles: null,
    turn: 1,
    phase: 'player',
    anim: null,
    ghost: null,
    targets: [],
    targetIndex: 0,
    hoverUnit: null,
    speed: 1,
    campaign: null
  };

  function chapter() { return FE.CHAPTERS[G.campaign.chapterIndex]; }
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms / G.speed); });
  }
  function key(x, y) { return x + ',' + y; }

  /* ---------------------------------------------------------------
     Campaign
     --------------------------------------------------------------- */
  function newCampaign(opts) {
    return {
      chapterIndex: 0,
      difficulty: opts.difficulty || 'normal',
      casual: !!opts.casual,
      roster: {},          /* id -> serialised unit */
      convoy: [],
      fallen: [],
      turnsTotal: 0,
      started: Date.now()
    };
  }

  function recruit(id) {
    if (G.campaign.roster[id]) return G.campaign.roster[id];
    var def = FE.ROSTER[id];
    if (!def) return null;
    var u = FE.makeUnit(def);
    u.id = id;
    u.lordRef = !!def.lord;
    G.campaign.roster[id] = u;
    return u;
  }

  function livingRoster() {
    return Object.keys(G.campaign.roster).map(function (k) {
      return G.campaign.roster[k];
    });
  }

  /* ---------------------------------------------------------------
     Chapter setup
     --------------------------------------------------------------- */
  function buildBoard(ch, deployment) {
    var board = new FE.Board(ch);
    board.chapterIndex = G.campaign.chapterIndex;

    var diffBonus = G.campaign.difficulty === 'hard' ? 2 : 0;

    (ch.units || []).forEach(function (d) {
      var def = {};
      for (var k in d) def[k] = d[k];
      def.team = 'enemy';
      def.level = (d.level || 1) + diffBonus;
      var u = FE.makeUnit(def);
      u.drops = d.drops || null;
      board.units.push(u);
    });

    (ch.npcs || []).forEach(function (d) {
      var base = FE.ROSTER[d.roster];
      var def = {};
      for (var k in base) def[k] = base[k];
      def.team = 'ally';
      def.x = d.x; def.y = d.y;
      def.ai = d.ai || 'hold';
      var existing = G.campaign.roster[d.roster];
      var u = existing || FE.makeUnit(def);
      if (existing) {
        /* already recruited in a previous run of this chapter — shouldn't
           happen, but be safe and just deploy them normally */
        u.team = 'player';
      } else {
        u.team = 'ally';
        u.id = d.roster;
      }
      u.x = d.x; u.y = d.y;
      u.ai = d.ai || 'hold';
      u.talk = d.talk || null;
      u.rosterId = d.roster;
      u.alive = true;
      u.hp = FE.maxHp(u);
      board.units.push(u);
    });

    deployment.forEach(function (entry) {
      var u = entry.unit;
      u.x = entry.x; u.y = entry.y;
      u.alive = true;
      u.acted = false;
      u.aggroed = false;
      u.buffs = {};
      u.hp = Math.max(1, Math.min(u.hp, FE.maxHp(u)));
      board.units.push(u);
    });

    return board;
  }

  function beginChapter() {
    var ch = chapter();
    (ch.join || []).forEach(recruit);
    if (G.campaign.chapterIndex === 0) (ch.forced || []).forEach(recruit);

    G.pendingReinforcements = (ch.reinforcements || []).map(function (r) {
      return { turn: r.turn, units: r.units, text: r.text, done: false };
    });

    showPrep();
  }

  function startChapterWithDeployment(deployment) {
    var ch = chapter();
    G.board = buildBoard(ch, deployment);
    G.renderer.bake(G.board);
    G.turn = 1;
    G.phase = 'player';
    G.screen = 'map';
    G.mode = 'idle';
    G.selected = null;
    G.dangerTiles = null;
    G.cursor = { x: deployment[0].x, y: deployment[0].y };
    document.body.dataset.screen = 'map';
    UI.$('#log').innerHTML = '';
    updateHeader();
    refreshSidebar();
    saveGame(true, true);

    storyDialog(ch.title + ': ' + ch.name, ch.intro, function () {
      UI.closeDialog();
      UI.log('<b>' + ch.title + ' — ' + ch.name + '</b>', 'chapter');
      UI.log(objectiveText(), 'objective');
      startPlayerPhase(true);
    });
  }

  function objectiveText() {
    var o = chapter().objective;
    switch (o.type) {
      case 'rout': return 'Objective: defeat every enemy.';
      case 'boss': return 'Objective: defeat the commander.';
      case 'seize': return 'Objective: seize the throne/gate.';
      case 'survive': return 'Objective: survive ' + o.turns + ' turns.';
      default: return 'Objective: win.';
    }
  }

  function storyDialog(title, lines, onDone) {
    UI.dialog({
      title: UI.esc(title),
      body: '<div class="story">' + lines.map(function (l) {
        return l === '' ? '<br>' : '<p>' + UI.esc(l) + '</p>';
      }).join('') + '</div>',
      buttons: [{ label: 'Continue', primary: true, action: onDone }]
    });
  }

  /* ---------------------------------------------------------------
     Preparations screen
     --------------------------------------------------------------- */
  var prep = null;

  function showPrep() {
    var ch = chapter();
    var all = livingRoster();
    var slots = ch.deploy.length;
    var forced = {};
    (ch.forced || []).forEach(function (id) { forced[id] = true; });
    /* the lord is always deployed */
    all.forEach(function (u) { if (u.lordRef) forced[u.id] = true; });

    var chosen = {};
    all.slice(0, slots).forEach(function (u) { chosen[u.id] = true; });
    Object.keys(forced).forEach(function (id) { chosen[id] = true; });

    prep = { chosen: chosen, slots: slots, forced: forced, sel: null, tab: 'units' };
    G.screen = 'prep';
    document.body.dataset.screen = 'prep';
    renderPrep();
  }

  function renderPrep() {
    var ch = chapter();
    var all = livingRoster();
    var count = Object.keys(prep.chosen).filter(function (k) { return prep.chosen[k]; }).length;

    var html = '<div class="prep">';
    html += '<div class="prep__head"><div><h2>' + UI.esc(ch.title) + ' — ' + UI.esc(ch.name) + '</h2>'
      + '<p class="muted">' + objectiveText() + ' Deployment slots: <b>' + count + '/' + prep.slots + '</b></p></div></div>';

    html += '<div class="prep__cols">';
    html += '<div class="prep__list">';
    all.forEach(function (u) {
      var on = !!prep.chosen[u.id];
      var lock = !!prep.forced[u.id];
      var cls = FE.CLASSES[u.cls];
      html += '<div class="prow' + (on ? ' prow--on' : '') + (prep.sel === u.id ? ' prow--sel' : '') + '" data-unit="' + u.id + '">'
        + '<canvas class="portrait portrait--sm" width="40" height="40" data-sprite="' + cls.sprite + '" data-team="player" data-hair="' + (u.hair || '') + '"></canvas>'
        + '<div class="prow__main"><b>' + UI.esc(u.name) + '</b>'
        + '<span class="muted">' + UI.esc(cls.name) + ' Lv ' + u.level + '</span></div>'
        + '<div class="prow__hp">' + u.hp + '/' + FE.maxHp(u) + '</div>'
        + '<button class="chip' + (on ? ' chip--on' : '') + '" data-toggle="' + u.id + '"' + (lock ? ' disabled title="Must deploy"' : '') + '>'
        + (lock ? 'LOCKED' : (on ? 'DEPLOY' : 'BENCH')) + '</button></div>';
    });
    html += '</div>';

    /* right-hand pane: selected unit + convoy transfer */
    var sel = prep.sel ? G.campaign.roster[prep.sel] : null;
    html += '<div class="prep__side">';
    if (sel) {
      html += UI.unitCard(sel, null);
      html += '<div class="growths"><h4>Growth rates</h4><div class="stats">';
      FE.STATS.forEach(function (s) {
        html += '<div class="stat"><span>' + FE.STAT_LABEL[s] + '</span><b>' + sel.growths[s] + '%</b></div>';
      });
      html += '</div></div>';
      if (sel.desc) html += '<p class="muted small">' + UI.esc(sel.desc) + '</p>';
      html += '<div class="prep__acts">';
      sel.items.forEach(function (st, i) {
        html += '<button class="btn btn--sm" data-tostore="' + i + '">&darr; Store ' + UI.esc(FE.item(st).name) + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="card card--empty">Select a unit to inspect them, then move items between them and the convoy.</div>';
    }

    html += '<div class="convoy"><h4>Convoy (' + G.campaign.convoy.length + ')</h4>';
    if (!G.campaign.convoy.length) html += '<div class="muted small">Empty.</div>';
    G.campaign.convoy.forEach(function (st, i) {
      var it = FE.item(st);
      var can = sel && FE.hasSpace(sel);
      html += '<div class="crow"><span>' + UI.esc(it.name) + ' <em class="muted">'
        + (it.uses !== undefined ? st.uses + '/' + it.uses : '') + '</em></span>'
        + '<button class="btn btn--sm" data-take="' + i + '"' + (can ? '' : ' disabled') + '>Take &uarr;</button></div>';
    });
    html += '</div></div></div>';

    html += '<div class="prep__foot">'
      + '<button class="btn" id="prepAuto">Auto-assign</button>'
      + '<button class="btn btn--primary" id="prepGo">Begin chapter</button>'
      + '</div></div>';

    UI.dialog({ body: html, wide: true, buttons: [] });
    UI.paintPortraits(UI.$('#modal'));
    wirePrep();
  }

  function wirePrep() {
    var host = UI.$('#modal');
    host.querySelectorAll('[data-unit]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.dataset.toggle !== undefined) return;
        prep.sel = el.dataset.unit;
        renderPrep();
      });
    });
    host.querySelectorAll('[data-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = el.dataset.toggle;
        if (prep.forced[id]) return;
        var count = Object.keys(prep.chosen).filter(function (k) { return prep.chosen[k]; }).length;
        if (!prep.chosen[id] && count >= prep.slots) return;
        prep.chosen[id] = !prep.chosen[id];
        renderPrep();
      });
    });
    host.querySelectorAll('[data-tostore]').forEach(function (el) {
      el.addEventListener('click', function () {
        var u = G.campaign.roster[prep.sel];
        var st = u.items.splice(+el.dataset.tostore, 1)[0];
        if (st) G.campaign.convoy.push(st);
        renderPrep();
      });
    });
    host.querySelectorAll('[data-take]').forEach(function (el) {
      el.addEventListener('click', function () {
        var u = G.campaign.roster[prep.sel];
        if (!u || !FE.hasSpace(u)) return;
        var st = G.campaign.convoy.splice(+el.dataset.take, 1)[0];
        if (st) u.items.push(st);
        renderPrep();
      });
    });
    var auto = host.querySelector('#prepAuto');
    if (auto) auto.addEventListener('click', function () {
      var all = livingRoster();
      prep.chosen = {};
      Object.keys(prep.forced).forEach(function (id) { prep.chosen[id] = true; });
      all.forEach(function (u) {
        var n = Object.keys(prep.chosen).filter(function (k) { return prep.chosen[k]; }).length;
        if (n < prep.slots) prep.chosen[u.id] = true;
      });
      renderPrep();
    });
    host.querySelector('#prepGo').addEventListener('click', function () {
      var ch = chapter();
      var list = livingRoster().filter(function (u) { return prep.chosen[u.id]; });
      if (!list.length) return;
      var deployment = list.slice(0, ch.deploy.length).map(function (u, i) {
        return { unit: u, x: ch.deploy[i][0], y: ch.deploy[i][1] };
      });
      UI.closeDialog();
      startChapterWithDeployment(deployment);
    });
  }

  /* ---------------------------------------------------------------
     Header / sidebar
     --------------------------------------------------------------- */
  function updateHeader() {
    var ch = chapter();
    UI.$('#hdrChapter').textContent = ch.title + ' — ' + ch.name;
    UI.$('#hdrObjective').textContent = objectiveText().replace('Objective: ', '');
    UI.$('#hdrTurn').textContent = 'Turn ' + G.turn
      + (ch.objective.type === 'survive' ? ' / ' + ch.objective.turns : '');
    var p = UI.$('#hdrPhase');
    p.textContent = G.phase === 'player' ? 'Player Phase'
      : (G.phase === 'enemy' ? 'Enemy Phase' : 'Ally Phase');
    p.className = 'phase phase--' + G.phase;
    var left = G.board ? G.board.livingUnits('player').filter(function (u) { return !u.acted; }).length : 0;
    UI.$('#hdrUnits').textContent = left + ' unit' + (left === 1 ? '' : 's') + ' left';
  }

  function refreshSidebar() {
    var u = G.hoverUnit || G.selected
      || (G.board ? G.board.unitAt(G.cursor.x, G.cursor.y) : null);
    var host = UI.$('#unitPanel');
    host.innerHTML = UI.unitCard(u, G.board);
    UI.paintPortraits(host);

    var t = G.board ? G.board.terrainAt(G.cursor.x, G.cursor.y) : null;
    UI.$('#terrainPanel').innerHTML = t
      ? '<div class="terrbox"><b>' + t.name + '</b>'
        + '<span>Def +' + t.def + '</span><span>Avo +' + t.avo + '</span></div>'
      : '';
  }

  function setForecastPanel(html) {
    UI.$('#forecastPanel').innerHTML = html || '';
  }

  /* ---------------------------------------------------------------
     Selection and movement preview
     --------------------------------------------------------------- */
  function selectUnit(u) {
    G.selected = u;
    G.origin = { x: u.x, y: u.y };
    var reach = G.board.reachable(u);
    G.reach = reach;
    G.moveTiles = {};
    reach.forEach(function (t) { G.moveTiles[key(t.x, t.y)] = true; });

    var ranges = FE.attackRanges(u);
    G.attackTiles = {};
    if (ranges.length) {
      var threat = G.board.threatTiles(u, ranges, reach);
      for (var k in threat) if (!G.moveTiles[k]) G.attackTiles[k] = true;
    }
    var sranges = FE.staffRanges(u);
    G.staffTiles = {};
    if (sranges.length) {
      var st = G.board.threatTiles(u, sranges, reach);
      for (var k2 in st) if (!G.moveTiles[k2] && !G.attackTiles[k2]) G.staffTiles[k2] = true;
    }
    G.mode = u.team === 'player' && !u.acted ? 'moving' : 'inspect';
    G.path = [{ x: u.x, y: u.y }];
    refreshSidebar();
  }

  function clearSelection() {
    G.selected = null;
    G.moveTiles = null;
    G.attackTiles = null;
    G.staffTiles = null;
    G.path = [];
    G.ghost = null;
    G.mode = 'idle';
    G.targets = [];
    setForecastPanel('');
    UI.closeMenu(UI.$('#menuHost'));
    refreshSidebar();
  }

  function updatePathPreview(x, y) {
    if (!G.selected || G.mode !== 'moving') return;
    if (!G.moveTiles[key(x, y)]) { G.path = [{ x: G.selected.x, y: G.selected.y }]; return; }
    G.path = G.board.pathTo(G.reach._map, x, y);
  }

  /* ---------------------------------------------------------------
     Animations
     --------------------------------------------------------------- */
  function animateAlong(unit, path) {
    return new Promise(function (resolve) {
      if (path.length <= 1) { resolve(); return; }
      var i = 0;
      var stepMs = 95 / G.speed;
      var start = performance.now();
      G.anim = { unit: unit, px: path[0].x * TS, py: path[0].y * TS };
      function frame(now) {
        /* rAF hands back the frame's start time, which can predate the
           performance.now() we captured — clamp so the index never goes
           negative. */
        var elapsed = Math.max(0, now - start);
        var seg = Math.floor(elapsed / stepMs);
        if (seg >= path.length - 1) {
          G.anim = null;
          resolve();
          return;
        }
        var t = (elapsed % stepMs) / stepMs;
        var a = path[seg], b = path[seg + 1];
        G.anim.px = (a.x + (b.x - a.x) * t) * TS;
        G.anim.py = (a.y + (b.y - a.y) * t) * TS;
        i = seg;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function lunge(unit, target) {
    return new Promise(function (resolve) {
      var dx = Math.sign(target.x - unit.x), dy = Math.sign(target.y - unit.y);
      var dur = 170 / G.speed;
      var start = performance.now();
      G.anim = { unit: unit, px: unit.x * TS, py: unit.y * TS };
      function frame(now) {
        var t = Math.max(0, now - start) / dur;
        if (t >= 1) { G.anim = null; resolve(); return; }
        var k = Math.sin(t * Math.PI) * 11;
        G.anim.px = unit.x * TS + dx * k;
        G.anim.py = unit.y * TS + dy * k;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function flashTile(x, y, color) {
    G.renderer.addFloater(x, y, '', color);
  }

  async function moveUnitTo(unit, path) {
    if (path.length > 1) {
      var dest = path[path.length - 1];
      G.ghost = null;
      var hidden = unit;
      G.hideUnit = hidden;
      await animateAlong(unit, path);
      G.hideUnit = null;
      unit.x = dest.x;
      unit.y = dest.y;
    }
  }

  /* ---------------------------------------------------------------
     Actions
     --------------------------------------------------------------- */
  function adjacentAllies(u) {
    return FE.DIRS.map(function (d) {
      return G.board.unitAt(u.x + d[0], u.y + d[1]);
    }).filter(function (o) { return o && !FE.hostile(u, o); });
  }

  function targetsInRange(u, ranges, pred) {
    var out = [];
    G.board.livingUnits().forEach(function (o) {
      if (o === u) return;
      var d = FE.dist(u, o);
      if (ranges.indexOf(d) < 0) return;
      if (pred(o)) out.push(o);
    });
    return out;
  }

  function openActionMenu() {
    var u = G.selected;
    G.mode = 'menu';
    var opts = [];

    var atkTargets = targetsInRange(u, FE.attackRanges(u), function (o) {
      return FE.hostile(u, o) && FE.weaponFor(u, FE.dist(u, o));
    });
    if (atkTargets.length) opts.push({ id: 'attack', label: 'Attack' });

    var staffTargets = targetsInRange(u, FE.staffRanges(u), function (o) {
      return !FE.hostile(u, o) && o.hp < FE.maxHp(o);
    });
    if (FE.usableStaves(u).length && staffTargets.length) opts.push({ id: 'staff', label: 'Staff' });

    /* Talk */
    var talkTarget = adjacentAllies(u).filter(function (o) {
      return o.talk && o.talk.by === u.id;
    })[0];
    if (talkTarget) opts.push({ id: 'talk', label: 'Talk' });

    var terr = G.board.terrainAt(u.x, u.y);
    var tk = key(u.x, u.y);
    if (terr.village && !G.board.visited[tk]) opts.push({ id: 'visit', label: 'Visit' });
    if (terr.chest && !G.board.opened[tk]) opts.push({ id: 'chest', label: 'Open' });
    if (terr.seize && chapter().objective.type === 'seize' && u.lordRef) {
      opts.push({ id: 'seize', label: 'Seize' });
    }

    if (u.items.length) opts.push({ id: 'item', label: 'Item' });
    if (adjacentAllies(u).filter(function (o) { return o.team === 'player'; }).length && u.items.length) {
      opts.push({ id: 'give', label: 'Give' });
    }
    opts.push({ id: 'wait', label: 'Wait' });

    var host = UI.$('#menuHost');
    UI.placeMenu(host, UI.$('#map'), u.x, u.y);
    UI.buildMenu(host, opts, handleMenuPick);
  }

  function handleMenuPick(opt) {
    var u = G.selected;
    UI.closeMenu(UI.$('#menuHost'));
    switch (opt.id) {
      case 'attack': beginTargeting('attack'); break;
      case 'staff': beginTargeting('staff'); break;
      case 'talk': doTalk(); break;
      case 'visit': doVisit(); break;
      case 'chest': doChest(); break;
      case 'seize': doSeize(); break;
      case 'item': openItemMenu(); break;
      case 'give': beginTargeting('give'); break;
      default: finishUnit(u);
    }
  }

  function beginTargeting(kind) {
    var u = G.selected;
    G.targetKind = kind;
    if (kind === 'attack') {
      G.targets = targetsInRange(u, FE.attackRanges(u), function (o) {
        return FE.hostile(u, o) && FE.weaponFor(u, FE.dist(u, o));
      });
    } else if (kind === 'staff') {
      G.targets = targetsInRange(u, FE.staffRanges(u), function (o) {
        return !FE.hostile(u, o) && o.hp < FE.maxHp(o);
      });
    } else {
      G.targets = adjacentAllies(u).filter(function (o) { return o.team === 'player' && FE.hasSpace(o); });
    }
    if (!G.targets.length) { openActionMenu(); return; }
    G.targetIndex = 0;
    G.mode = 'target';
    showTarget();
  }

  function showTarget() {
    var u = G.selected, t = G.targets[G.targetIndex];
    G.cursor = { x: t.x, y: t.y };
    if (G.targetKind === 'attack') {
      var f = FE.forecast(G.board, u, { x: u.x, y: u.y }, t);
      setForecastPanel(UI.forecast(f, u, t));
    } else if (G.targetKind === 'staff') {
      var st = FE.usableStaves(u)[0];
      var amount = Math.min(FE.maxHp(t) - t.hp, FE.staffHeal(u, st));
      setForecastPanel('<div class="fc fc--heal"><div class="fc__col is-player">'
        + '<div class="fc__name">' + UI.esc(t.name) + '</div>'
        + '<div class="fc__row"><span>Heal</span><b>+' + amount + '</b></div>'
        + '<div class="fc__row"><span>HP</span><b>' + t.hp + ' &rarr; ' + (t.hp + amount) + '</b></div>'
        + '</div></div>');
    } else {
      setForecastPanel('<div class="hint">Give an item to <b>' + UI.esc(t.name) + '</b>.</div>');
    }
    G.hoverUnit = t;
    refreshSidebar();
  }

  function cycleTarget(dir) {
    if (!G.targets.length) return;
    G.targetIndex = (G.targetIndex + dir + G.targets.length) % G.targets.length;
    showTarget();
  }

  async function confirmTarget() {
    var u = G.selected, t = G.targets[G.targetIndex];
    setForecastPanel('');
    G.hoverUnit = null;
    if (G.targetKind === 'attack') {
      G.mode = 'busy';
      await runCombat(u, t);
      if (u.alive) finishUnit(u); else afterAction();
    } else if (G.targetKind === 'staff') {
      G.mode = 'busy';
      await runStaff(u, t);
      finishUnit(u);
    } else {
      openGiveMenu(t);
    }
  }

  function openGiveMenu(target) {
    var u = G.selected;
    var opts = u.items.map(function (st, i) {
      return { id: 'g' + i, label: FE.item(st).name, idx: i };
    });
    opts.push({ id: 'back', label: 'Back' });
    var host = UI.$('#menuHost');
    UI.placeMenu(host, UI.$('#map'), u.x, u.y);
    UI.buildMenu(host, opts, function (opt) {
      UI.closeMenu(host);
      if (opt.id === 'back') { openActionMenu(); return; }
      var st = u.items.splice(opt.idx, 1)[0];
      target.items.push(st);
      UI.log(UI.esc(u.name) + ' gave ' + UI.esc(FE.item(st).name) + ' to ' + UI.esc(target.name) + '.');
      finishUnit(u);
    });
  }

  function openItemMenu() {
    var u = G.selected;
    var host = UI.$('#menuHost');
    var opts = u.items.map(function (st, i) {
      var it = FE.item(st);
      return { id: 'i' + i, label: it.name + '  (' + st.uses + ')', idx: i };
    });
    opts.push({ id: 'back', label: 'Back' });
    UI.placeMenu(host, UI.$('#map'), u.x, u.y);
    UI.buildMenu(host, opts, function (opt) {
      UI.closeMenu(host);
      if (opt.id === 'back') { openActionMenu(); return; }
      openItemActions(opt.idx);
    });
  }

  function openItemActions(idx) {
    var u = G.selected;
    var st = u.items[idx];
    var it = FE.item(st);
    var opts = [];
    if (it.kind === 'weapon' || it.kind === 'staff') {
      opts.push({ id: 'equip', label: 'Equip', disabled: !FE.canUse(u, st) });
    }
    if (it.kind === 'consumable') opts.push({ id: 'use', label: 'Use', disabled: u.hp >= FE.maxHp(u) && !it.buff });
    if (it.kind === 'booster') opts.push({ id: 'use', label: 'Use' });
    if (it.kind === 'promo') opts.push({ id: 'promote', label: 'Promote', disabled: !FE.canPromote(u, st) });
    opts.push({ id: 'discard', label: 'Discard', danger: true });
    opts.push({ id: 'back', label: 'Back' });

    var host = UI.$('#menuHost');
    UI.placeMenu(host, UI.$('#map'), u.x, u.y);
    UI.buildMenu(host, opts, function (opt) {
      UI.closeMenu(host);
      if (opt.id === 'back') { openItemMenu(); return; }
      if (opt.id === 'equip') {
        u.items.splice(idx, 1);
        u.items.unshift(st);
        refreshSidebar();
        openActionMenu();
        return;
      }
      if (opt.id === 'discard') {
        u.items.splice(idx, 1);
        UI.log(UI.esc(u.name) + ' discarded ' + UI.esc(it.name) + '.');
        refreshSidebar();
        openActionMenu();
        return;
      }
      if (opt.id === 'promote') { doPromote(u, st); return; }
      useItem(u, st, idx);
    });
  }

  function useItem(u, st, idx) {
    var it = FE.item(st);
    if (it.kind === 'consumable') {
      if (it.heal) {
        var got = FE.heal(u, it.heal >= 999 ? 9999 : it.heal);
        G.renderer.addFloater(u.x, u.y, '+' + got, '#7ce38b');
        UI.log(UI.esc(u.name) + ' used ' + UI.esc(it.name) + ' (+' + got + ' HP).');
      }
      if (it.buff) {
        for (var k in it.buff) u.buffs[k] = (u.buffs[k] || 0) + it.buff[k];
        UI.log(UI.esc(u.name) + ' feels warded.');
      }
      FE.consume(u, st, 1);
    } else if (it.kind === 'booster') {
      u.stats[it.stat] = Math.min(FE.cap(u, it.stat), u.stats[it.stat] + it.amount);
      if (it.stat === 'hp') u.hp += it.amount;
      u.maxHp = FE.stat(u, 'hp');
      G.renderer.addFloater(u.x, u.y, '+' + it.amount + ' ' + FE.STAT_LABEL[it.stat], '#ffd45e');
      UI.log(UI.esc(u.name) + ' used ' + UI.esc(it.name) + ': +' + it.amount + ' ' + FE.STAT_LABEL[it.stat] + '.');
      u.items.splice(idx, 1);
    }
    refreshSidebar();
    finishUnit(u);
  }

  function doPromote(u, st) {
    var res = FE.promote(u);
    FE.consume(u, st, 1);
    var rows = FE.STATS.filter(function (s) { return res.gains[s]; }).map(function (s) {
      return '<div class="lvrow"><span>' + FE.STAT_LABEL[s] + '</span><b>+' + res.gains[s] + '</b></div>';
    }).join('');
    UI.dialog({
      title: UI.esc(u.name) + ' &rarr; ' + UI.esc(res.to),
      body: '<div class="levelup">' + rows + '</div>',
      buttons: [{
        label: 'Onward', primary: true, action: function () {
          UI.closeDialog();
          refreshSidebar();
          finishUnit(u);
        }
      }]
    });
    UI.log('<b>' + UI.esc(u.name) + '</b> became a ' + UI.esc(res.to) + '!', 'good');
  }

  function doTalk() {
    var u = G.selected;
    var t = adjacentAllies(u).filter(function (o) { return o.talk && o.talk.by === u.id; })[0];
    if (!t) { finishUnit(u); return; }
    var lines = t.talk.text.slice();
    t.talk = null;
    t.team = 'player';
    t.ai = null;
    t.acted = true;
    if (t.rosterId && !G.campaign.roster[t.rosterId]) {
      t.id = t.rosterId;
      G.campaign.roster[t.rosterId] = t;
    }
    lines.push('');
    lines.push(t.name + ' has joined!');
    storyDialog('Talk', lines, function () {
      UI.closeDialog();
      UI.log('<b>' + UI.esc(t.name) + '</b> joined the company!', 'good');
      finishUnit(u);
    });
  }

  function receiveItem(u, itemId) {
    var st = FE.makeItem(itemId);
    if (FE.give(u, st)) return ' It goes into ' + u.name + "'s pack.";
    G.campaign.convoy.push(st);
    return ' It goes to the convoy.';
  }

  function doVisit() {
    var u = G.selected;
    var k = key(u.x, u.y);
    var v = (chapter().villages || {})[k];
    G.board.visited[k] = true;
    G.board.setTile(u.x, u.y, '.');
    G.renderer.rebakeTile(G.board, u.x, u.y);
    var lines = [];
    if (v) {
      lines.push(v.text);
      if (v.item) {
        lines.push('');
        lines.push('Obtained: ' + FE.ITEMS[v.item].name + '.' + receiveItem(u, v.item));
      }
    } else {
      lines.push('The house is empty.');
    }
    storyDialog('Village', lines, function () {
      UI.closeDialog();
      refreshSidebar();
      finishUnit(u);
    });
  }

  function doChest() {
    var u = G.selected;
    var k = key(u.x, u.y);
    var c = (chapter().chests || {})[k];
    G.board.opened[k] = true;
    G.board.setTile(u.x, u.y, '.');
    G.renderer.rebakeTile(G.board, u.x, u.y);
    var lines = ['A supply cache, left behind in the retreat.'];
    if (c && c.item) {
      lines.push('');
      lines.push('Obtained: ' + FE.ITEMS[c.item].name + '.' + receiveItem(u, c.item));
    }
    storyDialog('Cache', lines, function () {
      UI.closeDialog();
      refreshSidebar();
      finishUnit(u);
    });
  }

  function doSeize() {
    UI.log('<b>' + UI.esc(G.selected.name) + '</b> seizes the throne!', 'good');
    G.selected.acted = true;
    endChapter(true);
  }

  /* ---------------------------------------------------------------
     Combat execution
     --------------------------------------------------------------- */
  async function runCombat(attacker, defender, forcedWeapon) {
    attacker.aggroed = true;
    defender.aggroed = true;
    var startHpA = attacker.hp, startHpD = defender.hp;
    var result = FE.resolveCombat(G.board, attacker, defender, forcedWeapon);
    if (!result) return;

    /* Replay: resolveCombat already applied damage, so rewind for the show. */
    attacker.hp = startHpA;
    defender.hp = startHpD;

    var log = [];
    for (var i = 0; i < result.events.length; i++) {
      var ev = result.events[i];
      var actor = ev.actor, target = ev.target;
      await lunge(actor, target);
      if (ev.hit) {
        target.hp = Math.max(0, target.hp - ev.dmg);
        G.renderer.addFloater(target.x, target.y, '-' + ev.dmg, ev.crit ? '#ffd166' : '#ff6b6b');
        if (ev.crit) UI.log(UI.esc(actor.name) + ' lands a <b>critical</b> on ' + UI.esc(target.name) + ' for ' + ev.dmg + '!', 'crit');
        else UI.log(UI.esc(actor.name) + ' hits ' + UI.esc(target.name) + ' for ' + ev.dmg + '.');
        if (ev.drain) {
          FE.heal(actor, 0); /* already applied by resolveCombat */
          actor.hp = Math.min(FE.maxHp(actor), actor.hp + ev.drain);
          G.renderer.addFloater(actor.x, actor.y, '+' + ev.drain, '#7ce38b');
        }
      } else {
        G.renderer.addFloater(target.x, target.y, 'miss', '#c8c8d4');
        UI.log(UI.esc(actor.name) + ' misses ' + UI.esc(target.name) + '.', 'miss');
      }
      refreshSidebar();
      await sleep(320);
      if (target.hp <= 0) break;
    }

    result.broke.forEach(function (b) {
      UI.log(UI.esc(b.unit.name) + "'s " + UI.esc(b.item.name) + ' broke!', 'warn');
    });

    /* Weapon experience */
    if (result.used.a > 0 && result.attackerWeapon) {
      var up = FE.gainWexp(attacker, FE.item(result.attackerWeapon).type, 2 * result.used.a);
      if (up && attacker.team === 'player') UI.log(UI.esc(attacker.name) + ' reached weapon rank ' + up + '!', 'good');
    }
    if (result.used.d > 0 && result.defenderWeapon) {
      var up2 = FE.gainWexp(defender, FE.item(result.defenderWeapon).type, 2 * result.used.d);
      if (up2 && defender.team === 'player') UI.log(UI.esc(defender.name) + ' reached weapon rank ' + up2 + '!', 'good');
    }

    var exp = FE.combatExp(result, attacker, defender);

    /* Deaths */
    await handleDeath(defender, attacker);
    await handleDeath(attacker, defender);

    for (var e = 0; e < exp.length; e++) {
      if (!exp[e].unit.alive) continue;
      await awardExp(exp[e].unit, exp[e].amount);
    }
    refreshSidebar();
  }

  async function runStaff(user, target) {
    var st = FE.usableStaves(user)[0];
    var amount = FE.staffHeal(user, st);
    var got = FE.heal(target, amount);
    G.renderer.addFloater(target.x, target.y, '+' + got, '#7ce38b');
    UI.log(UI.esc(user.name) + ' heals ' + UI.esc(target.name) + ' for ' + got + '.', 'good');
    FE.consume(user, st, 1);
    var up = FE.gainWexp(user, 'staff', 3);
    if (up && user.team === 'player') UI.log(UI.esc(user.name) + ' reached staff rank ' + up + '!', 'good');
    await sleep(320);
    if (user.team === 'player') await awardExp(user, FE.STAFF_EXP);
    refreshSidebar();
  }

  function awardExp(unit, amount) {
    return new Promise(function (resolve) {
      if (unit.team !== 'player') { resolve(); return; }
      var ups = FE.gainExp(unit, amount);
      UI.log(UI.esc(unit.name) + ' gained ' + Math.round(amount) + ' EXP.', 'exp');
      if (!ups.length) { refreshSidebar(); resolve(); return; }
      var queue = ups.slice();
      (function next() {
        if (!queue.length) { refreshSidebar(); resolve(); return; }
        var up = queue.shift();
        var rows = FE.STATS.map(function (s) {
          var g = up.gains[s] || 0;
          return '<div class="lvrow' + (g ? ' lvrow--up' : '') + '"><span>' + FE.STAT_LABEL[s]
            + '</span><b>' + FE.stat(unit, s) + (g ? ' <em>+' + g + '</em>' : '') + '</b></div>';
        }).join('');
        UI.dialog({
          title: UI.esc(unit.name) + ' &mdash; Level ' + up.level,
          body: '<div class="levelup">' + rows + '</div>',
          buttons: [{ label: 'Continue', primary: true, action: function () { UI.closeDialog(); next(); } }]
        });
        UI.log('<b>' + UI.esc(unit.name) + '</b> reached level ' + up.level + '!', 'good');
      })();
    });
  }

  async function handleDeath(unit, killer) {
    if (unit.hp > 0 || !unit.alive) return;
    unit.alive = false;
    if (killer) killer.kills++;
    G.renderer.addFloater(unit.x, unit.y, '†', '#ffffff');

    if (unit.drops) {
      var st = FE.makeItem(unit.drops);
      G.campaign.convoy.push(st);
      UI.log(UI.esc(unit.name) + ' dropped ' + UI.esc(FE.ITEMS[unit.drops].name) + ' (sent to convoy).', 'good');
    }

    if (unit.team === 'player') {
      UI.log('<b>' + UI.esc(unit.name) + ' has fallen.</b>', 'death');
      if (G.campaign.casual) {
        unit.casualDown = true;
      } else {
        delete G.campaign.roster[unit.id];
        G.campaign.fallen.push({ name: unit.name, chapter: chapter().title });
      }
    } else if (unit.team === 'ally') {
      UI.log('<b>' + UI.esc(unit.name) + ' has fallen.</b>', 'death');
    } else {
      UI.log(UI.esc(unit.name) + ' is defeated.', 'kill');
    }
    await sleep(260);
  }

  /* ---------------------------------------------------------------
     Turn flow
     --------------------------------------------------------------- */
  function finishUnit(u) {
    u.acted = true;
    clearSelection();
    updateHeader();
    afterAction();
  }

  function afterAction() {
    if (checkVictory()) return;
    if (checkDefeat()) return;
    var left = G.board.livingUnits('player').filter(function (x) { return !x.acted; });
    if (!left.length && G.phase === 'player') {
      setTimeout(endPlayerPhase, 350);
    }
  }

  function startPlayerPhase(first) {
    G.phase = 'player';
    var ch = chapter();
    if (!first && ch.objective.type === 'survive' && G.turn > ch.objective.turns) {
      endChapter(true);
      return;
    }
    G.board.livingUnits('player').forEach(function (u) {
      u.acted = false;
      u.buffs = {};
    });
    /* forts and thrones mend whoever holds them */
    G.board.livingUnits().forEach(function (u) {
      var t = G.board.terrainAt(u.x, u.y);
      if (t.heal && u.hp < FE.maxHp(u)) {
        var got = FE.heal(u, Math.ceil(FE.maxHp(u) * t.heal));
        if (got) G.renderer.addFloater(u.x, u.y, '+' + got, '#7ce38b');
      }
    });
    updateHeader();
    refreshSidebar();
    if (G.danger) recomputeDanger();
    saveGame(true);
    flashBanner('Player Phase', 'player');
  }

  function endPlayerPhase() {
    if (G.mode === 'busy') return;
    clearSelection();
    runEnemyPhase();
  }

  function flashBanner(text, kind) {
    var el = UI.$('#banner');
    el.textContent = text;
    el.className = 'banner banner--' + kind + ' is-show';
    setTimeout(function () { el.className = 'banner'; }, 900 / G.speed);
  }

  async function runEnemyPhase() {
    G.phase = 'enemy';
    G.mode = 'busy';
    updateHeader();
    flashBanner('Enemy Phase', 'enemy');
    await sleep(700);

    spawnReinforcements();

    var list = G.board.livingUnits('enemy').slice();
    for (var i = 0; i < list.length; i++) {
      var u = list[i];
      if (!u.alive) continue;
      await actUnit(u);
      if (checkDefeat()) return;
      if (checkVictory()) return;
    }

    /* green allies act after the enemy */
    G.phase = 'ally';
    updateHeader();
    var allies = G.board.livingUnits('ally').slice();
    for (var j = 0; j < allies.length; j++) {
      if (!allies[j].alive) continue;
      if (allies[j].ai === 'hold') continue;
      await actUnit(allies[j]);
    }

    G.turn++;
    G.campaign.turnsTotal++;
    G.mode = 'idle';
    startPlayerPhase(false);
  }

  function spawnReinforcements() {
    if (!G.pendingReinforcements) return;
    var diffBonus = G.campaign.difficulty === 'hard' ? 2 : 0;
    G.pendingReinforcements.forEach(function (r) {
      if (r.done || r.turn !== G.turn) return;
      r.done = true;
      var any = false;
      r.units.forEach(function (d) {
        if (G.board.unitAt(d.x, d.y)) return;
        var def = {};
        for (var k in d) def[k] = d[k];
        def.team = 'enemy';
        def.level = (d.level || 1) + diffBonus;
        var u = FE.makeUnit(def);
        u.drops = d.drops || null;
        G.board.units.push(u);
        G.renderer.addFloater(u.x, u.y, '!', '#ff9f43');
        any = true;
      });
      if (any && r.text) UI.log('<b>Reinforcements!</b> ' + UI.esc(r.text), 'warn');
    });
    if (G.danger) recomputeDanger();
  }

  async function actUnit(u) {
    var plan = FE.planTurn(G.board, u);
    if (!plan || plan.type === 'wait') { u.acted = true; return; }

    G.cursor = { x: u.x, y: u.y };
    if (plan.path && plan.path.length > 1) {
      var dest = plan.path[plan.path.length - 1];
      G.hideUnit = u;
      await animateAlong(u, plan.path);
      G.hideUnit = null;
      u.x = dest.x; u.y = dest.y;
      await sleep(80);
    }

    if (plan.type === 'attack' && plan.target && plan.target.alive) {
      await runCombat(u, plan.target);
    } else if (plan.type === 'staff' && plan.target && plan.target.alive) {
      var amount = FE.staffHeal(u, plan.staff);
      var got = FE.heal(plan.target, amount);
      G.renderer.addFloater(plan.target.x, plan.target.y, '+' + got, '#7ce38b');
      UI.log(UI.esc(u.name) + ' heals ' + UI.esc(plan.target.name) + ' for ' + got + '.');
      FE.consume(u, plan.staff, 1);
      await sleep(320);
    } else if (plan.type === 'item') {
      var it = FE.item(plan.item);
      var h = FE.heal(u, it.heal >= 999 ? 9999 : it.heal);
      G.renderer.addFloater(u.x, u.y, '+' + h, '#7ce38b');
      FE.consume(u, plan.item, 1);
      await sleep(260);
    }
    u.acted = true;
    if (G.danger) recomputeDanger();
    refreshSidebar();
  }

  /* ---------------------------------------------------------------
     Win / loss
     --------------------------------------------------------------- */
  function checkVictory() {
    if (G.mode === 'over') return true;
    var o = chapter().objective;
    var enemies = G.board.livingUnits('enemy');
    if (o.type === 'rout' && !enemies.length) { endChapter(true); return true; }
    if (o.type === 'boss') {
      var boss = G.board.units.filter(function (u) { return u.boss; });
      if (boss.length && !boss.some(function (b) { return b.alive; })) { endChapter(true); return true; }
    }
    return false;
  }

  function checkDefeat() {
    if (G.mode === 'over') return true;
    var players = G.board.livingUnits('player');
    var lord = players.filter(function (u) { return u.lordRef; });
    if (!lord.length) { endChapter(false, 'Aleryn has fallen.'); return true; }
    if (!players.length) { endChapter(false, 'The company is destroyed.'); return true; }
    return false;
  }

  function endChapter(won, reason) {
    if (G.mode === 'over') return;
    G.mode = 'over';
    clearSelection();
    var ch = chapter();

    if (!won) {
      UI.dialog({
        title: 'Defeat',
        body: '<div class="story"><p>' + UI.esc(reason || 'The company is broken.') + '</p>'
          + '<p class="muted">Fire Emblem is a game of second chances only in the form of a reload.</p></div>',
        buttons: [
          {
            label: 'Retry from this turn', primary: true,
            action: function () { UI.closeDialog(); if (!loadGame(SAVE_KEY)) restartChapter(); }
          },
          { label: 'Restart chapter', action: function () { UI.closeDialog(); restartChapter(); } },
          { label: 'Title screen', action: function () { UI.closeDialog(); showTitle(); } }
        ]
      });
      return;
    }

    /* survivors come home; casual-mode casualties get back up */
    G.board.livingUnits('player').concat(
      G.board.units.filter(function (u) { return u.team === 'player' && u.casualDown; })
    ).forEach(function (u) {
      u.alive = true;
      u.casualDown = false;
      u.hp = Math.max(1, Math.round(FE.maxHp(u) * 0.75));
      u.acted = false;
      u.buffs = {};
    });
    /* recruited green units stay */
    G.board.livingUnits('ally').forEach(function (u) {
      if (u.rosterId && G.campaign.roster[u.rosterId] === u) u.team = 'player';
    });

    var lines = ch.outro.slice();
    var isLast = G.campaign.chapterIndex >= FE.CHAPTERS.length - 1;
    storyDialog(isLast ? 'Victory' : ch.title + ' complete', lines, function () {
      UI.closeDialog();
      if (isLast) { showEnding(); return; }
      G.campaign.chapterIndex++;
      saveGame(true);
      beginChapter();
    });
  }

  function restartChapter() {
    /* The chapter-start save keeps the roster as it was before anyone
       died here, so a wipe is properly recoverable. */
    if (!loadGame(CHAPTER_KEY)) beginChapter();
  }

  function showEnding() {
    var roster = livingRoster();
    var rows = roster.map(function (u) {
      return '<div class="endrow"><b>' + UI.esc(u.name) + '</b><span>' + UI.esc(FE.CLASSES[u.cls].name)
        + ' Lv ' + u.level + '</span><span>' + u.kills + ' kills</span></div>';
    }).join('');
    var fallen = G.campaign.fallen.map(function (f) {
      return '<div class="endrow endrow--fallen"><b>' + UI.esc(f.name) + '</b><span>fell at ' + UI.esc(f.chapter) + '</span></div>';
    }).join('');
    UI.dialog({
      title: 'The March of Vale',
      wide: true,
      body: '<div class="story"><p>Total turns taken: <b>' + G.campaign.turnsTotal + '</b></p></div>'
        + '<h4>Survivors</h4>' + rows
        + (fallen ? '<h4>The fallen</h4>' + fallen : '<p class="muted">Nobody was lost. Remarkable.</p>'),
      buttons: [{ label: 'Title screen', primary: true, action: function () { UI.closeDialog(); showTitle(); } }]
    });
  }

  /* ---------------------------------------------------------------
     Danger zone
     --------------------------------------------------------------- */
  function recomputeDanger() {
    G.dangerTiles = G.board ? G.board.dangerZone() : null;
  }

  function toggleDanger() {
    if (G.screen !== 'map') return;
    G.danger = !G.danger;
    if (G.danger) recomputeDanger(); else G.dangerTiles = null;
    UI.$('#btnDanger').classList.toggle('is-on', G.danger);
  }

  /* ---------------------------------------------------------------
     Save / load
     --------------------------------------------------------------- */
  function serialiseUnit(u) {
    var o = {};
    ['uid', 'id', 'name', 'cls', 'team', 'level', 'exp', 'stats', 'growths', 'wexp',
      'items', 'x', 'y', 'acted', 'alive', 'ai', 'aggro', 'aggroed', 'boss', 'hair',
      'drops', 'title', 'desc', 'kills', 'battles', 'hp', 'maxHp', 'lordRef',
      'rosterId', 'talk', 'casualDown'].forEach(function (k) {
        if (u[k] !== undefined) o[k] = u[k];
      });
    return o;
  }

  function saveGame(quiet, alsoChapterStart) {
    if (!G.campaign) return;
    try {
      var data = {
        v: 1,
        campaign: {
          chapterIndex: G.campaign.chapterIndex,
          difficulty: G.campaign.difficulty,
          casual: G.campaign.casual,
          convoy: G.campaign.convoy,
          fallen: G.campaign.fallen,
          turnsTotal: G.campaign.turnsTotal,
          roster: Object.keys(G.campaign.roster).reduce(function (acc, k) {
            acc[k] = serialiseUnit(G.campaign.roster[k]);
            return acc;
          }, {})
        },
        inChapter: G.screen === 'map' ? {
          turn: G.turn,
          tiles: G.board.tiles,
          visited: G.board.visited,
          opened: G.board.opened,
          units: G.board.units.map(serialiseUnit),
          reinforcements: (G.pendingReinforcements || []).map(function (r) {
            return { turn: r.turn, done: r.done };
          })
        } : null
      };
      var json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
      if (alsoChapterStart) localStorage.setItem(CHAPTER_KEY, json);
      if (!quiet) UI.log('Game saved.', 'good');
      return true;
    } catch (e) {
      if (!quiet) UI.log('Could not save: ' + e.message, 'warn');
      return false;
    }
  }

  function hasSave(which) {
    try { return !!localStorage.getItem(which || SAVE_KEY); } catch (e) { return false; }
  }

  function loadGame(which) {
    var raw;
    try { raw = localStorage.getItem(which || SAVE_KEY); } catch (e) { raw = null; }
    if (!raw) return false;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return false; }
    if (!data || !data.campaign) return false;

    G.campaign = newCampaign({ difficulty: data.campaign.difficulty, casual: data.campaign.casual });
    G.campaign.chapterIndex = data.campaign.chapterIndex;
    G.campaign.convoy = data.campaign.convoy || [];
    G.campaign.fallen = data.campaign.fallen || [];
    G.campaign.turnsTotal = data.campaign.turnsTotal || 0;
    G.campaign.roster = {};
    Object.keys(data.campaign.roster || {}).forEach(function (k) {
      G.campaign.roster[k] = data.campaign.roster[k];
    });

    var ch = chapter();
    G.pendingReinforcements = (ch.reinforcements || []).map(function (r, i) {
      var saved = data.inChapter && data.inChapter.reinforcements && data.inChapter.reinforcements[i];
      return { turn: r.turn, units: r.units, text: r.text, done: saved ? saved.done : false };
    });

    if (data.inChapter) {
      G.board = new FE.Board(ch);
      G.board.tiles = data.inChapter.tiles;
      G.board.visited = data.inChapter.visited || {};
      G.board.opened = data.inChapter.opened || {};
      G.board.units = data.inChapter.units.map(function (o) {
        /* re-point roster entries at the live board objects */
        if (o.team === 'player' && G.campaign.roster[o.id]) {
          G.campaign.roster[o.id] = o;
        }
        return o;
      });
      G.renderer.bake(G.board);
      G.turn = data.inChapter.turn;
      G.phase = 'player';
      G.screen = 'map';
      G.mode = 'idle';
      G.selected = null;
      document.body.dataset.screen = 'map';
      var first = G.board.livingUnits('player')[0];
      G.cursor = first ? { x: first.x, y: first.y } : { x: 0, y: 0 };
      UI.$('#log').innerHTML = '';
      UI.log('Loaded — ' + ch.title + ', turn ' + G.turn + '.', 'good');
      updateHeader();
      refreshSidebar();
      if (G.danger) recomputeDanger();
      G.board.livingUnits('player').forEach(function (u) { u.acted = false; });
      updateHeader();
      return true;
    }
    beginChapter();
    return true;
  }

  /* ---------------------------------------------------------------
     Input
     --------------------------------------------------------------- */
  function canvasTile(evt) {
    var cv = UI.$('#map');
    var r = cv.getBoundingClientRect();
    var sx = cv.width / r.width, sy = cv.height / r.height;
    var x = Math.floor(((evt.clientX - r.left) * sx) / TS);
    var y = Math.floor(((evt.clientY - r.top) * sy) / TS);
    return { x: x, y: y };
  }

  function onCanvasMove(evt) {
    if (!G.board || G.screen !== 'map') return;
    var t = canvasTile(evt);
    if (!G.board.inside(t.x, t.y)) return;
    if (t.x === G.cursor.x && t.y === G.cursor.y) return;
    G.cursor = t;
    if (G.mode === 'moving') updatePathPreview(t.x, t.y);
    if (G.mode === 'idle' || G.mode === 'moving' || G.mode === 'inspect') {
      G.hoverUnit = G.board.unitAt(t.x, t.y);
      refreshSidebar();
      previewForecast();
    }
  }

  /* Hovering an enemy while a unit is selected shows the trade preview. */
  function previewForecast() {
    if (G.mode !== 'moving' || !G.selected) { if (G.mode !== 'target') setForecastPanel(''); return; }
    var foe = G.board.unitAt(G.cursor.x, G.cursor.y);
    if (!foe || !FE.hostile(G.selected, foe)) { setForecastPanel(''); return; }
    /* find the best tile we can reach that hits this foe */
    var ranges = FE.attackRanges(G.selected);
    if (!ranges.length) { setForecastPanel(''); return; }
    var best = null;
    G.reach.forEach(function (t) {
      var d = Math.abs(t.x - foe.x) + Math.abs(t.y - foe.y);
      if (ranges.indexOf(d) < 0) return;
      if (!best || t.cost < best.cost) best = t;
    });
    if (!best) { setForecastPanel(''); return; }
    var f = FE.forecast(G.board, G.selected, best, foe);
    setForecastPanel(UI.forecast(f, G.selected, foe));
  }

  async function onCanvasClick(evt) {
    if (!G.board || G.screen !== 'map' || UI.isDialogOpen()) return;
    if (G.mode === 'busy' || G.mode === 'over') return;
    if (G.phase !== 'player') return;
    var t = canvasTile(evt);
    if (!G.board.inside(t.x, t.y)) return;
    G.cursor = t;

    if (G.mode === 'target') {
      var idx = G.targets.findIndex(function (o) { return o.x === t.x && o.y === t.y; });
      if (idx >= 0) {
        G.targetIndex = idx;
        await confirmTarget();
      } else {
        cancel();
      }
      return;
    }

    if (G.mode === 'menu') { cancel(); return; }

    var unit = G.board.unitAt(t.x, t.y);

    if (G.mode === 'moving' && G.selected) {
      if (G.moveTiles[key(t.x, t.y)] && (!unit || unit === G.selected)) {
        var u = G.selected;
        var path = G.board.pathTo(G.reach._map, t.x, t.y);
        G.mode = 'busy';
        G.moveTiles = null; G.attackTiles = null; G.staffTiles = null; G.path = [];
        await moveUnitTo(u, path);
        G.cursor = { x: u.x, y: u.y };
        openActionMenu();
        return;
      }
      if (unit && unit !== G.selected) { clearSelection(); selectUnit(unit); return; }
      clearSelection();
      return;
    }

    if (unit) {
      selectUnit(unit);
      previewForecast();
    } else {
      clearSelection();
    }
  }

  function cancel() {
    if (G.mode === 'busy' || G.mode === 'over') return;
    if (UI.isDialogOpen()) return;
    if (G.mode === 'target') {
      setForecastPanel('');
      G.hoverUnit = null;
      G.targets = [];
      openActionMenu();
      return;
    }
    if (G.mode === 'menu') {
      /* undo the move, the way the GBA games let you */
      var u = G.selected;
      UI.closeMenu(UI.$('#menuHost'));
      if (u && G.origin) {
        u.x = G.origin.x;
        u.y = G.origin.y;
      }
      clearSelection();
      if (u) { selectUnit(u); }
      return;
    }
    clearSelection();
  }

  function nextUnit() {
    if (G.phase !== 'player' || G.mode === 'busy') return;
    var list = G.board.livingUnits('player').filter(function (u) { return !u.acted; });
    if (!list.length) return;
    var i = list.indexOf(G.selected);
    var u = list[(i + 1) % list.length];
    clearSelection();
    G.cursor = { x: u.x, y: u.y };
    selectUnit(u);
  }

  function onKey(e) {
    if (G.screen !== 'map') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (UI.isDialogOpen()) {
      if (k === 'Enter' || k === ' ') {
        var b = UI.$('#modal').querySelector('.btn--primary') || UI.$('#modal').querySelector('.btn');
        if (b) { e.preventDefault(); b.click(); }
      }
      return;
    }
    var moved = false;
    if (k === 'ArrowUp' || k === 'w') { G.cursor.y = Math.max(0, G.cursor.y - 1); moved = true; }
    if (k === 'ArrowDown' || k === 's') { G.cursor.y = Math.min(G.board.h - 1, G.cursor.y + 1); moved = true; }
    if (k === 'ArrowLeft' || k === 'a') { G.cursor.x = Math.max(0, G.cursor.x - 1); moved = true; }
    if (k === 'ArrowRight' || k === 'd') { G.cursor.x = Math.min(G.board.w - 1, G.cursor.x + 1); moved = true; }
    if (moved) {
      e.preventDefault();
      if (G.mode === 'target') {
        cycleTarget(k === 'ArrowLeft' || k === 'ArrowUp' || k === 'a' || k === 'w' ? -1 : 1);
        return;
      }
      if (G.mode === 'moving') updatePathPreview(G.cursor.x, G.cursor.y);
      G.hoverUnit = G.board.unitAt(G.cursor.x, G.cursor.y);
      refreshSidebar();
      previewForecast();
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      var fake = { clientX: 0, clientY: 0 };
      /* reuse click logic against the current cursor tile */
      simulateClickAtCursor();
      return;
    }
    if (k === 'Escape' || k === 'Backspace') { e.preventDefault(); cancel(); return; }
    if (k === 'e' || k === 'E') { endTurnRequest(); return; }
    if (k === 'q' || k === 'Q') { toggleDanger(); return; }
    if (k === 'Tab') { e.preventDefault(); nextUnit(); return; }
  }

  async function simulateClickAtCursor() {
    var cv = UI.$('#map');
    var r = cv.getBoundingClientRect();
    var scale = r.width / cv.width;
    await onCanvasClick({
      clientX: r.left + (G.cursor.x * TS + TS / 2) * scale,
      clientY: r.top + (G.cursor.y * TS + TS / 2) * scale
    });
  }

  function endTurnRequest() {
    /* The top bar sits behind the modal overlay, so guard every entry
       point against being triggered while a screen or dialog is up. */
    if (G.screen !== 'map' || UI.isDialogOpen()) return;
    if (G.phase !== 'player' || G.mode === 'busy' || G.mode === 'over') return;
    var left = G.board.livingUnits('player').filter(function (u) { return !u.acted; }).length;
    if (left > 0) {
      UI.dialog({
        title: 'End turn?',
        body: '<p>' + left + ' unit' + (left === 1 ? ' has' : 's have') + ' not acted yet.</p>',
        buttons: [
          { label: 'End turn', primary: true, action: function () { UI.closeDialog(); endPlayerPhase(); } },
          { label: 'Keep playing', action: UI.closeDialog }
        ]
      });
    } else {
      endPlayerPhase();
    }
  }

  /* ---------------------------------------------------------------
     Title screen
     --------------------------------------------------------------- */
  function showTitle() {
    G.screen = 'title';
    G.board = null;
    document.body.dataset.screen = 'title';
    UI.closeDialog();
    UI.$('#titleScreen').classList.add('is-open');
    UI.$('#btnContinue').disabled = !hasSave();
  }

  function startNew() {
    var diff = UI.$('#optDifficulty').value;
    var casual = UI.$('#optCasual').checked;
    G.campaign = newCampaign({ difficulty: diff, casual: casual });
    UI.$('#titleScreen').classList.remove('is-open');
    document.body.dataset.screen = 'prep';
    beginChapter();
  }

  /* ---------------------------------------------------------------
     Main loop
     --------------------------------------------------------------- */
  function loop() {
    if (G.board && G.renderer && G.screen === 'map') {
      G.renderer.draw({
        board: G.board,
        moveTiles: G.moveTiles,
        attackTiles: G.attackTiles,
        staffTiles: G.staffTiles,
        danger: G.danger ? G.dangerTiles : null,
        path: G.mode === 'moving' ? G.path : null,
        cursor: G.cursor,
        hideUnit: G.hideUnit,
        anim: G.anim,
        blinkUnit: G.mode === 'target' ? G.targets[G.targetIndex] : G.selected
      });
    }
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  FE.boot = function () {
    G.renderer = new FE.Renderer(UI.$('#map'));

    var cv = UI.$('#map');
    cv.addEventListener('mousemove', onCanvasMove);
    cv.addEventListener('click', onCanvasClick);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); cancel(); });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', function () {
      if (G.renderer) G.renderer.fit();
    });

    UI.$('#btnEndTurn').addEventListener('click', endTurnRequest);
    UI.$('#btnDanger').addEventListener('click', toggleDanger);
    UI.$('#btnSave').addEventListener('click', function () {
      if (G.screen !== 'map' || UI.isDialogOpen()) return;
      saveGame(false);
    });
    UI.$('#btnLoad').addEventListener('click', function () {
      if (UI.isDialogOpen()) return;
      if (!hasSave()) { UI.log('No save found.', 'warn'); return; }
      UI.dialog({
        title: 'Load save?',
        body: '<p>Current progress in this chapter will be lost.</p>',
        buttons: [
          { label: 'Load', primary: true, action: function () { UI.closeDialog(); loadGame(); } },
          { label: 'Cancel', action: UI.closeDialog }
        ]
      });
    });
    UI.$('#btnSpeed').addEventListener('click', function () {
      G.speed = G.speed === 1 ? 2 : (G.speed === 2 ? 4 : 1);
      this.textContent = 'Speed x' + G.speed;
    });
    UI.$('#btnTitle').addEventListener('click', function () {
      if (UI.isDialogOpen()) return;
      UI.dialog({
        title: 'Return to title?',
        body: '<p>Unsaved progress in this chapter will be lost.</p>',
        buttons: [
          { label: 'Return', primary: true, action: function () { UI.closeDialog(); showTitle(); } },
          { label: 'Cancel', action: UI.closeDialog }
        ]
      });
    });
    UI.$('#btnHelp').addEventListener('click', function () {
      if (UI.isDialogOpen()) return;
      showHelp();
    });
    UI.$('#btnNew').addEventListener('click', startNew);
    UI.$('#btnContinue').addEventListener('click', function () {
      UI.$('#titleScreen').classList.remove('is-open');
      if (!loadGame()) showTitle();
    });
    UI.$('#btnHowTo').addEventListener('click', showHelp);

    showTitle();
    loop();
  };

  function showHelp() {
    UI.dialog({
      title: 'How to play',
      wide: true,
      body: '<div class="help">'
        + '<h4>The idea</h4>'
        + '<p>Two armies take turns. Move each of your units, then the enemy moves. '
        + 'Units that fall are gone for good unless you turned on Forgiving mode.</p>'
        + '<h4>Controls</h4>'
        + '<ul>'
        + '<li><b>Click a unit</b> to select; blue tiles are where it can go, red where it can strike.</li>'
        + '<li><b>Click a tile</b> to move there, then pick an action.</li>'
        + '<li><b>Right-click / Esc</b> cancels — including undoing a move before you act.</li>'
        + '<li><b>Arrows + Enter</b> work too. <b>Tab</b> cycles unused units, <b>E</b> ends the turn, <b>Q</b> toggles the danger zone.</li>'
        + '</ul>'
        + '<h4>The weapon triangle</h4>'
        + '<p>Swords beat axes, axes beat lances, lances beat swords (+1 damage, +15 hit, and the reverse against you). '
        + 'For magic: anima beats light, light beats dark, dark beats anima.</p>'
        + '<h4>Numbers that matter</h4>'
        + '<ul>'
        + '<li><b>Doubling:</b> 4 or more attack speed than your foe and you strike twice. Heavy weapons cut attack speed if your Con is low.</li>'
        + '<li><b>Hit rates</b> use the series\' two-roll system: displayed rates above 50 land more often than the number suggests, below 50 less.</li>'
        + '<li><b>Terrain</b> gives defence and avoid. Forts and thrones also heal each turn.</li>'
        + '<li><b>Bows</b> are effective against fliers; hammers and armourslayers against armour; horseslayers against cavalry.</li>'
        + '</ul>'
        + '<h4>Other things to try</h4>'
        + '<ul>'
        + '<li>Visit villages with any unit — they hand over items.</li>'
        + '<li>Units marked <b>!</b> can be recruited: move Aleryn next to them and choose <b>Talk</b>.</li>'
        + '<li>At level 10 a promotion item turns a unit into its advanced class.</li>'
        + '</ul>'
        + '</div>',
      buttons: [{ label: 'Got it', primary: true, action: UI.closeDialog }]
    });
  }

  window.addEventListener('DOMContentLoaded', function () { FE.boot(); });
})(window.FE);

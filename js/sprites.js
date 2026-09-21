/* =============================================================
   sprites.js — Procedural pixel art. No external assets: every
   unit sprite is a 16x16 character matrix, palette-swapped per
   team and baked into an offscreen canvas once.
   ============================================================= */
(function (FE) {
  'use strict';

  /* Character legend:
     .  transparent      o  outline        s  skin        h  hair
     a  primary (team)   b  secondary      m  metal       w  weapon blade
     d  wood / leather   c  cloth / cape   e  eye         g  beast (horse/wyvern)
  */
  var S = FE.SPRITES = {};

  S.infantry = [
    '................',
    '......oooo......',
    '.....ohhhho.....',
    '.....hssssh.....',
    '.....sesesw.....',
    '......ssssw.....',
    '....oobbbow.....',
    '...oaaaaaow.....',
    '..caaaaaaaw.....',
    '..caaaaaaow.....',
    '..c.aaaaa.d.....',
    '....abbba.d.....',
    '....am.ma.......',
    '...ommommo......',
    '...om..omo......',
    '................'
  ];

  S.armor = [
    '................',
    '.....ommmmo.....',
    '....ommmmmmo....',
    '....om.mm.mo....',
    '....ossssso.....',
    '...ombbbbbmo....',
    '..ommaaaammo..w.',
    '..omaaaaaamo..w.',
    '..ommaaaammo..w.',
    '...maaaaaam..ow.',
    '....baaaab...ow.',
    '....maaaam...od.',
    '....mm..mm....d.',
    '...ommo.ommo....',
    '...ommo.ommo....',
    '................'
  ];

  S.cavalry = [
    '................',
    '.......oooo.....',
    '......ommmmo....',
    '......ossso.....',
    '.....obbbbbo....',
    '....caaaaaao.w..',
    '....caaaaaao.w..',
    '.....oaaaao..w..',
    '..ogggggggggo...',
    '.oggggggggggggo.',
    'oggggmgggggggggo',
    'ogggggggggggggo.',
    '.og.gg.o.gg.go..',
    '..o.oo.o.oo.o...',
    '..o.oo.o.oo.o...',
    '..ooooo.ooooo...'
  ];

  S.flier = [
    '..cc............',
    '.cccc..oooo.....',
    'cccccc.ohhho....',
    '.cccccchssssh...',
    '..cccc.sesesm...',
    '...cc.obbbbom...',
    '....ooaaaaaom...',
    '...oaaaaaaaom...',
    '..ogggggggggom..',
    '.ogggggggggggo..',
    'oggggggggggggo..',
    '.oggggggggggo...',
    '..og.gg.gg.go...',
    '..o.oo.oo.o.o...',
    '..o.oo.oo.o.....',
    '..ooo..oooo.....'
  ];

  S.mage = [
    '................',
    '......oooo......',
    '.....obbbbo.....',
    '.....bssssb.....',
    '.....sesess.....',
    '......ssss..od..',
    '....oocccoo.od..',
    '...ocaaaaco.od..',
    '...caaaaaac.ow..',
    '..caaaaaaaacow..',
    '..caaaaaaaac.d..',
    '..cabbbbbbac.d..',
    '..caaaaaaaac....',
    '.ccaaaaaaaacc...',
    '.ccccccccccc....',
    '..occccccco.....'
  ];

  S.archer = [
    '................',
    '......oooo...o..',
    '.....ohhhho.ow..',
    '.....hssssh.w.d.',
    '.....sesess.w.d.',
    '......ssss..w.d.',
    '....oobbboo.w.d.',
    '...oaaaaaao.w.d.',
    '..caaaaaaaaow.d.',
    '..caaaaaaao.w.d.',
    '..c.aaaaa...w.d.',
    '....abbba...ow..',
    '....am.ma....o..',
    '...ommommo......',
    '...om..omo......',
    '................'
  ];

  var TEAM_PALETTE = {
    player: { a: '#4b7fd6', b: '#27508f', c: '#7fa9ee' },
    enemy:  { a: '#c8402e', b: '#7d1d14', c: '#e57c62' },
    ally:   { a: '#3aa354', b: '#1d6b33', c: '#77d08c' },
    other:  { a: '#9b7fd6', b: '#5d448f', c: '#c3aee8' }
  };

  var COMMON = {
    o: '#161320', s: '#f2c79a', h: '#6a4526', m: '#c9cfda',
    w: '#eef0f4', d: '#8a5a2b', e: '#161320', g: '#8d6b4d'
  };

  var cache = {};

  /* Bake one sprite to an offscreen canvas at `px` pixels per cell. */
  function bake(spriteName, team, px, hair) {
    var key = spriteName + '|' + team + '|' + px + '|' + (hair || '');
    if (cache[key]) return cache[key];
    var matrix = S[spriteName] || S.infantry;
    var w = matrix[0].length, h = matrix.length;
    var cv = document.createElement('canvas');
    cv.width = w * px; cv.height = h * px;
    var ctx = cv.getContext('2d');
    var pal = {};
    var k;
    for (k in COMMON) pal[k] = COMMON[k];
    var tp = TEAM_PALETTE[team] || TEAM_PALETTE.other;
    for (k in tp) pal[k] = tp[k];
    if (hair) pal.h = hair;
    /* horses/wyverns take a tinted hide so teams still read apart */
    if (team === 'enemy') pal.g = '#7a4f3c';
    if (team === 'ally') pal.g = '#6f7f55';

    for (var y = 0; y < h; y++) {
      var row = matrix[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch === '.') continue;
        var col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
    cache[key] = cv;
    return cv;
  }

  FE.getSprite = function (spriteName, team, px, hair) {
    return bake(spriteName, team, px || 2, hair);
  };

  /* ---- Small item / weapon glyphs used by the UI ---- */
  FE.drawWeaponGlyph = function (ctx, type, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    var s = size / 16;
    ctx.scale(s, s);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    var colors = {
      sword: '#dfe6f2', lance: '#cfd8e6', axe: '#d8c8a8', bow: '#c39a5d',
      anima: '#e2603c', light: '#f0d766', dark: '#8f5ecb', staff: '#8ed4c5'
    };
    ctx.strokeStyle = colors[type] || '#cccccc';
    ctx.fillStyle = ctx.strokeStyle;
    switch (type) {
      case 'sword':
        ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(8, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 11); ctx.lineTo(12, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 11); ctx.lineTo(8, 15); ctx.stroke();
        break;
      case 'lance':
        ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(8, 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(5, 6); ctx.lineTo(11, 6); ctx.closePath(); ctx.fill();
        break;
      case 'axe':
        ctx.beginPath(); ctx.moveTo(7, 2); ctx.lineTo(7, 15); ctx.stroke();
        ctx.beginPath(); ctx.arc(7, 5, 5, -1.2, 1.2); ctx.lineTo(7, 5); ctx.closePath(); ctx.fill();
        break;
      case 'bow':
        ctx.beginPath(); ctx.arc(10, 8, 6, 2.0, 4.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(6, 13); ctx.stroke();
        break;
      case 'staff':
        ctx.beginPath(); ctx.moveTo(8, 4); ctx.lineTo(8, 15); ctx.stroke();
        ctx.beginPath(); ctx.arc(8, 4, 3, 0, 6.3); ctx.stroke();
        break;
      default: /* tomes */
        ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(13, 3); ctx.lineTo(13, 13); ctx.lineTo(3, 13);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1b1726';
        ctx.beginPath(); ctx.moveTo(8, 3); ctx.lineTo(8, 13); ctx.stroke();
    }
    ctx.restore();
  };
})(window.FE);

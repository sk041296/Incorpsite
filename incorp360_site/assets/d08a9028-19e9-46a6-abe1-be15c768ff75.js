/* ============================================================
   INCORP 360 — Dashboard real-time engine
   Renders the físico-financeiro chart and animates live KPIs.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noMotion = function () { return document.body.classList.contains('no-motion'); };

  var svg = document.getElementById('ffChart');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var VW = 520, VH = 196, padL = 6, padR = 514, padT = 14, padB = 172;

  // months 0..12 ; previsto S-curve
  var planned = [0, 3, 9, 18, 30, 44, 58, 70, 80, 88, 94, 98, 100];
  // realizado up to "now" (~ month 7), slightly tracking plan
  var realized = [0, 4, 11, 21, 33, 47, 60, 68.2];

  function x(i) { return padL + (i / 12) * (padR - padL); }
  function y(p) { return padB - (p / 100) * (padB - padT); }

  function pts(arr) {
    return arr.map(function (p, i) { return x(i) + ',' + y(p); }).join(' ');
  }

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function render() {
    svg.innerHTML = '';

    // defs gradient
    var defs = el('defs', {});
    defs.innerHTML =
      '<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#e8581e" stop-opacity="0.34"/>' +
      '<stop offset="100%" stop-color="#e8581e" stop-opacity="0"/>' +
      '</linearGradient>';
    svg.appendChild(defs);

    // gridlines (25/50/75/100)
    [0, 25, 50, 75, 100].forEach(function (g) {
      svg.appendChild(el('line', { x1: padL, y1: y(g), x2: padR, y2: y(g), stroke: 'rgba(255,255,255,0.07)', 'stroke-width': 1 }));
    });

    // planned dashed line
    svg.appendChild(el('polyline', {
      points: pts(planned), fill: 'none', stroke: '#5683bd', 'stroke-width': 2,
      'stroke-dasharray': '5 5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));

    // realized area
    var areaPts = pts(realized) + ' ' + x(realized.length - 1) + ',' + y(0) + ' ' + x(0) + ',' + y(0);
    svg.appendChild(el('polygon', { points: areaPts, fill: 'url(#areaGrad)' }));

    // realized solid line
    svg.appendChild(el('polyline', {
      points: pts(realized), fill: 'none', stroke: '#e8581e', 'stroke-width': 2.6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));

    // live dot at current realized
    var li = realized.length - 1;
    var halo = el('circle', { cx: x(li), cy: y(realized[li]), r: 7, fill: 'rgba(232,88,30,0.25)' });
    var dot = el('circle', { cx: x(li), cy: y(realized[li]), r: 4, fill: '#fff', stroke: '#e8581e', 'stroke-width': 2.4 });
    svg.appendChild(halo);
    svg.appendChild(dot);
    if (!reduce && !noMotion()) {
      var anim = el('animate', { attributeName: 'r', values: '7;11;7', dur: '1.8s', repeatCount: 'indefinite' });
      halo.appendChild(anim);
    }
  }
  render();

  /* ---------- live ticking ---------- */
  if (reduce) return;

  var secs = 8;
  var feedSeed = [
    { ic: 'g', t: 'Concretagem do 2º pavimento concluída', a: 'há 12 min' },
    { ic: 'b', t: 'Medição semanal validada — dentro do orçado', a: 'há 1 h' },
    { ic: 'o', t: 'Cronograma recalculado: alvenaria +3%', a: 'há 2 h' },
    { ic: 'b', t: 'Inspeção de qualidade aprovada (96%)', a: 'há 3 h' },
    { ic: 'o', t: 'Recebimento de material: revestimentos', a: 'há 5 h' },
    { ic: 'g', t: 'Vistoria de prazo: obra no cronograma', a: 'há 6 h' }
  ];
  var feedList = document.getElementById('feedList');
  var feedIdx = 0;
  var ICS = {
    b: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>',
    o: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    g: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>'
  };
  function makeItem(d) {
    var div = document.createElement('div');
    div.className = 'fitem';
    div.innerHTML = '<span class="fitem__ic ' + d.ic + '">' + ICS[d.ic] + '</span>' +
      '<div class="fitem__txt"><b>' + d.t + '</b><span>' + d.a + '</span></div>';
    return div;
  }
  function seedFeed() {
    if (!feedList) return;
    feedList.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      feedList.appendChild(makeItem(feedSeed[i]));
    }
    feedIdx = 3;
  }
  seedFeed();

  function pushFeed() {
    if (!feedList || noMotion()) return;
    var d = feedSeed[feedIdx % feedSeed.length];
    feedIdx++;
    var item = makeItem({ ic: d.ic, t: d.t, a: 'agora' });
    feedList.insertBefore(item, feedList.firstChild);
    while (feedList.children.length > 3) feedList.removeChild(feedList.lastChild);
    secs = 0; // reset "última atualização"
  }

  // KPI gentle fluctuation
  var fisico = 68.2, custo = 98.6, qual = 96, prazo = 142, costReal = 720140, mileAlv = 72;
  var spi = 1.02, cpi = 1.04, prod = 94;
  function fmtPct(n) { return n.toFixed(1).replace('.', ',') + '%'; }
  function fmtBR(n) { return 'R$ ' + Math.round(n).toLocaleString('pt-BR'); }

  function tickFast() {
    if (noMotion()) return;
    secs++;
    var u = document.getElementById('updSecs');
    if (u) u.textContent = secs + 's';
  }

  function tickSlow() {
    if (noMotion()) return;
    // small believable drifts
    fisico = Math.min(69.4, fisico + Math.random() * 0.12);
    qual = Math.max(95, Math.min(97, qual + (Math.random() - 0.5) * 0.4));
    custo = Math.max(98.1, Math.min(99.2, custo + (Math.random() - 0.5) * 0.25));
    mileAlv = Math.min(78, mileAlv + Math.random() * 0.3);
    costReal += Math.random() * 380;

    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('kpiFisico', fmtPct(fisico));
    set('kpiQual', Math.round(qual) + '%');
    set('kpiCusto', fmtPct(custo));
    set('costReal', fmtBR(costReal));
    set('mileAlv', Math.round(mileAlv) + '%');
    var dev = (100 - custo);
    set('costDev', '−' + dev.toFixed(1).replace('.', ',') + '% · economia');
    var bar = document.getElementById('costRealBar');
    if (bar) bar.style.width = (costReal / 1078350 * 100).toFixed(1) + '%';

    // update live realized point + chart
    // --- extra controlled-data widgets ---
    cpi = Math.max(1.01, Math.min(1.06, 1 + (100 - custo) / 100 + (Math.random() - 0.5) * 0.004));
    spi = Math.max(0.98, Math.min(1.05, spi + (Math.random() - 0.5) * 0.01));
    prod = Math.max(90, Math.min(98, prod + (Math.random() - 0.5) * 0.8));
    var eac = 1078350 / cpi, dEac = 1078350 - eac;
    set('spiVal', spi.toFixed(2).replace('.', ','));
    set('cpiVal', cpi.toFixed(2).replace('.', ','));
    set('prodVal', Math.round(prod) + '%');
    set('eacVal', fmtBR(Math.round(eac / 1000) * 1000));
    set('eacDelta', '\u2212' + fmtBR(Math.round(dEac / 1000) * 1000).replace('R$ ', 'R$ ') + ' vs or\u00e7ado');
    var sb = document.getElementById('spiBar'); if (sb) sb.style.width = Math.min(100, (spi - 0.9) / 0.2 * 100).toFixed(0) + '%';
    var cb = document.getElementById('cpiBar'); if (cb) cb.style.width = Math.min(100, (cpi - 0.95) / 0.12 * 100).toFixed(0) + '%';
    var ctb = document.getElementById('catTotalBar'); if (ctb) ctb.style.width = (costReal / 1078350 * 100).toFixed(1) + '%';
    var ct = document.getElementById('catTotal'); if (ct) ct.innerHTML = fmtBR(costReal) + ' <em>/ 1.078.350</em>';

    realized[realized.length - 1] = fisico;
    render();
  }

  var fastI, slowI, feedI;
  function start() {
    stop();
    fastI = setInterval(tickFast, 1000);
    slowI = setInterval(tickSlow, 4200);
    feedI = setInterval(pushFeed, 9000);
  }
  function stop() { clearInterval(fastI); clearInterval(slowI); clearInterval(feedI); }

  // only run while the section is on screen, to save cycles
  if ('IntersectionObserver' in window) {
    var sec = document.getElementById('gestao');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.12 });
    if (sec) io.observe(sec); else start();
  } else {
    start();
  }
})();

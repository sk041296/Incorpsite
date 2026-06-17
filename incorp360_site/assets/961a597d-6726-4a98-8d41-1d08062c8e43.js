/* ============================================================
   INCORP 360 — interactions (scroll-driven, IO-free for reliability)
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = window;

  function vh() { return W.innerHeight || document.documentElement.clientHeight; }

  /* ---------- NAV scroll state ---------- */
  var nav = document.getElementById('nav');
  function navState() {
    if (W.scrollY > 40) { nav.classList.add('scrolled'); nav.classList.remove('on-dark'); }
    else { nav.classList.remove('scrolled'); nav.classList.add('on-dark'); }
  }

  /* ---------- Count up ---------- */
  function animateCount(el) {
    if (el._counted) return; el._counted = true;
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = prefix + target.toLocaleString('pt-BR') + suffix; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString('pt-BR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveal + counters via scroll ---------- */
  function refreshReveals() {
    var els = document.querySelectorAll('[data-reveal]:not(.in)');
    var trigger = vh() * 0.92;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.top < trigger && r.bottom > 0) els[i].classList.add('in');
    }
    var cs = document.querySelectorAll('[data-count]');
    for (var j = 0; j < cs.length; j++) {
      if (cs[j]._counted) continue;
      var rc = cs[j].getBoundingClientRect();
      if (rc.top < vh() * 0.85 && rc.bottom > 0) animateCount(cs[j]);
    }
  }

  /* ---------- Process pinned steps ---------- */
  var psteps = Array.prototype.slice.call(document.querySelectorAll('.pstep'));
  var pvs = Array.prototype.slice.call(document.querySelectorAll('.pv'));
  var curStep = -1;
  function setStep(idx) {
    if (idx === curStep) return; curStep = idx;
    psteps.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
    pvs.forEach(function (v, i) { v.classList.toggle('show', i === idx); });
  }
  function refreshSteps() {
    if (!psteps.length) return;
    var mid = vh() * 0.5, best = 0, bestD = Infinity;
    for (var i = 0; i < psteps.length; i++) {
      var r = psteps[i].getBoundingClientRect();
      var c = r.top + r.height / 2;
      var d = Math.abs(c - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    setStep(best);
  }
  psteps.forEach(function (s) {
    s.addEventListener('click', function () {
      setStep(parseInt(s.getAttribute('data-step'), 10));
    });
  });

  /* ---------- Before / After auto demo ---------- */
  var baDemoed = false;
  function maybeDemoBA() {
    if (baDemoed || reduce) return;
    var stage = document.getElementById('baStage');
    if (!stage) { baDemoed = true; return; }
    var r = stage.getBoundingClientRect();
    if (r.top < vh() * 0.7 && r.bottom > 0) {
      baDemoed = true;
      var after = document.getElementById('baAfter');
      var divider = document.getElementById('baDivider');
      var seq = [0.5, 0.74, 0.3, 0.52], k = 0;
      after.style.transition = 'clip-path .9s cubic-bezier(.22,1,.36,1)';
      divider.style.transition = 'left .9s cubic-bezier(.22,1,.36,1)';
      var iv = setInterval(function () {
        after.style.clipPath = 'inset(0 0 0 ' + (seq[k] * 100) + '%)';
        divider.style.left = (seq[k] * 100) + '%';
        k++;
        if (k >= seq.length) {
          clearInterval(iv);
          setTimeout(function () { after.style.transition = ''; divider.style.transition = ''; }, 950);
        }
      }, 950);
    }
  }

  /* ---------- unified scroll loop ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      navState(); refreshReveals(); refreshSteps(); maybeDemoBA();
      ticking = false;
    });
  }
  W.addEventListener('scroll', onScroll, { passive: true });
  W.addEventListener('resize', onScroll);

  /* ---------- Hero progress bar ---------- */
  setTimeout(function () {
    var heroBar = document.getElementById('heroBar');
    if (heroBar) { heroBar.style.transition = 'width 1.8s cubic-bezier(.22,1,.36,1)'; heroBar.style.width = '68%'; }
  }, 600);

  /* ---------- Rotating word ---------- */
  var rot = document.getElementById('rotWord');
  if (rot && !reduce) {
    var words = ['especialista', 'engenheiro', 'arquiteto', 'construtor'];
    var ri = 0;
    setInterval(function () {
      ri = (ri + 1) % words.length;
      rot.style.transition = 'opacity .3s, transform .3s';
      rot.style.opacity = '0'; rot.style.transform = 'translateY(-8px)';
      setTimeout(function () {
        rot.textContent = words[ri];
        rot.style.opacity = '1'; rot.style.transform = 'none';
      }, 300);
    }, 2600);
  }

  /* ---------- Before / After manual drag ---------- */
  var stage = document.getElementById('baStage');
  if (stage) {
    var after = document.getElementById('baAfter');
    var divider = document.getElementById('baDivider');
    var dragging = false;
    function setPos(clientX) {
      after.style.transition = ''; divider.style.transition = '';
      var rect = stage.getBoundingClientRect();
      var x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      var pct = (x / rect.width) * 100;
      after.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      divider.style.left = pct + '%';
    }
    function down(e) { baDemoed = true; dragging = true; setPos((e.touches ? e.touches[0] : e).clientX); }
    function move(e) { if (dragging) setPos((e.touches ? e.touches[0] : e).clientX); }
    function up() { dragging = false; }
    stage.addEventListener('mousedown', down);
    W.addEventListener('mousemove', move, { passive: true });
    W.addEventListener('mouseup', up);
    stage.addEventListener('touchstart', down, { passive: true });
    W.addEventListener('touchmove', move, { passive: true });
    W.addEventListener('touchend', up);
  }

  /* ---------- PORTFOLIO ---------- */
  var properties = [
    { name: 'Vivera Classic', folder: 'vivera', type: 'Térrea · Piscina', cat: 'terrea piscina', area: 273, q: 3, su: 1, b: 4, v: 2, pool: true, price: '1.078.350', desc: 'Charme clássico com toques contemporâneos, fachada elegante e área de lazer gourmet integrada.' },
    { name: 'Aurea House', folder: 'aurea', type: 'Sobrado', cat: 'sobrado', area: 270, q: 4, su: 2, b: 5, v: 2, pool: false, price: '1.107.000', desc: 'Telhado em duas águas e forma clássica reinterpretada — moderno sem perder a essência de um lar.' },
    { name: 'Casa Paulista', folder: 'paulista', type: 'Térrea', cat: 'terrea', area: 232, q: 2, su: 2, b: 3, v: 2, pool: false, price: '959.000', desc: 'Tributo à arquitetura modernista brasileira: linhas retas, concreto aparente e madeira natural.' },
    { name: 'Charcoal House', folder: 'charcoal', type: 'Sobrado', cat: 'sobrado', area: 220.3, q: 3, su: 2, b: 3, v: 1, pool: false, price: '879.000', desc: 'Sofisticada e atemporal, com paleta profunda inspirada no carvão mineral e linhas limpas.' },
    { name: 'Oslo House', folder: 'oslo', type: 'Sobrado', cat: 'sobrado', area: 197, q: 3, su: 1, b: 3, v: 2, pool: false, price: '807.700', desc: 'Setor social amplo e luminoso no térreo; pavimento superior íntimo com suíte ampla.' },
    { name: 'Áira House', folder: 'aira', type: 'Sobrado', cat: 'sobrado', area: 157, q: 3, su: 1, b: 3, v: 2, pool: false, price: '643.700', desc: 'Sobrado planejado para a harmonia entre estilo, funcionalidade e um espaço que se adapta a você.' },
    { name: 'Essence Home', folder: 'essence', type: 'Térrea', cat: 'terrea', area: 188, q: 3, su: 1, b: 4, v: 2, pool: false, price: '742.600', desc: 'Casa térrea com integração à área gourmet e fachada imponente com fitas de LED.' },
    { name: 'Ocre House', folder: 'ocre', type: 'Térrea', cat: 'terrea', area: 144.7, q: 3, su: 2, b: 3, v: 2, pool: false, price: '571.565', desc: 'Refúgio em tons terrosos, com ambientes integrados e luz natural valorizando texturas.' },
    { name: 'Villa House', folder: 'villa', type: 'Sobrado', cat: 'sobrado compacta', area: 103, q: 2, su: 2, b: 3, v: 2, pool: false, price: '422.300', desc: '103 m² em dois pavimentos com influência nórdica e volumetria de "casinha" contemporânea.' },
    { name: 'Casa Veras', folder: 'veras', type: 'Térrea', cat: 'terrea compacta', area: 90, q: 2, su: 1, b: 2, v: 1, pool: false, price: '355.500', desc: 'Design moderno e aconchegante, social integrado e jardim intimista nos fundos.' },
    { name: 'Seattle House', folder: 'seattle', type: 'Sobrado', cat: 'sobrado compacta', area: 75, q: 2, su: 0, b: 2, v: 1, pool: false, price: '307.500', desc: 'Sobrado de dois pavimentos, contraste de materiais e varanda ampla; quartos com varandas privativas.' }
  ];;
  var IC = {
    area: '<path d="M3 3h18v18H3zM3 9h18M9 21V9"/>',
    bed: '<path d="M2 17v-5h20v5M2 12V7a2 2 0 0 1 2-2h6v7M22 12V9a2 2 0 0 0-2-2h-6"/>',
    bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0"/>',
    car: '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13v5h-2v-2H7v2H5zM7.5 16h.01M16.5 16h.01"/>'
  };
  function specIcon(p) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + p + '</svg>'; }
  var grid = document.getElementById('portGrid');
  function render(list) {
    grid.innerHTML = list.map(function (p, i) {
      var d = (i % 3) + 1;
      return '' +
        '<article class="pcard" data-cat="' + p.cat + '" data-folder="' + p.folder + '" data-reveal data-d="' + d + '">' +
          '<div class="pcard__media">' +
            '<image-slot id="port-' + p.folder + '" shape="rect" placeholder="Foto: ' + p.name + '"></image-slot>' +
            '<span class="pcard__zoom" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg> Ver detalhes</span>' +
            (p.pool ? '<span class="pcard__pool">Piscina</span>' : '') +
            '<span class="pcard__price">R$ ' + p.price + '</span>' +
          '</div>' +
          '<div class="pcard__body">' +
            '<span class="pcard__type">' + p.type + '</span>' +
            '<h3>' + p.name + '</h3>' +
            '<p class="pcard__desc">' + p.desc + '</p>' +
            '<div class="pcard__specs">' +
              '<span class="spec">' + specIcon(IC.area) + (''+p.area).replace('.',',') + ' m²</span>' +
              '<span class="spec">' + specIcon(IC.bed) + p.q + ' quartos</span>' +
              '<span class="spec">' + specIcon(IC.bath) + p.b + ' banh.</span>' +
              '<span class="spec">' + specIcon(IC.car) + p.v + ' vagas</span>' +
            '</div>' +
            '<div class="pcard__foot">' +
              '<span class="spec" style="color:var(--mist)">' + p.su + ' suíte' + (p.su > 1 ? 's' : '') + '</span>' +
              '<a class="pcard__cta" href="#contato">Tenho interesse <span class="arrow">→</span></a>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('');
    refreshReveals();
  }
  render(properties);

  var filters = document.getElementById('portFilters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.fbtn');
      if (!btn) return;
      filters.querySelectorAll('.fbtn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      var list = f === 'all' ? properties : properties.filter(function (p) { return p.cat.indexOf(f) > -1; });
      render(list);
    });
  }

  /* ---------- ROI simulator ---------- */
  var inValor = document.getElementById('inValor');
  var inPrazo = document.getElementById('inPrazo');
  var segObj = document.getElementById('segObj');
  var obj = 'revenda';
  function fmtMil(n) { return 'R$ ' + Math.round(n).toLocaleString('pt-BR') + ' mil'; }
  function calc() {
    var valor = parseInt(inValor.value, 10);
    var prazo = parseInt(inPrazo.value, 10);
    document.getElementById('outValor').textContent = fmtMil(valor);
    document.getElementById('outPrazo').textContent = prazo + ' meses';
    document.getElementById('resAporte').textContent = fmtMil(valor);
    if (obj === 'revenda') {
      var total = valor * Math.pow(1.014, prazo);
      document.getElementById('resLabel').textContent = 'Patrimônio projetado';
      document.getElementById('resTotal').textContent = fmtMil(total);
    } else {
      var renda = valor * 1000 * 0.007;
      document.getElementById('resLabel').textContent = 'Renda mensal estimada';
      document.getElementById('resTotal').textContent = 'R$ ' + Math.round(renda).toLocaleString('pt-BR');
    }
  }
  if (inValor) {
    inValor.addEventListener('input', calc);
    inPrazo.addEventListener('input', calc);
    segObj.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      segObj.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); obj = b.getAttribute('data-obj');
      document.getElementById('outObj').textContent = obj === 'revenda' ? 'Revenda' : 'Locação';
      calc();
    });
    calc();
  }

  /* ---------- Lead form ---------- */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function () {
      var btn = document.getElementById('leadBtn');
      btn.innerHTML = 'Recebemos seu contato ✓';
      btn.style.background = 'var(--green)';
      setTimeout(function () {
        window.open('https://wa.me/5541988438401?text=Olá! Quero investir com a Incorp 360.', '_blank');
      }, 400);
    });
  }

  /* ---------- init ---------- */
  navState();
  refreshReveals(); refreshSteps();
  // safety passes for late layout/fonts
  setTimeout(function () { refreshReveals(); refreshSteps(); }, 200);
  setTimeout(function () { refreshReveals(); }, 800);
  W.addEventListener('load', function () { refreshReveals(); refreshSteps(); });
})();

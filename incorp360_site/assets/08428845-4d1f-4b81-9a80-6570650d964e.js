/* ============================================================
   INCORP 360 — Premium interactions
   Persona engine (Investir / Morar) · parallax · magnetic CTAs ·
   nav reading progress · advantage tabs
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noMotion = function () { return document.body.classList.contains('no-motion'); };

  /* ===========================================================
     PERSONA ENGINE
     =========================================================== */
  var CONTENT = {
    investir: {
      badge: 'Incorporação imobiliária turnkey · Curitiba — PR',
      h1: '<span class="ln">Construa,</span><span class="ln">venda,</span><span class="ln grad">lucre.</span>',
      sub: 'Casas projetadas no padrão do mercado imobiliário, pensadas para quem quer investir. A Incorp 360 dá a você acesso à estrutura das grandes incorporadoras — da planta à entrega.',
      cta1: 'Explore oportunidades<span class="arrow">→</span>',
      trust: '<div class="ti"><b class="mono" data-count="13" data-prefix="+">+13</b><span>Projetos no portfólio</span></div>' +
             '<div class="ti"><b class="mono">360°</b><span>Suporte completo</span></div>' +
             '<div class="ti"><b>Curitiba</b><span>Centro Cívico — PR</span></div>',
      chipLbl: 'Investimento', chipVal: 'R$ 643 mil',
      stmtTail: 'se tornar um <span class="hl">incorporador</span>',
      contactTitle: 'Pronto para a sua primeira incorporação?',
      contactLead: 'Conte o que você busca. Nosso time apresenta as oportunidades que mais fazem sentido para o seu perfil de investimento.',
      leadMsg: 'Quanto pretende investir e qual seu objetivo?',
      leadBtn: 'Quero investir com a Incorp 360<span class="arrow">→</span>'
    },
    morar: {
      badge: 'Sua casa no padrão homebuilder · Curitiba — PR',
      h1: '<span class="ln">Escolha,</span><span class="ln">personalize,</span><span class="ln grad">more.</span>',
      sub: 'O jeito homebuilder de construir: você escolhe o projeto, personaliza os acabamentos e recebe a chave em até 11 meses — com preço fechado e obra acompanhada em tempo real.',
      cta1: 'Conheça os projetos<span class="arrow">→</span>',
      trust: '<div class="ti"><b class="mono">11 meses</b><span>Da assinatura à chave</span></div>' +
             '<div class="ti"><b class="mono">100%</b><span>Personalizável no método</span></div>' +
             '<div class="ti"><b>Preço fechado</b><span>Definido em contrato</span></div>',
      chipLbl: 'Preço fechado', chipVal: 'R$ 643 mil',
      stmtTail: 'construir <span class="hl">a casa dos seus sonhos</span>',
      contactTitle: 'Pronto para construir a sua casa?',
      contactLead: 'Conte o que você procura. Nosso time apresenta os projetos — e as personalizações — que cabem no seu momento de vida.',
      leadMsg: 'Como é a casa que você procura?',
      leadBtn: 'Quero minha casa Incorp 360<span class="arrow">→</span>'
    }
  };

  var KEY = 'incorp.persona';
  var current = 'investir';
  try { var saved = localStorage.getItem(KEY); if (saved === 'morar') current = 'morar'; } catch (e) {}

  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function setAttr(id, attr, v) { var el = document.getElementById(id); if (el) el.setAttribute(attr, v); }

  var SWAP_IDS = ['heroBadgeTxt', 'heroTitle', 'heroSub', 'heroCta1', 'heroTrust'];

  function applyPersona(p, animate) {
    var c = CONTENT[p];
    var apply = function () {
      setHTML('heroBadgeTxt', c.badge);
      setHTML('heroTitle', c.h1);
      setHTML('heroSub', c.sub);
      setHTML('heroCta1', c.cta1);
      setHTML('heroTrust', c.trust);
      setHTML('chipLbl', c.chipLbl);
      setHTML('chipVal', c.chipVal);
      setHTML('stmtTail', c.stmtTail);
      setHTML('contactTitle', c.contactTitle);
      setHTML('contactLead', c.contactLead);
      setAttr('leadMsg', 'placeholder', c.leadMsg);
      setHTML('leadBtn', c.leadBtn);
    };
    var els = SWAP_IDS.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (animate && !reduce && !noMotion()) {
      els.forEach(function (el) { el.classList.add('pswap-out'); });
      setTimeout(function () {
        apply();
        els.forEach(function (el) { el.classList.remove('pswap-out'); });
      }, 260);
    } else {
      apply();
    }
    // sync advantage tabs
    setAdvTab(p === 'morar' ? 'morar' : 'investir', animate);
  }

  function movePill(toggle) {
    var pill = toggle.querySelector('.ptoggle__pill');
    var on = toggle.querySelector('button.on');
    if (!pill || !on) return;
    pill.style.left = on.offsetLeft + 'px';
    pill.style.width = on.offsetWidth + 'px';
  }

  function wireToggle(toggle, onChange) {
    if (!toggle) return;
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn || btn.classList.contains('on')) return;
      toggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      movePill(toggle);
      onChange(btn.getAttribute('data-p'));
    });
    // position pill initially (after fonts/layout settle)
    requestAnimationFrame(function () { movePill(toggle); });
    setTimeout(function () { movePill(toggle); }, 450);
    window.addEventListener('resize', function () { movePill(toggle); });
  }

  function syncToggleUI(toggle, p) {
    if (!toggle) return;
    toggle.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-p') === p);
    });
    movePill(toggle);
  }

  var heroToggle = document.getElementById('personaToggle');
  wireToggle(heroToggle, function (p) {
    current = p;
    try { localStorage.setItem(KEY, p); } catch (e) {}
    applyPersona(p, true);
  });

  /* ===========================================================
     ADVANTAGE TABS (Para o investidor / Para morar)
     =========================================================== */
  var advToggle = document.getElementById('advToggle');
  var gridInvest = document.getElementById('advInvest');
  var gridMorar = document.getElementById('advMorar');

  function setAdvTab(p, animate) {
    if (!gridInvest || !gridMorar) return;
    var show = p === 'morar' ? gridMorar : gridInvest;
    var hide = p === 'morar' ? gridInvest : gridMorar;
    if (!show.classList.contains('hidden') && hide.classList.contains('hidden')) {
      syncToggleUI(advToggle, p);
      return;
    }
    hide.classList.add('hidden');
    show.classList.remove('hidden');
    show.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
    if (animate && !reduce && !noMotion()) {
      show.classList.remove('pop');
      void show.offsetWidth; // restart animation
      show.classList.add('pop');
    }
    syncToggleUI(advToggle, p);
  }

  wireToggle(advToggle, function (p) { setAdvTab(p, true); });

  // initial state (no animation)
  applyPersona(current, false);
  syncToggleUI(heroToggle, current);

  /* ===========================================================
     NAV READING PROGRESS
     =========================================================== */
  var progress = document.getElementById('navProgress');

  /* ===========================================================
     HERO PARALLAX
     =========================================================== */
  var heroVisual = document.querySelector('.hero__visual');
  var heroRing = document.querySelector('.hero__ring');
  var hero = document.querySelector('.hero');

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      if (!reduce && !noMotion() && hero && y < hero.offsetHeight) {
        if (heroVisual) heroVisual.style.transform = 'translate3d(0,' + (y * -0.055) + 'px,0)';
        if (heroRing) heroRing.style.transform = 'translateY(-50%) rotate(' + (y * 0.03) + 'deg)';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===========================================================
     MAGNETIC CTAs (hero actions)
     =========================================================== */
  if (!reduce) {
    document.querySelectorAll('.hero__actions .btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        if (noMotion()) return;
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.setProperty('--mx', (dx * 5).toFixed(1) + 'px');
        btn.style.setProperty('--my', (dy * 4).toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }
})();

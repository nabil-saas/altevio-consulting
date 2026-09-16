/* ==========================================================================
   ALTEVIO CONSULTING — Interactions
   ========================================================================== */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ----------------------------------------------------------------------
     1. Titre héros — révélation mot à mot
     ---------------------------------------------------------------------- */

  $$('.split').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.textContent = '';

    words.forEach(function (word, i) {
      var outer = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');

      var inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--d', 90 + i * 55 + 'ms');

      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ----------------------------------------------------------------------
     2. Révélation au scroll
     ---------------------------------------------------------------------- */

  var revealables = $$('.reveal, .split');

  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });

    // Filet de sécurité : le contenu au-dessus de la ligne de flottaison doit
    // finir par apparaître même si l'observateur se déclenche mal (appareil
    // lent, onglet ouvert en arrière-plan, redimensionnement de la barre
    // d'adresse sur mobile). Sans cela le héros peut rester vide.
    setTimeout(function () {
      $$('.hero .reveal, .hero .split').forEach(function (el) {
        el.classList.add('is-in');
      });
    }, 1400);
  }

  /* ----------------------------------------------------------------------
     3. Compteurs animés
     ---------------------------------------------------------------------- */

  function format(value, decimals) {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;

    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      el.textContent = prefix + format(target * eased, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');

  if ('IntersectionObserver' in window && !reduced) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ----------------------------------------------------------------------
     4. Bandeaux défilants — duplication pour boucle continue
     ---------------------------------------------------------------------- */

  ['marquee', 'quotes'].forEach(function (id) {
    var track = document.getElementById(id);
    if (!track) return;
    Array.prototype.slice.call(track.children).forEach(function (child) {
      var clone = child.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });

  /* ----------------------------------------------------------------------
     5. Halo suivant le curseur sur les cartes
     ---------------------------------------------------------------------- */

  if (window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ----------------------------------------------------------------------
     6. En-tête, barre de progression, scroll-spy
     ---------------------------------------------------------------------- */

  var header = $('#header');
  var progress = $('#progress');
  var navLinks = $$('#nav a');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;

    header.classList.toggle('is-stuck', y > 12);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  // Lien de navigation actif
  if ('IntersectionObserver' in window) {
    var sections = navLinks
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ----------------------------------------------------------------------
     7. Menu mobile
     ---------------------------------------------------------------------- */

  var burger = $('#burger');
  var drawer = $('#drawer');

  function isDrawerOpen() {
    return document.body.classList.contains('nav-open');
  }

  function setDrawer(open) {
    document.body.classList.toggle('nav-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  burger.addEventListener('click', function () {
    setDrawer(!isDrawerOpen());
  });

  $$('a', drawer).forEach(function (link) {
    link.addEventListener('click', function () { setDrawer(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isDrawerOpen()) setDrawer(false);
  });

  window.addEventListener('resize', function () {
    // Doit rester aligné sur le point de rupture .nav du CSS.
    if (window.innerWidth > 1140 && isDrawerOpen()) setDrawer(false);
  });

  /* ----------------------------------------------------------------------
     8. FAQ — accordéon
     ---------------------------------------------------------------------- */

  $$('#faqList .faq__item').forEach(function (item) {
    var button = $('.faq__q', item);

    button.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      // Une seule réponse ouverte à la fois
      $$('#faqList .faq__item.is-open').forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ----------------------------------------------------------------------
     9. Formulaires (besoin client & candidature consultant)
     ---------------------------------------------------------------------- */

  var COCHE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/><path d="m8 12.5 2.5 2.5L16 9.5"/>' +
    '</svg>';

  $$('form[data-done]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var champ = form.querySelector('[data-firstname]');
      var prenom = champ ? (champ.value || '').trim().split(/\s+/)[0] : '';

      var bloc = document.createElement('div');
      bloc.className = 'form__done';
      bloc.innerHTML = COCHE;

      // textContent et non innerHTML : le prénom vient d'une saisie utilisateur.
      var titre = document.createElement('h3');
      titre.className = 't-h3';
      titre.textContent = form.dataset.doneTitle + (prenom ? ', ' + prenom : '') + '.';

      var message = document.createElement('p');
      message.textContent = form.dataset.done;

      bloc.appendChild(titre);
      bloc.appendChild(message);

      form.innerHTML = '';
      form.appendChild(bloc);
    });
  });

  /* ----------------------------------------------------------------------
     10. Rotateur de modules du héros
     ---------------------------------------------------------------------- */

  var rotator = $('#heroRotator');

  // Sans JS, ou en mouvement réduit, seul le premier module reste affiché :
  // il porte déjà .is-current dans le HTML.
  if (rotator && !reduced) {
    var modules = $$('.hero__rotator-item', rotator);
    var INTERVALLE = 2000;
    var TRANSITION = 620; // doit rester aligné sur la transition CSS
    var courant = 0;

    if (modules.length > 1) {
      setInterval(function () {
        var sortant = modules[courant];
        courant = (courant + 1) % modules.length;

        sortant.classList.remove('is-current');
        sortant.classList.add('is-out');
        modules[courant].classList.add('is-current');

        // Une fois invisible, on rend le sortant à sa position basse.
        // Sans cela il resterait en haut et réapparaîtrait par le mauvais
        // côté à son prochain passage.
        setTimeout(function () {
          sortant.classList.remove('is-out');
        }, TRANSITION);
      }, INTERVALLE);
    }
  }

  /* ----------------------------------------------------------------------
     11. Bouton flottant « Exprimer un besoin »
     ---------------------------------------------------------------------- */

  var fab = $('#fab');

  if (fab && !('IntersectionObserver' in window)) {
    // Sans observateur, on renonce à l'apparition progressive plutôt qu'au
    // bouton : le CSS le masque tant que .is-visible est absente.
    fab.classList.add('is-visible');
  } else if (fab) {
    var hero = $('.hero');

    if (!hero) {
      fab.classList.add('is-visible');
    } else {
      // Le héros porte déjà le même appel à l'action : le raccourci apparaît
      // une fois cette première section dépassée, puis reste affiché jusqu'en
      // bas de page.
      var syncFab = function () {
        var rect = hero.getBoundingClientRect();
        fab.classList.toggle(
          'is-visible',
          rect.bottom <= 0 || rect.top >= window.innerHeight
        );
      };

      // L'observateur ne sert que de déclencheur — on n'est notifié qu'au
      // franchissement, pas à chaque pixel. L'état est recalculé depuis la
      // géométrie plutôt que lu dans les entrées reçues : un même lot peut en
      // contenir plusieurs, dont seule la dernière décrit la position réelle.
      new IntersectionObserver(syncFab, { threshold: 0 }).observe(hero);

      syncFab();
    }
  }
})();

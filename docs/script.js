// Church of the Apostles: the opening cross reveal and the gentle fade-in of each section.
//
// The sanctuary photo fills the stage. Eight paper panels cover it except for a cross-shaped
// opening, and scrolling slides the panels apart while the photo pulls back from the crucifix.
// Everything moves with transforms and opacity only, so the GPU composites each frame and
// nothing repaints. That is what keeps the effect smooth on iPhone.
(function () {
  // Browsers too old for this (no IntersectionObserver) never get the "js" class from the page head.
  // They show the full sanctuary photo with no cross, and every section is visible from the start.
  if (!/\bjs\b/.test(document.documentElement.className)) return;

  var reveal = document.querySelector('.reveal');
  var stage = reveal.querySelector('.stage');
  var img = stage.querySelector('.window img');
  var panels = stage.querySelectorAll('.paper i');
  var rule = stage.querySelector('.rule-x');
  var words = stage.querySelectorAll('.tp');
  var cap = stage.querySelector('.plate-cap');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Measured on load and resize, never per frame
  var W, H, cy, start, end, S, fx, dw, dh, ruleOn = true;

  function measure() {
    // The stage is 100svh, so its height stays put while Safari's address bar comes and goes
    W = stage.clientWidth;
    H = stage.clientHeight;

    // Fit the cross into the space actually left between the title and the "Scroll down" hint,
    // so it can never overlap either one, whatever the screen size
    var box = stage.getBoundingClientRect();
    var above = words[0].getBoundingClientRect().bottom - box.top;
    var below = words[1].getBoundingClientRect().top - box.top;
    var gap = Math.max(60, below - above);
    var room = gap * .78;                              // keep some paper around the cross
    cy = above + gap / 2;                              // vertical centre of the cross
    start = Math.min(Math.min(W, H) * (W <= 720 ? .30 : .20), room / 1.4, W * .5);
    end = Math.max(W, H) * 9;                         // arms far wider than the screen
    S = Math.max(W, H) * 3;                           // panel size: always reaches past the screen edges
    for (var i = 0; i < panels.length; i++) { panels[i].style.width = panels[i].style.height = S + 'px'; }

    var iw = img.naturalWidth || 2400, ih = img.naturalHeight || 1111;
    var k = Math.max(W / iw, H / ih);
    dw = iw * k; dh = ih * k;
    // On tall screens, slide the photo so the crucifix is in frame
    fx = W < H && dw > W ? Math.min(1, Math.max(0, (W / 2 - dw * .237) / (W - dw))) : .30;
    img.style.objectPosition = (fx * 100) + '% 40%';
  }

  function t(el, x, y) { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }

  function draw(p) {
    var e = p * p * p;                                // slow at first, then opens
    var m = start + (end - start) * e;                // cross width in px
    var u = m / 100;                                  // the cross is drawn on a 100 x 140 grid
    var L = W / 2 - 50 * u, T = cy - 70 * u;

    // Paper panels: four corners between the arms, then four bands beyond the arm ends
    t(panels[0], L + 43 * u - S, T + 38 * u - S);
    t(panels[1], L + 57 * u,     T + 38 * u - S);
    t(panels[2], L + 43 * u - S, T + 52 * u);
    t(panels[3], L + 57 * u,     T + 52 * u);
    t(panels[4], W / 2 - S / 2,  T - S);
    t(panels[5], W / 2 - S / 2,  T + 140 * u);
    t(panels[6], L - S,          cy - S / 2);
    t(panels[7], L + 100 * u,    cy - S / 2);

    // The thin red rule around the cross leaves as soon as the cross starts to open
    var ro = 1 - Math.min(1, e * 30);
    if (ro > 0) {
      rule.style.width = m + 'px';
      rule.style.height = 1.4 * m + 'px';
      t(rule, L, T);
    }
    if ((ro > 0) !== ruleOn) { ruleOn = ro > 0; rule.style.visibility = ruleOn ? 'visible' : 'hidden'; }
    rule.style.opacity = ro;

    // Begin zoomed on the crucifix inside the cross, then pull back to the whole room.
    // The crucifix sits 23.7% across and 21.5% down in the sanctuary photo.
    var px = (W - dw) * fx + dw * .237, py = (H - dh) * .40 + dh * .215;
    var tx = W / 2, ty = cy - 25 * u;                 // where the arms of the cross meet
    var s = 2.4 + (1 - 2.4) * e, q = 1 - e;
    var ox = Math.min(0, Math.max(W * (1 - s), (tx - s * px) * q));
    var oy = Math.min(0, Math.max(H * (1 - s), (ty - s * py) * q));
    img.style.transform = 'translate3d(' + ox + 'px,' + oy + 'px,0) scale(' + s + ')';

    var fade = 1 - Math.min(1, p * 2.6);
    for (var i = 0; i < words.length; i++) { words[i].style.opacity = fade; }
    cap.style.opacity = Math.max(0, (p - .85) / .15);
  }

  function target() {
    var r = reveal.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / (r.height - H)));
  }

  // Ease toward the scroll position a little each frame, which smooths out uneven
  // touch and momentum scrolling without making the effect feel laggy
  var cur = 0, running = false;
  function tick() {
    var goal = target();
    cur += (goal - cur) * .28;
    if (Math.abs(goal - cur) < .0004) cur = goal;
    draw(cur);
    running = cur !== goal;
    if (running) requestAnimationFrame(tick);
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function relayout() { measure(); cur = still ? 0 : target(); draw(cur); }

  // Safari before iOS 15.4 has no svh unit, and its 100vh runs under the bottom toolbar,
  // hiding the "Scroll down" hint. There, size the stage to the visible height instead
  // (on load and rotation only, so it doesn't jump as the toolbar slides away).
  var svh = window.CSS && CSS.supports && CSS.supports('height', '100svh');
  function fitStage() { if (!svh) stage.style.height = innerHeight + 'px'; }
  fitStage();
  addEventListener('orientationchange', function () { setTimeout(function () { fitStage(); relayout(); }, 300); });

  relayout();
  addEventListener('resize', relayout);
  img.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);   // title height changes once the web font arrives
  if (!still) addEventListener('scroll', kick, { passive: true });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .2 });
  document.querySelectorAll('.fade').forEach(function (el) { io.observe(el); });
})();

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

  // Measured on load and real resizes, never per frame
  var W = 0, H = 0, cy, start, end, fx, dw, dh, top0, span, ruleOn = true;

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
    // Every panel is just the size of the screen; draw() keeps each one's inner corner on screen.
    // Small layers matter: oversized ones are expensive on high-density iPhone screens.
    for (var i = 0; i < panels.length; i++) { panels[i].style.width = W + 2 + 'px'; panels[i].style.height = H + 2 + 'px'; }

    // The red rule only shows while the cross is at rest, so size it once here
    var u0 = start / 100;
    rule.style.width = start + 'px';
    rule.style.height = 1.4 * start + 'px';
    t(rule, W / 2 - 50 * u0, cy - 70 * u0);

    top0 = reveal.offsetTop;
    span = Math.max(1, reveal.offsetHeight - H);

    var iw = img.naturalWidth || 2400, ih = img.naturalHeight || 1111;
    var k = Math.max(W / iw, H / ih);
    dw = iw * k; dh = ih * k;
    // On tall screens, slide the photo so the crucifix is in frame
    fx = W < H && dw > W ? Math.min(1, Math.max(0, (W / 2 - dw * .237) / (W - dw))) : .30;
    img.style.objectPosition = (fx * 100) + '% 40%';
  }

  function t(el, x, y) { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; }
  function clampX(x) { return Math.min(W, Math.max(0, x)); }   // clamp a point onto the screen
  function clampY(y) { return Math.min(H, Math.max(0, y)); }

  function draw(p) {
    var e = Math.pow(p, 1.7);                         // opens from the first bit of scroll, then speeds up
    var m = start + (end - start) * e;                // cross width in px
    var u = m / 100;                                  // the cross is drawn on a 100 x 140 grid
    var L = W / 2 - 50 * u, T = cy - 70 * u;

    // Paper panels, each covering everything on one side of a corner or edge of the cross:
    // four corners between the arms, then the paper above, below, left and right of the cross.
    // Each anchor is clamped onto the screen, so a screen-sized panel always covers its share.
    var a = clampX(L + 43 * u), b = clampX(L + 57 * u), c = clampY(T + 38 * u), d = clampY(T + 52 * u);
    t(panels[0], a - W - 1, c - H - 1);
    t(panels[1], b - 1,     c - H - 1);
    t(panels[2], a - W - 1, d - 1);
    t(panels[3], b - 1,     d - 1);
    t(panels[4], -1, clampY(T) - H - 1);
    t(panels[5], -1, clampY(T + 140 * u) - 1);
    t(panels[6], clampX(L) - W - 1, -1);
    t(panels[7], clampX(L + 100 * u) - 1, -1);

    // The thin red rule around the cross shows only at rest: it vanishes the moment scrolling
    // starts (a lingering fade would sit on top of the opening cross) and fades back in at the top
    var on = p < .002;
    if (on !== ruleOn) {
      ruleOn = on;
      rule.style.transition = on ? 'opacity .4s ease' : 'none';
      rule.style.opacity = on ? 1 : 0;
    }

    // Begin zoomed on the crucifix inside the cross, then pull back to the whole room.
    // The crucifix sits 23.7% across and 21.5% down in the sanctuary photo.
    var px = (W - dw) * fx + dw * .237, py = (H - dh) * .40 + dh * .215;
    var tx = W / 2, ty = cy - 25 * u;                 // where the arms of the cross meet
    var s = 2.4 + (1 - 2.4) * e, q = 1 - e;
    var ox = Math.min(0, Math.max(W * (1 - s), (tx - s * px) * q));
    var oy = Math.min(0, Math.max(H * (1 - s), (ty - s * py) * q));
    img.style.transform = 'translate3d(' + ox + 'px,' + oy + 'px,0) scale(' + s + ')';

    var fade = 1 - Math.min(1, p * 3);
    for (var i = 0; i < words.length; i++) { words[i].style.opacity = fade; }
    cap.style.opacity = Math.max(0, (p - .8) / .2);
  }

  // Reading scroll position (rather than measuring elements) avoids a layout pass every frame
  function target() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    return Math.min(1, Math.max(0, (y - top0) / span));
  }

  // Glide toward the scroll position with a fixed time constant. iPhone scrolling reports
  // positions unevenly, and smoothing by elapsed time (not per frame) keeps the motion even
  // on both 60Hz and 120Hz screens while staying close behind the finger.
  var TAU = 85;                                       // ms
  var cur = 0, running = false, last = 0;
  function tick(now) {
    var dt = last ? Math.min(64, now - last) : 16;
    last = now;
    var goal = target();
    cur += (goal - cur) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(goal - cur) < .0003) cur = goal;
    draw(cur);
    running = cur !== goal;
    if (running) requestAnimationFrame(tick); else last = 0;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function relayout() { measure(); cur = still ? 0 : target(); draw(cur); }

  // Safari fires resize while its address bar slides in and out during scrolling. The stage
  // (100svh) doesn't change size then, so only lay out again when it really does.
  function onResize() { if (stage.clientWidth !== W || stage.clientHeight !== H) relayout(); }

  // Safari before iOS 15.4 has no svh unit, and its 100vh runs under the bottom toolbar,
  // hiding the "Scroll down" hint. There, size the stage to the visible height instead
  // (on load and rotation only, so it doesn't jump as the toolbar slides away).
  var svh = window.CSS && CSS.supports && CSS.supports('height', '100svh');
  function fitStage() { if (!svh) stage.style.height = innerHeight + 'px'; }
  fitStage();
  addEventListener('orientationchange', function () { setTimeout(function () { fitStage(); relayout(); }, 300); });

  relayout();
  addEventListener('resize', onResize);
  img.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);   // title height changes once the web font arrives
  if (!still) addEventListener('scroll', kick, { passive: true });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .2 });
  document.querySelectorAll('.fade').forEach(function (el) { io.observe(el); });
})();

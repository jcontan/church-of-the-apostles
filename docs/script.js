// Church of the Apostles: the opening cross reveal and the gentle fade-in of each section.
(function () {
  var reveal = document.querySelector('.reveal');
  var stage = reveal.querySelector('.stage');
  var win = stage.querySelector('.window');
  var rule = stage.querySelector('.rule-x');
  var img = win.querySelector('img');
  var words = stage.querySelectorAll('.tp');
  var cap = stage.querySelector('.plate-cap');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!still) {
    var ticking = false;
    function update() {
      ticking = false;
      var W = innerWidth, H = innerHeight, narrow = W <= 720, short = !narrow && H < 760;
      var r = reveal.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / (r.height - H)));
      var e = p * p * p;                                     // slow at first, then opens
      // On short laptop screens, a smaller cross sits higher so it clears the scroll hint
      var cy = narrow ? .50 : short ? .45 : .54;
      [win, rule].forEach(function (el) { el.style.webkitMaskPosition = el.style.maskPosition = 'center ' + (cy * 100) + '%'; });
      var start = Math.min(W, H) * (narrow ? .30 : short ? .17 : .20);
      var end = Math.max(W, H) * 9;                          // cross arms wider than the screen
      var m = start + (end - start) * e;
      win.style.setProperty('--m', m + 'px');
      rule.style.setProperty('--m', m + 'px');
      rule.style.opacity = 1 - Math.min(1, e * 30);         // the red rule leaves as soon as the cross opens

      // Begin on the crucifix inside the cross, then pull back to the whole room
      var iw = img.naturalWidth || 2400, ih = img.naturalHeight || 1111;
      var k = Math.max(W / iw, H / ih), dw = iw * k, dh = ih * k;
      var fx = W < H && dw > W ? Math.min(1, Math.max(0, (W / 2 - dw * .237) / (W - dw))) : .30;
      img.style.objectPosition = (fx * 100) + '% 40%';
      var px = (W - dw) * fx + dw * .237, py = (H - dh) * .40 + dh * .215;   // crucifix in the photo
      var tx = W / 2, ty = H * cy - m * .241;                              // where the cross arms meet
      var s = 2.4 + (1 - 2.4) * e, q = 1 - e;
      var ox = Math.min(0, Math.max(W * (1 - s), (tx - s * px) * q));
      var oy = Math.min(0, Math.max(H * (1 - s), (ty - s * py) * q));
      img.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';

      var fade = 1 - Math.min(1, p * 2.6);
      words.forEach(function (w) { w.style.opacity = fade; });
      cap.style.opacity = Math.max(0, (p - .85) / .15);
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    img.addEventListener('load', update);
    update();
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .2 });
  document.querySelectorAll('.fade').forEach(function (el) { io.observe(el); });
})();

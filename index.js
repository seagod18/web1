/* Praneel S P — site interactions
   GSAP + ScrollTrigger for scroll animation, Lenis for smooth scrolling. */
(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- light / dark theme ---------- */
  (function theme() {
    const btn = $('#theme-btn');
    const meta = $('meta[name="theme-color"]');
    const sysLight = matchMedia('(prefers-color-scheme: light)');
    const saved = () => { try { return localStorage.getItem('theme'); } catch (e) { return null; } };

    function apply(t) {
      root.dataset.theme = t;
      meta.content = t === 'light' ? '#fbfbfd' : '#08080a';
      btn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    apply(root.dataset.theme || 'dark');

    // follow the OS live, until the visitor picks one themselves
    sysLight.addEventListener('change', e => { if (!saved()) apply(e.matches ? 'light' : 'dark'); });

    btn.addEventListener('click', e => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme', next); } catch (err) {}

      if (!document.startViewTransition || reduceMotion) {
        root.classList.add('theme-fade');
        apply(next);
        setTimeout(() => root.classList.remove('theme-fade'), 600);
        return;
      }
      // new theme spreads out in a circle from the button
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(() => apply(next)).ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
    });
  })();

  /* ---------- text splitting ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'char';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    }
  }
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  }
  $$('.split-chars, .split-chars-scroll').forEach(splitChars);
  $$('.split-words').forEach(splitWords);

  // No GSAP (blocked CDN) or reduced motion: show everything, static page.
  if (!window.gsap || reduceMotion) {
    root.classList.remove('anim');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // in-page anchor links glide instead of jumping
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: 'smooth' });
    });
  });

  /* ---------- scroll progress + nav hide/show ---------- */
  const progress = $('.progress');
  const nav = $('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      progress.style.transform = `scaleX(${self.progress})`;
      const y = self.scroll();
      if (Math.abs(y - lastY) < 6) return;   // ignore jitter / repeat updates
      nav.classList.toggle('is-hidden', y > 200 && y > lastY);
      lastY = y;
    }
  });

  /* ---------- hero intro ---------- */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
  intro
    .to('.hero-title .char', { y: 0, duration: 1.6, stagger: 0.045 })
    .to('.hero-fade', { opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power2.out' }, '-=1.1')
    .from('.blob', { scale: 0.4, opacity: 0, duration: 2.4, stagger: 0.15, ease: 'power3.out' }, 0);

  // hero recedes as you scroll away (Apple-style scale + fade)
  gsap.to('.hero-inner', {
    scale: 0.88, yPercent: -12, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-bg', {
    yPercent: 30, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.scroll-cue', {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true }
  });

  // blobs lean toward the mouse
  if (finePointer) {
    const blobs = $$('.blob').map((el, i) => ({
      x: gsap.quickTo(el, 'x', { duration: 2 + i * 0.4, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 2 + i * 0.4, ease: 'power3.out' }),
      k: [60, -80, 120][i]
    }));
    window.addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      blobs.forEach(b => { b.x(nx * b.k); b.y(ny * b.k); });
    });
  }

  /* ---------- statement: words light up as you scroll ---------- */
  gsap.to('.statement-text .word', {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'bottom 55%', scrub: true }
  });

  /* ---------- generic fade-up reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' })
  });

  /* ---------- portrait: window opens up while scrolling ---------- */
  gsap.fromTo('.portrait-frame',
    { clipPath: 'inset(18% 14% 18% 14% round 28px)' },
    { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'center 55%', scrub: true } });
  gsap.fromTo('.portrait', { scale: 1.35 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  /* ---------- "now" card scales up into place (if present) ---------- */
  if ($('.now-card')) gsap.fromTo('.now-card', { scale: 0.9, borderRadius: 64 }, {
    scale: 1, borderRadius: 40, ease: 'none',
    scrollTrigger: { trigger: '.now', start: 'top bottom', end: 'top 25%', scrub: true }
  });

  /* ---------- voice waveform canvas ---------- */
  (function waveform() {
    const canvas = $('.wave');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, bars, running = false, energy = 0.25, target = 0.25, t = 0;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bars = Math.max(32, Math.floor(w / 14));
    }
    size();
    window.addEventListener('resize', size);

    // talking-ish rhythm: syllable bursts with pauses
    const speech = time => {
      const syl = Math.max(0, Math.sin(time * 5.3)) * Math.max(0, Math.sin(time * 1.7 + 1));
      return 0.25 + syl * 0.9;
    };

    function draw() {
      if (!running) return;
      t += 0.016;
      const vel = lenis ? Math.min(Math.abs(lenis.velocity) / 40, 1) : 0;
      target = speech(t) + vel * 0.6;
      energy += (target - energy) * 0.08;

      ctx.clearRect(0, 0, w, h);
      const gap = w / bars, bw = Math.max(3, gap * 0.45), mid = h * 0.5;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#8a5cff'); g.addColorStop(0.55, '#3dc8ff'); g.addColorStop(1, '#ff5ca8');
      ctx.fillStyle = g;
      for (let i = 0; i < bars; i++) {
        const x = i * gap + (gap - bw) / 2;
        const p = i / bars;
        const env = Math.sin(p * Math.PI);                 // taller in the middle
        const n = Math.sin(i * 0.55 + t * 3.1) * 0.5 + Math.sin(i * 0.23 - t * 2.2) * 0.35 + Math.sin(i * 1.7 + t * 6) * 0.15;
        const bh = Math.max(3, (0.15 + Math.abs(n)) * env * energy * h * 0.75);
        ctx.globalAlpha = 0.35 + env * 0.65;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, mid - bh / 2, bw, bh, bw / 2);
        else ctx.rect(x, mid - bh / 2, bw, bh);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    new IntersectionObserver(([entry]) => {
      const was = running;
      running = entry.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(canvas);
  })();

  /* ---------- work: pinned horizontal scroll on desktop ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = $('.work-track');
    if (!track) return;   // projects section is parked for now
    const distance = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.work', start: 'top top', end: () => '+=' + distance(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
  });

  // cards tilt toward the pointer
  if (finePointer) {
    $$('.project').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- skills marquee: speeds up and flips with scroll ---------- */
  (function marquees() {
    const rows = $$('.marquee').map(m => {
      const inner = $('.marquee-inner', m);
      // clone until the row is at least 2x the screen wide, for a seamless loop
      const original = inner.innerHTML;
      while (inner.scrollWidth < innerWidth * 2) inner.insertAdjacentHTML('beforeend', original);
      inner.insertAdjacentHTML('beforeend', inner.innerHTML);
      return { inner, dir: Number(m.dataset.dir) || 1, x: 0 };
    });
    let scrollDir = 1;
    gsap.ticker.add((_, dt) => {
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > 0.5) scrollDir = Math.sign(v);
      const boost = 1 + Math.min(Math.abs(v) * 0.15, 6);
      rows.forEach(r => {
        const half = r.inner.scrollWidth / 2;
        r.x -= 0.05 * dt * boost * r.dir * scrollDir;
        if (r.x <= -half) r.x += half;
        if (r.x > 0) r.x -= half;
        r.inner.style.transform = `translate3d(${r.x}px,0,0)`;
      });
    });
  })();

  /* ---------- tree: trunk draws, cards slide out, dots light up ---------- */
  gsap.to('.tl-fill', {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.tree', start: 'top 65%', end: 'bottom 65%', scrub: true }
  });
  const twoColumn = matchMedia('(min-width: 761px)').matches;
  $$('.tl-item').forEach(item => {
    // desktop: cards slide out from the trunk; phone: they rise up
    const fromX = twoColumn ? (item.classList.contains('exp') ? 50 : -50) : 0;
    gsap.from(item.querySelector('.tl-card'), {
      opacity: 0, x: fromX, y: twoColumn ? 0 : 40, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: item, start: 'top 85%', once: true }
    });
    ScrollTrigger.create({
      trigger: item, start: 'top 65%',
      onEnter: () => item.classList.add('is-active'),
      onLeaveBack: () => item.classList.remove('is-active')
    });
  });

  /* ---------- contact headline rises in ---------- */
  gsap.from('.contact-title .char', {
    yPercent: 110, duration: 1.4, stagger: 0.03, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact-title', start: 'top 80%', once: true }
  });
  gsap.fromTo('.contact-glow', { scale: 0.5, opacity: 0 }, {
    scale: 1, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true }
  });

  /* ---------- magnetic buttons + custom cursor (mouse only) ---------- */
  if (finePointer) {
    $$('.magnetic').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });

    // normal cursor stays visible; a soft ring trails it and swells over clickable things
    const cursor = $('.cursor');
    const ring = $('.cursor-ring');
    gsap.set(ring, { xPercent: -50, yPercent: -50 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      rx(e.clientX); ry(e.clientY);
      cursor.classList.add('is-on');
    });
    document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('pointerover', e => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .tl-card'));
    });
  }

  // fonts change text widths; re-measure pins once they're in
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

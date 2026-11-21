const Studio = (() => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem('fw.' + key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem('fw.' + key, JSON.stringify(value)); } catch {} };
  const node = (tag, text = '', cls = '') => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const notify = text => {
    document.querySelector('.toast')?.remove();
    const el = node('div', text, 'toast');
    el.setAttribute('role', 'status');
    document.body.append(el);
    setTimeout(() => el.remove(), 4000);
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme ---- */
  function theme(mode) {
    document.documentElement.classList.toggle('light', mode === 'light');
    document.querySelector('.theme')?.setAttribute('aria-label', 'Switch to ' + (mode === 'light' ? 'dark' : 'light') + ' theme');
  }
  theme(read('theme', 'dark'));
  document.querySelector('.theme')?.addEventListener('click', () => {
    const mode = document.documentElement.classList.contains('light') ? 'dark' : 'light';
    save('theme', mode);
    theme(mode);
  });
  document.querySelectorAll('dialog .close').forEach(b => b.onclick = () => b.closest('dialog').close());

  /* ---- Scroll effects shared by every page ---- */
  const header = document.querySelector('header');
  const bar = node('div', '', 'progress');
  bar.setAttribute('aria-hidden', 'true');
  bar.append(document.createElement('i'));
  document.body.append(bar);
  const totop = node('button', '', 'totop');
  totop.setAttribute('aria-label', 'Back to top');
  totop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m0 0l-6 6m6-6l6 6"/></svg>';
  totop.onclick = () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  document.body.append(totop);

  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const hooks = [];
  let ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.firstChild.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    header?.classList.toggle('solid', y > 20);
    totop.classList.toggle('show', y > 700);
    if (!reduced) {
      for (const el of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        const off = r.top + r.height / 2 - innerHeight / 2;
        el.style.setProperty('--py', (-off * Number(el.dataset.parallax)).toFixed(1) + 'px');
      }
    }
    hooks.forEach(fn => fn(y));
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ---- Reveal on scroll (+ split headings) ---- */
  function split(el) {
    let n = 0;
    const walk = parent => {
      [...parent.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'), inner = document.createElement('i');
            w.className = 'w';
            inner.textContent = part;
            inner.style.setProperty('--w', n++);
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
  }
  const targets = [...document.querySelectorAll('[data-reveal],[data-split]')];
  if (!reduced) document.querySelectorAll('[data-split]').forEach(split);
  // Effects replay: elements animate in when they enter the viewport and reset when they leave,
  // so scrolling up and down (and back from the bottom of the page) keeps performing the effects.
  let io = null;
  if (reduced || !('IntersectionObserver' in window)) targets.forEach(t => t.classList.add('in'));
  else {
    io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= .1) e.target.classList.add('in');
      else if (!e.isIntersecting) e.target.classList.remove('in');
    }), { threshold: [0, .1], rootMargin: '0px 0px -5% 0px' });
    targets.forEach(t => io.observe(t));
  }
  const observe = el => { if (io) io.observe(el); else el.classList.add('in'); };

  /* ---- Pointer spotlight on cards ---- */
  document.addEventListener('pointermove', e => {
    const card = e.target.closest?.('.project,.tile');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---- Image safety net: retry once, then show a placeholder ---- */
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (!img.dataset.retry) {
      img.dataset.retry = '1';
      const src = img.getAttribute('src');
      setTimeout(() => { img.src = src + (src.includes('?') ? '&' : '?') + 'r=1'; }, 400);
    } else img.classList.add('img-fail');
  }, true);

  return { $, read, save, node, notify, reduced, observe, onScroll: fn => hooks.push(fn) };
})();

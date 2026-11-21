const { $, node, notify, reduced, onScroll } = Studio;
const cards = [...document.querySelectorAll('.project')];
let category = 'All Projects';

/* ---------- Filters, search, preview ---------- */
function filter() {
  const query = $('search').value.trim().toLowerCase();
  let count = 0;
  cards.forEach(card => {
    card.hidden = !(category === 'All Projects' || card.dataset.category === category) || !card.dataset.search.toLowerCase().includes(query);
    if (!card.hidden) count++;
  });
  $('matches').textContent = count ? '' : 'No matching projects. Try a different category or search.';
}
document.querySelectorAll('.filters button').forEach(b => {
  const cat = b.dataset.cat;
  const n = cat === 'All Projects' ? cards.length : cards.filter(c => c.dataset.category === cat).length;
  b.append(node('em', String(n)));
  b.onclick = () => {
    category = cat;
    document.querySelectorAll('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
    filter();
  };
});
$('search').oninput = filter;
document.querySelectorAll('.preview').forEach(b => b.onclick = () => {
  const c = b.closest('article'), body = $('previewBody');
  const link = node('a', 'Open project ', 'btn primary');
  link.href = c.querySelector('.thumb').getAttribute('href');
  link.append(node('span', '↗', 'arrow'));
  body.replaceChildren(
    c.querySelector('img').cloneNode(),
    node('small', c.dataset.category),
    c.querySelector('h3').cloneNode(true),
    c.querySelector('.pad p').cloneNode(true),
    c.querySelector('.chips').cloneNode(true),
    link
  );
  $('preview').showModal();
});

/* ---------- Mobile menu & active nav ---------- */
const menu = document.querySelector('.menu');
function toggle(open) { $('links').classList.toggle('open', open); menu.setAttribute('aria-expanded', open); }
menu.onclick = () => toggle(menu.getAttribute('aria-expanded') === 'false');
$('links').onclick = () => toggle(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
if ('IntersectionObserver' in window) {
  const nav = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) {
      document.querySelectorAll('#links a').forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
    }
  }, { rootMargin: '-35% 0px -55%' });
  document.querySelectorAll('main section[id]').forEach(x => nav.observe(x));
}

/* ---------- Hero motion ---------- */
const hero = document.querySelector('.hero-section');
const art = document.querySelector('.viewport');
if (!reduced) {
  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    const a = art.getBoundingClientRect();
    art.style.setProperty('--dx', ((e.clientX - a.left - a.width / 2) * .035).toFixed(1) + 'px');
    art.style.setProperty('--dy', ((e.clientY - a.top - a.height / 2) * .035).toFixed(1) + 'px');
  });
  hero.addEventListener('pointerleave', () => { art.style.removeProperty('--dx'); art.style.removeProperty('--dy'); });

  // Rotating headline word
  const word = $('word'), words = ['experiences', 'interfaces', 'games', 'AI tools'];
  let wi = 0;
  setInterval(() => {
    if (document.hidden) return;
    word.classList.add('out');
    setTimeout(() => { wi = (wi + 1) % words.length; word.textContent = words[wi]; word.classList.remove('out'); }, 380);
  }, 2800);
}

// Hero fades and drifts as you scroll away; marquee speeds up with scroll velocity
const track = document.querySelector('.track');
const marqueeClone = track.firstElementChild.cloneNode(true);
marqueeClone.setAttribute('aria-hidden', 'true');
track.append(marqueeClone);
let lastY = scrollY, rate = 1;
onScroll(y => {
  const p = Math.min(1, Math.max(0, y / (hero.offsetHeight * .8)));
  if (!reduced) {
    hero.style.setProperty('--hp', p.toFixed(3));
    const v = Math.abs(y - lastY);
    rate = Math.min(8, 1 + v / 14);
  }
  lastY = y;
});
if (!reduced) {
  const anim = track.getAnimations()[0];
  (function ease() {
    rate += (1 - rate) * .05;
    if (anim) anim.playbackRate = rate;
    requestAnimationFrame(ease);
  })();
}

// Count-up metrics when they scroll into view
const counters = document.querySelectorAll('[data-count]');
function count(el) {
  const end = Number(el.dataset.count), start = performance.now(), run = el._run = (el._run || 0) + 1;
  (function tick(now) {
    const t = Math.min(1, (now - start) / 1400), eased = 1 - Math.pow(1 - t, 3);
    if (el._run !== run) return;
    el.textContent = String(Math.round(end * eased)).padStart(2, '0');
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}
if (reduced || !('IntersectionObserver' in window)) counters.forEach(el => el.textContent = String(el.dataset.count).padStart(2, '0'));
else {
  counters.forEach(el => el.textContent = '00');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) count(e.target);          // replays every time the numbers scroll into view
    else { e.target._run = (e.target._run || 0) + 1; e.target.textContent = '00'; }
  }), { threshold: .6 });
  counters.forEach(el => io.observe(el));
}

/* ---------- Group details from js/config.js ---------- */
const cfg = window.FIELDWORK || {};
function safeLink(label, url) {
  try {
    if (new URL(url).protocol !== 'https:') return null;
    const a = node('a', label);
    a.href = url;
    a.rel = 'noopener';
    return a;
  } catch { return null; }
}
/* ---------- Team cards + full profile dialog ---------- */
const people = document.querySelector('.people');
const team = cfg.team || [];
function fillCard(card, m, i) {
  card.dataset.i = i;
  card.querySelector('h3').textContent = m.name;
  card.querySelector('.role').textContent = m.role || '';
  card.querySelector('.skills').textContent = m.line || '';
  card.querySelector('.contrib').textContent = m.sections?.[0]?.paras?.[0] || m.contributions || '';
  if (m.photo) { const img = card.querySelector('img'); img.src = m.photo; img.alt = 'Avatar of ' + m.name; }
  card.querySelector('.view').setAttribute('aria-label', 'View full profile of ' + m.name);
}
team.forEach((m, i) => {
  let card = people.querySelectorAll('.person')[i];
  if (!card) {
    card = people.querySelector('.person').cloneNode(true);
    people.append(card);
    Studio.observe(card);
  }
  fillCard(card, m, i);
});
if (team.length) document.querySelectorAll('.person').forEach((card, i) => { card.hidden = i >= team.length; });

const dlg = $('profile'), pbody = $('profileBody');
let current = 0;
function section(title, ...children) {
  const sec = node('section', '', 'pd-sec');
  sec.append(node('h4', title), ...children);
  return sec;
}
function openProfile(i) {
  current = (i + team.length) % team.length;
  const m = team[current];
  const side = node('aside', '', 'pd-side');
  const ring = node('div', '', 'avatar-ring'), img = new Image();
  img.src = m.photo || ''; img.alt = 'Avatar of ' + m.name; img.width = img.height = 132;
  ring.append(img);
  const tags = node('ul', '', 'chips');
  (m.tags || []).forEach(t => tags.append(node('li', t)));
  side.append(ring, node('small', 'Member ' + String(current + 1).padStart(2, '0') + ' / ' + String(team.length).padStart(2, '0')), node('h3', m.name, 'pd-name'), node('p', m.role || '', 'pd-role'), tags);
  if (m.motto) {
    const q = node('blockquote', '', 'pd-motto');
    q.append(node('small', m.mottoTitle || 'Personal Motto'), node('p', '“' + m.motto + '”'));
    side.append(q);
  }
  const main = node('div', '', 'pd-main');
  const h2 = node('h2', 'Profile'); h2.id = 'pdTitle';
  main.append(node('small', 'Personal information'), h2);
  if (m.info?.length) {
    const grid = node('dl', '', 'pd-info');
    m.info.forEach(([k, v]) => { const d = node('div'); d.append(node('dt', k), node('dd', v)); grid.append(d); });
    main.append(grid);
  }
  (m.sections || []).forEach(sec => main.append(section(sec.title, ...sec.paras.map(t => node('p', t)))));
  if (m.interests?.length) {
    const list = node('ul', '', 'chips big');
    m.interests.forEach(t => list.append(node('li', t)));
    main.append(section('Interests & Hobbies', list));
  }
  pbody.replaceChildren(side, main);
  dlg.setAttribute('aria-label', m.name + ' — profile');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0; pbody.scrollTop = 0;
  dlg.querySelector('.pd-body-scroll')?.scrollTo(0, 0);
}
people.addEventListener('click', e => {
  const card = e.target.closest('.person');
  if (card && !e.target.closest('a')) openProfile(Number(card.dataset.i));
});
people.querySelectorAll('.person').forEach(c => c.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === c) openProfile(Number(c.dataset.i)); }));
$('pdPrev').onclick = () => openProfile(current - 1);
$('pdNext').onclick = () => openProfile(current + 1);
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') openProfile(current - 1);
  if (e.key === 'ArrowRight') openProfile(current + 1);
});
if (cfg.email) $('contactInfo').textContent = cfg.email;
if (cfg.social?.length) $('footerSocial').replaceChildren();
(cfg.social || []).forEach(s => {
  const a = safeLink(s.label, s.url);
  if (a) { $('social').append(a); $('footerSocial').append(a.cloneNode(true)); }
});
if (cfg.social?.length) $('socialRow').hidden = false;
if (cfg.formEndpoint) $('delivery').textContent = 'Sends through the configured group contact service.';

/* ---------- Contact form ---------- */
$('contactForm').onsubmit = async e => {
  e.preventDefault();
  const f = e.currentTarget, d = new FormData(f);
  for (const [k, v] of d) if (!v.trim()) { notify('Please complete the ' + k + ' field.'); f.elements[k].focus(); return; }
  if (cfg.formEndpoint) {
    const b = f.querySelector('button');
    b.disabled = true;
    try {
      const r = await fetch(cfg.formEndpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } });
      if (!r.ok) throw Error();
      notify('Message accepted by the contact service.');
      f.reset();
    } catch { notify('Delivery failed. Your message is still here.'); }
    finally { b.disabled = false; }
    return;
  }
  location.href = 'mailto:' + encodeURIComponent(cfg.email || '') + '?subject=' + encodeURIComponent(d.get('subject')) + '&body=' + encodeURIComponent(d.get('message') + '\n\n' + d.get('name') + ' <' + d.get('email') + '>');
  notify('Email draft requested. Review the recipient before sending.');
};

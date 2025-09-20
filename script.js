/* ===========================================================
   Musings carousel – inline JSON only (no external fetch)
   Cards: Title (link), optional subtitle, preview (7–10 words) + "Continue reading"
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setFooterDates();
  initReveal();

  const track = document.getElementById('carousel-track');
  const viewport = document.getElementById('carousel-viewport');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  let index = 0;
  let intervalId = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const posts = readInlinePosts();
  renderSlides(posts, track);
  initCarousel();

  /* ----- helpers ----- */

  function readInlinePosts(){
    const inline = document.getElementById('posts-data');
    if (!inline) return [];
    try {
      const json = JSON.parse(inline.textContent || '[]');
      return Array.isArray(json) ? json : [];
    } catch { return []; }
  }

  function renderSlides(postsArr, container){
    container.innerHTML = '';
    const list = postsArr.length ? postsArr : [{
      title: 'No posts yet',
      subtitle: '',
      excerpt: ' ',
      url: '#'
    }];

    list.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'slide';
      li.setAttribute('role', 'group');
      li.setAttribute('aria-roledescription', 'slide');
      li.setAttribute('aria-label', `Post ${i+1} of ${list.length}`);

      const body = document.createElement('div');
      body.className = 'slide-body stack-xs';

      // Title (single heading, linked) — typewriter look via CSS class
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = p.url || '#';
      a.className = 'typewriter';
      a.textContent = p.title || 'Untitled';
      h3.appendChild(a);
      body.appendChild(h3);

      // Optional subtitle
      if (p.subtitle && String(p.subtitle).trim()) {
        const sub = document.createElement('p');
        sub.className = 'subtitle small';
        sub.textContent = String(p.subtitle).trim();
        body.appendChild(sub);
      }

      // Preview from leading sentence (7–10 words)
      const preview = document.createElement('p');
      preview.textContent = makePreview(p.excerpt || p.title || '', 7, 10);
      body.appendChild(preview);

      // Continue link
      const read = document.createElement('a');
      read.href = p.url || '#';
      read.textContent = 'Continue reading';
      body.appendChild(read);

      li.appendChild(body);
      container.appendChild(li);
    });
  }

  function makePreview(text, minWords = 15, maxWords = 25){
    if (!text) return '';
    const sentence = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[\.!\?])\s+|\n+/)[0] || text;
    const words = sentence.split(' ').filter(Boolean);
    const count = Math.min(Math.max(minWords, Math.min(words.length, maxWords)), words.length);
    const snippet = words.slice(0, count).join(' ');
    return (count < words.length) ? `${snippet}…` : snippet;
  }

  function initCarousel(){
    index = 0; update();

    prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn.addEventListener('click', () => goTo(index + 1));

    [prevBtn, nextBtn].forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
      });
    });

    if (!reduceMotion) startAuto();
    viewport.addEventListener('mouseenter', pauseAuto);
    viewport.addEventListener('mouseleave', () => { if (!reduceMotion) startAuto(); });
    viewport.addEventListener('focusin', pauseAuto);
    viewport.addEventListener('focusout', () => { if (!reduceMotion) startAuto(); });

    initSwipe(viewport);
  }

  function goTo(next){
    const count = track.children.length || 1;
    index = (next + count) % count;
    update();
  }
  function update(){ track.style.transform = `translateX(${-index * 100}%)`; }
  function startAuto(){ clearInterval(intervalId); intervalId = setInterval(() => goTo(index + 1), 6000); }
  function pauseAuto(){ clearInterval(intervalId); }

  function initSwipe(el){
    let startX = 0, dx = 0, tracking = false;
    const threshold = 40;
    el.addEventListener('touchstart', (e) => { tracking = true; startX = e.touches[0].clientX; dx = 0; }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (tracking) dx = e.touches[0].clientX - startX; }, { passive: true });
    el.addEventListener('touchend', () => {
      if (!tracking) return;
      if (Math.abs(dx) > threshold) (dx < 0) ? goTo(index + 1) : goTo(index - 1);
      tracking = false; dx = 0;
    });
  }

  /* footer + reveal */
  function setFooterDates(){
    const y = document.getElementById('year');
    const lu = document.getElementById('last-updated');
    const now = new Date();
    if (y) y.textContent = String(now.getFullYear());
    if (lu){ lu.textContent = now.toISOString().slice(0,10); lu.setAttribute('datetime', now.toISOString()); }
  }

  function initReveal(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
});

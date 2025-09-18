/* ===========================================================
   Portfolio interactions – text-only musings carousel
   - Loads posts (local file → inline JSON fallback)
   - Accessible, auto-rotating carousel (hover/keyboard/touch)
   - Titles/links use system serif for reflective tone
   - Respects prefers-reduced-motion
   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setFooterDates();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  initReveal(prefersReduced);

  // Posts + carousel
  const track = document.getElementById('carousel-track');
  const viewport = document.getElementById('carousel-viewport');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  let index = 0;
  let intervalId = null;

  loadPosts()
    .then(posts => {
      if (!Array.isArray(posts) || posts.length === 0) throw new Error('Empty posts');
      renderSlides(posts, track);
    })
    .catch(() => {
      renderSlides([{
        title: 'No posts found',
        date: new Date().toISOString().slice(0,10),
        excerpt: 'Add items to posts.sample.json or the inline #posts-data JSON block.',
        url: '#'
      }], track);
    })
    .finally(() => {
      initCarousel();
    });

  // ===== Data loading =====
  async function loadPosts(){
    // 1) Try local JSON (may be blocked under file://)
    try {
      const res = await fetch('posts.sample.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length) return json;
      }
    } catch(_) { /* fall through */ }

    // 2) Inline fallback
    const inline = document.getElementById('posts-data');
    if (inline && inline.textContent.trim()) {
      try {
        const json = JSON.parse(inline.textContent);
        if (Array.isArray(json) && json.length) return json;
      } catch(_) { /* ignore */ }
    }
    throw new Error('No posts available');
  }

  // ===== UI helpers =====
  function setFooterDates(){
    const y = document.getElementById('year');
    const lu = document.getElementById('last-updated');
    const now = new Date();
    y.textContent = String(now.getFullYear());
    lu.textContent = now.toISOString().slice(0,10);
    lu.setAttribute('datetime', now.toISOString());
  }

  function initReveal(reduced){
    if (reduced) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  function renderSlides(posts, container){
    container.innerHTML = '';
    posts.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'slide';
      li.setAttribute('role', 'group');
      li.setAttribute('aria-roledescription', 'slide');
      li.setAttribute('aria-label', `Post ${i+1} of ${posts.length}`);

      const body = document.createElement('div');
      body.className = 'slide-body stack-xs';

      const date = document.createElement('div');
      date.className = 'post-date';
      date.textContent = toFriendlyDate(p.date);

      const h3 = document.createElement('h3');
      const titleLink = document.createElement('a');
      titleLink.href = p.url || '#';
      titleLink.className = 'link serif';          // reflective serif for title/link
      titleLink.textContent = p.title;
      h3.appendChild(titleLink);

      const ex = document.createElement('p');
      ex.textContent = p.excerpt || '';

      // Optional separate "Read" link if you want both:
      // const read = document.createElement('a');
      // read.href = p.url || '#';
      // read.className = 'link serif';
      // read.textContent = 'Read';

      body.append(date, h3, ex /*, read*/);
      li.append(body);
      container.appendChild(li);
    });
  }

  function toFriendlyDate(iso){
    if(!iso) return '';
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat(undefined, { year:'numeric', month:'short', day:'2-digit' });
    return fmt.format(d);
  }

  // ===== Carousel =====
  function initCarousel(){
    let slidesCount = document.getElementById('carousel-track').children.length || 1;
    index = 0;
    update();

    prevBtn.addEventListener('click', () => { goTo(index - 1); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); });

    [prevBtn, nextBtn].forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
      });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startAuto();
    viewport.addEventListener('mouseenter', pauseAuto);
    viewport.addEventListener('mouseleave', () => { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startAuto(); });
    viewport.addEventListener('focusin', pauseAuto);
    viewport.addEventListener('focusout', () => { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startAuto(); });

    initSwipe(viewport);

    // In case dynamic content changes count later
    const mo = new MutationObserver(() => {
      slidesCount = document.getElementById('carousel-track').children.length || 1;
      index = Math.min(index, slidesCount - 1);
      update();
    });
    mo.observe(document.getElementById('carousel-track'), { childList: true });
  }

  function goTo(next){
    const count = document.getElementById('carousel-track').children.length || 1;
    index = (next + count) % count;
    update();
  }

  function update(){
    const percent = -(index * 100);
    document.getElementById('carousel-track').style.transform = `translateX(${percent}%)`;
  }

  function startAuto(){
    clearInterval(intervalId);
    intervalId = setInterval(() => goTo(index + 1), 6000);
  }
  function pauseAuto(){ clearInterval(intervalId); }

  function initSwipe(el){
    let startX = 0, dx = 0, tracking = false;
    const threshold = 40;

    el.addEventListener('touchstart', (e) => {
      tracking = true;
      startX = e.touches[0].clientX;
      dx = 0;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      dx = e.touches[0].clientX - startX;
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (!tracking) return;
      if (Math.abs(dx) > threshold){
        if (dx < 0) goTo(index + 1);
        else goTo(index - 1);
      }
      tracking = false; dx = 0;
    });
  }
});

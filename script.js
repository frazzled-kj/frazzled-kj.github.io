/* ===========================================================
   Portfolio interactions – musings cards (title, optional subtitle,
   leading 7–10 words, "Continue reading")
   - Loads posts (local file → inline JSON fallback)
   - Accessible, auto-rotating carousel (hover/keyboard/touch)
   - Titles use .serif (typewriter-like monospace stack via CSS)
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
        subtitle: '',
        date: new Date().toISOString().slice(0,10),
        excerpt: 'Add items to posts.sample.json or the inline #posts-data JSON block.',
        url: '#'
      }], track);
    })
    .finally(() => {
      initCarousel();
    });

  /* ===============================
     Data loading
     =============================== */
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

  /* ===============================
     UI helpers
     =============================== */
  function setFooterDates(){
    const y = document.getElementById('year');
    const lu = document.getElementById('last-updated');
    const now = new Date();
    if (y) y.textContent = String(now.getFullYear());
    if (lu){
      lu.textContent = now.toISOString().slice(0,10);
      lu.setAttribute('datetime', now.toISOString());
    }
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

  /* ===============================
     Rendering – text-only slides
     =============================== */
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

      // Title (single heading, linked)
      const h3 = document.createElement('h3');
      const titleLink = document.createElement('a');
      titleLink.href = p.url || '#';
      titleLink.className = 'link serif';   // reflective/“typewriter” tone via CSS
      titleLink.textContent = p.title || 'Untitled';
      titleLink.setAttribute('aria-label', `Open post: ${p.title || 'Untitled'}`);
      h3.appendChild(titleLink);
      body.appendChild(h3);

      // Optional subtitle
      if (p.subtitle && String(p.subtitle).trim().length){
        const sub = document.createElement('p');
        sub.className = 'muted small';
        sub.textContent = String(p.subtitle).trim();
        body.appendChild(sub);
      }

      // Preview = leading sentence → first 7–10 words + …
      const preview = document.createElement('p');
      preview.textContent = makePreview(p.excerpt || p.title || '', 7, 10);
      body.appendChild(preview);

      // Continue link
      const read = document.createElement('a');
      read.href = p.url || '#';
      read.className = 'link';
      read.textContent = 'Continue reading';
      read.setAttribute('aria-label', `Continue reading: ${p.title || 'post'}`);
      body.appendChild(read);

      li.append(body);
      container.appendChild(li);
    });
  }

  function makePreview(text, minWords = 7, maxWords = 10){
    if (!text) return '';
    // Get leading sentence (split on . ! ? or line break)
    const sentence = String(text)
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[\.!\?])\s+|\n+/)[0] || text;

    const words = sentence.split(' ').filter(Boolean);
    const count = Math.min(Math.max(minWords, Math.min(words.length, maxWords)), words.length);
    const snippet = words.slice(0, count).join(' ');
    // Add ellipsis only if we truncated
    return (count < words.length) ? `${snippet}…` : `${snippet}`;
  }

  /* ===============================
     Carousel
     =============================== */
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

    // Update if slide count changes
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

(function(){
  const qs = s => document.querySelector(s);

  // --- Vibe system ---------------------------------------------------------
  const random = seed => {
    let t = seed;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ t >>> 15, t | 1);
      r ^= r + Math.imul(r ^ r >>> 7, r | 61);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  };

  function contrast(c1, c2){
    const l = c => {
      const a = [parseInt(c.substr(1,2),16), parseInt(c.substr(3,2),16), parseInt(c.substr(5,2),16)].map(v => {
        v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
      });
      return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
    };
    const L1 = l(c1)+0.05, L2 = l(c2)+0.05; return L1>L2?L1/L2:L2/L1;
  }

  function hsl(h,s,l){return `hsl(${h} ${s}% ${l}%)`;}

  let currentSeed = null;

  function generateTokens(seed){
    const rnd = random(seed);
    const hue = Math.floor(rnd()*360);
    const bg = hsl(hue, 40, 95);
    const surface = hsl(hue, 30, 88);
    const text = hsl(hue, 40, 15);
    const muted = hsl(hue, 20, 40);
    const accent = hsl((hue+180)%360,70,45);
    const accentContrast = contrast('#000000', accent)>=4.5? '#000' : '#fff';
    return {bg, surface, text, muted, accent, accentContrast};
  }

  function apply(tokens){
    const root = document.documentElement.style;
    root.setProperty('--bg', tokens.bg);
    root.setProperty('--surface', tokens.surface);
    root.setProperty('--text', tokens.text);
    root.setProperty('--muted', tokens.muted);
    root.setProperty('--accent', tokens.accent);
    root.setProperty('--accent-contrast', tokens.accentContrast);
  }

  function setSeed(seed){
    currentSeed = seed;
    const tokens = generateTokens(seed);
    apply(tokens);
    localStorage.setItem('vibeSeed', seed);
    const p = new URL(location);
    p.searchParams.set('v', seed.toString(36));
    history.replaceState({}, '', p);
  }

  window.randomizeVibe = () => {
    setSeed(Math.floor(Math.random()*1e9));
  };

  window.copyVibeLink = () => {
    const url = location.href;
    navigator.clipboard.writeText(url).then(()=>{
      const live = qs('#copy-confirm');
      if(live){ live.textContent = 'link copied'; setTimeout(()=>live.textContent='',2000); }
    });
  };

  function initVibes(){
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('v');
    if(fromUrl){ setSeed(parseInt(fromUrl,36)); return; }
    const stored = localStorage.getItem('vibeSeed');
    if(stored){ setSeed(parseInt(stored,10)); return; }
    randomizeVibe();
  }

  // --- Substack rotation ---------------------------------------------------
  function initSubstack(){
    const wrap = qs('#substack');
    if(!wrap) return;
    fetch('/assets/substack.json').then(r=>r.json()).then(data=>{
      const posts = data.posts.slice();
      if(!posts.length){ wrap.style.display='none'; return; }
      let idx = 0;
      const slot = qs('#substack-list');
      const render = () =>{
        slot.innerHTML='';
        const p1 = posts[idx%posts.length];
        const p2 = posts[(idx+1)%posts.length];
        [p1,p2].slice(0,posts.length>1?2:1).forEach(p=>{
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = p.url; a.textContent = p.title; a.target='_blank';
          li.appendChild(a); slot.appendChild(li);
        });
        idx = (idx+1)%posts.length;
      };
      render();
      if(posts.length>1) setInterval(render,12000);
    });
  }

  // --- Projects rendering --------------------------------------------------
  function renderProjects(list, container){
    container.innerHTML='';
    list.forEach(p=>{
      const card = document.createElement('article');
      card.className='card';
      card.innerHTML=`<h3>${p.title}</h3><p>${p.summary}</p>`;
      const tags = document.createElement('p');
      p.tags.forEach(t=>{const span=document.createElement('span');span.className='tag';span.textContent=t;tags.appendChild(span);});
      card.appendChild(tags);
      const actions=document.createElement('p');
      if(p.links.writeup){const a=document.createElement('a');a.href=p.links.writeup;a.textContent='Read';a.className='button';actions.appendChild(a);} 
      if(p.links.demo){const a=document.createElement('a');a.href=p.links.demo;a.textContent='Demo';a.className='button';a.style.marginLeft='0.5rem';actions.appendChild(a);} 
      if(p.links.repo){const a=document.createElement('a');a.href=p.links.repo;a.textContent='Code';a.className='button';a.style.marginLeft='0.5rem';actions.appendChild(a);} 
      card.appendChild(actions);
      container.appendChild(card);
    });
  }

  function initHomeProjects(){
    const container = qs('#featured-projects');
    if(!container) return;
    fetch('/assets/projects.json').then(r=>r.json()).then(list=>{
      renderProjects(list.slice(0,6), container);
    });
  }

  function initProjectsPage(){
    const container = qs('#all-projects');
    if(!container) return;
    fetch('/assets/projects.json').then(r=>r.json()).then(list=>{
      renderProjects(list, container);
      const tags = Array.from(new Set(list.flatMap(p=>p.tags))).sort();
      const filterWrap = qs('#tag-filters');
      tags.forEach(t=>{
        const btn=document.createElement('button');btn.textContent=t;btn.dataset.tag=t;filterWrap.appendChild(btn);
      });
      filterWrap.addEventListener('click',e=>{
        if(e.target.tagName!=='BUTTON') return;
        const tag=e.target.dataset.tag;
        const filtered=list.filter(p=>p.tags.includes(tag));
        renderProjects(filtered, container);
      });
      const search = qs('#search');
      if(search) search.addEventListener('input',e=>{
        const q=e.target.value.toLowerCase();
        renderProjects(list.filter(p=>p.title.toLowerCase().includes(q)||p.summary.toLowerCase().includes(q)), container);
      });
    });
  }

  function injectUpdated(){
    const el = qs('#last-updated');
    if(el){ el.textContent = new Date().toISOString().split('T')[0]; }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initVibes();
    initSubstack();
    initHomeProjects();
    initProjectsPage();
    injectUpdated();
    const vibeBtn = qs('#vibe-btn');
    if(vibeBtn) vibeBtn.addEventListener('click', randomizeVibe);
    const copyBtn = qs('#copy-vibe');
    if(copyBtn) copyBtn.addEventListener('click', copyVibeLink);
  });
})();

(function(){
  const qs = s => document.querySelector(s);

  // ---- VIBE TOGGLE (no persistence, no URL) ----
  const palettes = [
    { bg:"#0f1115", surface:"#151923", text:"#e9ecf1", muted:"#9aa3b2", accent:"#7aa2ff" },
    { bg:"#0e0e10", surface:"#1a1c22", text:"#f2f4f7", muted:"#a1a7b3", accent:"#ffb868" },
    { bg:"#0b1416", surface:"#121d21", text:"#e7fbff", muted:"#8eb3bd", accent:"#7ee787" },
    { bg:"#0f0e12", surface:"#1a1822", text:"#f7f4ff", muted:"#b5a9d6", accent:"#c084fc" }
  ];
  const shapes = ["shape-rounded","shape-cut"];
  const shadows = ["shadow-soft","shadow-strong"];
  const borders = ["border-subtle","border-bold"];
  const patterns = ["pattern-none","pattern-soft","pattern-stripe"];
  const layouts = ["layout-centered","layout-split"];

  function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function applyVibe() {
    const p = rand(palettes);
    const r = document.documentElement.style;
    r.setProperty("--bg", p.bg);
    r.setProperty("--surface", p.surface);
    r.setProperty("--text", p.text);
    r.setProperty("--muted", p.muted);
    r.setProperty("--accent", p.accent);

    const b = document.body;
    [...shapes, ...shadows, ...borders, ...patterns, ...layouts].forEach(c => b.classList.remove(c));
    b.classList.add(rand(shapes), rand(shadows), rand(borders), rand(patterns), rand(layouts));
  }

  // ---- LATEST MUSINGS (rotate from JSON) ----
  async function loadMusings(){
    try {
      const res = await fetch("/assets/substack.json", {cache:"no-store"});
      const data = await res.json();
      const list = document.getElementById("musingsList");
      if (!list) return;

      const posts = (data.posts || []).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
      if (posts.length === 0) { list.innerHTML = ""; return; }

      let start = 0;
      function renderWindow(){
        const windowSize = Math.min(4, posts.length);
        const slice = [];
        for (let i=0; i<windowSize; i++){
          slice.push(posts[(start + i) % posts.length]);
        }
        list.innerHTML = slice.map(p => `
          <li>
            <a class="musing-title" href="${p.url}" target="_blank" rel="noopener">${p.title}</a>
            <span class="musing-date">${p.date ? new Date(p.date).toLocaleDateString() : ""}</span>
          </li>
        `).join("");
        start = (start + windowSize) % posts.length;
      }

      renderWindow();
      if (list.dataset.rotate === "true"){
        setInterval(renderWindow, 12000);
      }
    } catch(e){
      // fail silently
    }
  }

  // ---- Projects rendering --------------------------------------------------
  function renderProjects(list, container){
    container.innerHTML='';
    list.forEach(p=>{
      const card=document.createElement('article');
      card.className='card';
      card.innerHTML=`<h3>${p.title}</h3><p>${p.summary}</p>`;
      const tags=document.createElement('p');
      p.tags.forEach(t=>{
        const span=document.createElement('span');
        span.className='tag';
        span.textContent=t;
        tags.appendChild(span);
      });
      card.appendChild(tags);
      const actions=document.createElement('p');
      if(p.links.writeup){
        const a=document.createElement('a');
        a.href=p.links.writeup;
        a.textContent='Read';
        a.className='button';
        actions.appendChild(a);
      }
      if(p.links.demo){
        const a=document.createElement('a');
        a.href=p.links.demo;
        a.textContent='Demo';
        a.className='button';
        a.style.marginLeft='0.5rem';
        actions.appendChild(a);
      }
      if(p.links.repo){
        const a=document.createElement('a');
        a.href=p.links.repo;
        a.textContent='Code';
        a.className='button';
        a.style.marginLeft='0.5rem';
        actions.appendChild(a);
      }
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
      if(filterWrap){
        tags.forEach(t=>{
          const btn=document.createElement('button');
          btn.textContent=t;
          btn.dataset.tag=t;
          filterWrap.appendChild(btn);
        });
        filterWrap.addEventListener('click',e=>{
          if(e.target.tagName!=='BUTTON') return;
          const tag=e.target.dataset.tag;
          const filtered=list.filter(p=>p.tags.includes(tag));
          renderProjects(filtered, container);
        });
      }
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
    const vibeBtn = document.getElementById('vibeBtn');
    if(vibeBtn) vibeBtn.addEventListener('click', applyVibe);
    loadMusings();
    initHomeProjects();
    initProjectsPage();
    injectUpdated();
  });
})();


(function(){
  const btn = document.getElementById('vibeBtn');
  if(!btn) return;

  const rand = (min,max) => Math.random()*(max-min)+min;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];

  function applyVibe(){
    const r = document.documentElement.style;
    r.setProperty('--radius', `${Math.round(rand(6,22))}px`);
    r.setProperty('--cut', Math.random()<0.5 ? 0 : 1);
    r.setProperty('--shadow-y', `${Math.round(rand(4,16))}px`);
    r.setProperty('--shadow-blur', `${Math.round(rand(14,32))}px`);
    r.setProperty('--border-style', pick(['solid','dashed','none']));
    r.setProperty('--grain-opacity', (Math.random()<0.5 ? 0.02 : 0.05).toString());
    const body = document.body;
    const split = Math.random()<0.5;
    body.classList.toggle('layout-split-hero', split);
    body.classList.toggle('layout-centered', !split);
  }

  document.body.classList.add('layout-centered');
  btn.addEventListener('click', applyVibe);

  const last = document.getElementById('last-updated');
  if(last) last.textContent = new Date().toISOString().split('T')[0];
})();

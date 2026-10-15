(() => {
  const canvas = document.getElementById('artCanvas');
  const ctx = canvas.getContext('2d');
  const countLabel = document.getElementById('markCount');
  const hint = document.getElementById('canvasHint');
  const toast = document.getElementById('toast');
  const colors = ['#ff4fa3','#ff9e36','#ffd84f','#2de2c5','#6c78ff','#c77dff'];
  let chosenColor = colors[0], mode = 'petal', intensity = 5, rainOn = false, marks = [], rainDrops = [], lastTrail = 0, toastTimer;
  let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }
  function updateCount() {
    countLabel.textContent = `${marks.length} ${marks.length === 1 ? 'mark' : 'marks'} created`;
    if (marks.length) hint.style.opacity = '0';
    else hint.style.opacity = '1';
  }
  function addMark(x, y, markMode = mode, color = chosenColor, size = 1) {
    const rect = canvas.getBoundingClientRect();
    const radius = (Math.min(rect.width, rect.height) * (0.035 + intensity * 0.004)) * size;
    marks.push({ x, y, mode: markMode, color, radius, intensity, seed: Math.random() * 1000 });
    if (marks.length > 220) marks.shift();
    drawMark(marks[marks.length - 1]);
    updateCount();
  }
  function drawMark(m) {
    const {x,y,radius:r,color} = m;
    ctx.save(); ctx.translate(x,y); ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=1.5; ctx.shadowColor=color; ctx.shadowBlur=9;
    const petals = Math.max(5, Math.min(12, m.intensity + 3));
    if (m.mode === 'ripple') {
      for (let i=0;i<4;i++) { ctx.globalAlpha = 0.85 - i*.17; ctx.beginPath(); ctx.arc(0,0,r*(.35+i*.25),0,Math.PI*2); ctx.stroke(); }
      ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    } else if (m.mode === 'star') {
      for(let i=0;i<petals;i++) { ctx.save(); ctx.rotate((Math.PI*2/petals)*i); ctx.beginPath(); ctx.moveTo(0,-r*.25); ctx.lineTo(r*.14,-r*.62); ctx.lineTo(0,-r); ctx.lineTo(-r*.14,-r*.62); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0,0,r*.19,0,Math.PI*2); ctx.fillStyle='#fff0a6'; ctx.fill();
    } else {
      for(let i=0;i<petals;i++) { ctx.save(); ctx.rotate((Math.PI*2/petals)*i); ctx.beginPath(); ctx.ellipse(0,-r*.52,r*.19,r*.52,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#ffe4a6'; ctx.stroke(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0,0,r*.23,0,Math.PI*2); ctx.fillStyle='#ffe88a'; ctx.fill();
      ctx.beginPath(); ctx.arc(0,0,r*.38,0,Math.PI*2); ctx.strokeStyle=color; ctx.lineWidth=1; ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    const bg = ctx.createRadialGradient(rect.width*.5,rect.height*.48,5,rect.width*.5,rect.height*.48,Math.max(rect.width,rect.height)*.7);
    bg.addColorStop(0,'rgba(63,43,123,.17)'); bg.addColorStop(1,'rgba(5,9,31,0)'); ctx.fillStyle=bg; ctx.fillRect(0,0,rect.width,rect.height);
    marks.forEach(drawMark);
  }
  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0,Math.min(rect.width,event.clientX-rect.left)), y: Math.max(0,Math.min(rect.height,event.clientY-rect.top)) };
  }
  canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') e.preventDefault(); const p=pointFromEvent(e); addMark(p.x,p.y); });
  canvas.addEventListener('pointermove', e => {
    if (!(e.buttons || e.pointerType === 'touch')) return;
    const now=performance.now(); if(now-lastTrail<45) return; lastTrail=now;
    const p=pointFromEvent(e); addMark(p.x,p.y,'ripple',chosenColor,.34);
  });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => {
    chosenColor=button.dataset.color; document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('selected',b===button));
  }));
  document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => {
    mode=button.dataset.mode; document.querySelectorAll('.mode-button').forEach(b=>b.classList.toggle('active',b===button));
    showToast(`${button.textContent.trim()} mode selected`);
  }));
  const rainToggle=document.getElementById('rainToggle');
  rainToggle.addEventListener('click', () => {
    rainOn=!rainOn; rainToggle.setAttribute('aria-checked',String(rainOn));
    if(rainOn) { showToast('Rain mode is on — watch the canvas'); startRain(); } else { showToast('Rain mode paused'); }
  });
  function startRain() {
    if(!rainOn) return;
    const rect=canvas.getBoundingClientRect();
    const x=Math.random()*rect.width, y=Math.random()*rect.height;
    addMark(x,y,'ripple',colors[Math.floor(Math.random()*colors.length)],.55);
    setTimeout(startRain, 220 + Math.random()*520);
  }
  document.getElementById('intensity').addEventListener('input', e => { intensity=Number(e.target.value); document.getElementById('intensityValue').value=intensity; });
  document.getElementById('undoButton').addEventListener('click', () => { if(!marks.length){showToast('Your canvas is already empty');return;} marks.pop(); redraw(); updateCount(); });
  document.getElementById('resetButton').addEventListener('click', () => { marks=[]; redraw(); updateCount(); showToast('Fresh canvas. Make something wonderful.'); });
  document.getElementById('saveButton').addEventListener('click', () => {
    if(!marks.length) { showToast('Make a few marks before saving your rangoli'); return; }
    const exportCanvas=document.createElement('canvas'); const rect=canvas.getBoundingClientRect(); exportCanvas.width=Math.round(rect.width*2); exportCanvas.height=Math.round(rect.height*2);
    const ex=exportCanvas.getContext('2d'); ex.scale(2,2); ex.fillStyle='#090d2b'; ex.fillRect(0,0,rect.width,rect.height);
    const old=ctx; // redraw into an offscreen canvas with the same drawing logic
    marks.forEach(m=>{
      ex.save(); ex.translate(m.x,m.y); ex.strokeStyle=m.color; ex.fillStyle=m.color; ex.lineWidth=1.5; ex.shadowColor=m.color; ex.shadowBlur=9;
      const r=m.radius, n=Math.max(5,Math.min(12,m.intensity+3));
      if(m.mode==='ripple'){for(let i=0;i<4;i++){ex.globalAlpha=.85-i*.17;ex.beginPath();ex.arc(0,0,r*(.35+i*.25),0,Math.PI*2);ex.stroke();}ex.globalAlpha=1;}
      else if(m.mode==='star'){for(let i=0;i<n;i++){ex.save();ex.rotate(Math.PI*2/n*i);ex.beginPath();ex.moveTo(0,-r*.25);ex.lineTo(r*.14,-r*.62);ex.lineTo(0,-r);ex.lineTo(-r*.14,-r*.62);ex.closePath();ex.fill();ex.restore();}}
      else {for(let i=0;i<n;i++){ex.save();ex.rotate(Math.PI*2/n*i);ex.beginPath();ex.ellipse(0,-r*.52,r*.19,r*.52,0,0,Math.PI*2);ex.fill();ex.strokeStyle='#ffe4a6';ex.stroke();ex.restore();}ex.beginPath();ex.arc(0,0,r*.23,0,Math.PI*2);ex.fillStyle='#ffe88a';ex.fill();}
      ex.restore();
    });
    const link=document.createElement('a'); link.download='my-rainrang-art.png'; link.href=exportCanvas.toDataURL('image/png'); link.click(); showToast('Your rangoli is ready to save!');
  });
  function jumpToCanvas(){document.getElementById('canvas-section').scrollIntoView({behavior:'smooth'});setTimeout(()=>canvas.focus?.(),350);}
  document.getElementById('startButton').addEventListener('click',jumpToCanvas); document.getElementById('closingStart').addEventListener('click',jumpToCanvas);
  document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('light');showToast(document.body.classList.contains('light')?'Light theme enabled':'Night theme enabled');});
  const observer=new ResizeObserver(resizeCanvas); observer.observe(canvas); window.addEventListener('resize',resizeCanvas); resizeCanvas();
})();

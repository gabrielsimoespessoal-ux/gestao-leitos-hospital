(()=>{
const frame=document.getElementById('appFrame');if(!frame)return;
function install(){
 let d,w;try{d=frame.contentDocument;w=frame.contentWindow}catch{return false}
 if(!d||!w||!Array.isArray(w.setoresData)||typeof w.renderizarPainelLeitos!=='function')return false;
 if(w.__hsjPerfisPediatricos20261028)return true;
 w.__hsjPerfisPediatricos20261028=true;
 const profiles=['Enfermaria Clínica Pediátrica','Enfermaria Cirúrgica Pediátrica'];
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const css=d.createElement('style');
 css.textContent='#painel-setores-detalhado .leito-pill.hsj-ped-perfil{box-shadow:inset 0 0 0 2px #d97706!important;overflow:visible!important;position:relative!important}#painel-setores-detalhado .hsj-perfil-ped-icon{position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);font-size:9px;font-weight:900;padding:2px 5px;border-radius:8px;background:#f59e0b;color:#422006;border:2px solid #fff;z-index:15;white-space:nowrap;box-shadow:0 1px 4px #0004}';
 d.head.appendChild(css);
 function ensureOptions(){for(const select of d.querySelectorAll('select')){if(![...select.options].some(o=>norm(o.value)==='enfermaria cirurgica'))continue;for(const name of profiles){if(![...select.options].some(o=>norm(o.value)===norm(name)))select.add(new Option(name,name))}}}
 function draw(){
  ensureOptions();
  const grid=d.getElementById('painel-setores-detalhado');if(!grid)return;
  for(const card of grid.querySelectorAll('.sector-box')){
   const sectorName=norm(card.querySelector('.sector-title-row h3')?.textContent);
   const sector=w.setoresData.find(s=>norm(s.nome)===sectorName);if(!sector)continue;
   for(const pill of card.querySelectorAll('.leito-pill')){
    const number=String(pill.firstChild?.textContent||'').trim();
    const bed=(sector.leitos||[]).find(l=>String(l.n)===number);
    pill.querySelector('.hsj-perfil-ped-icon')?.remove();pill.classList.remove('hsj-ped-perfil');
    if(!bed||!['ocupado','reservado'].includes(bed.status))continue;
    const record=w.basePacientesCadastrados?.[bed.prontuario]||{};
    const profile=norm(record.perfil||record.perfilVaga||bed.perfil||'');
    if(!profiles.some(p=>norm(p)===profile))continue;
    pill.classList.add('hsj-ped-perfil');
    const badge=d.createElement('span');badge.className='hsj-perfil-ped-icon';badge.textContent=profile.includes('cirurgica')?'PED-C':'PED-CL';badge.title=profile.includes('cirurgica')?'Enfermaria Cirúrgica Pediátrica':'Enfermaria Clínica Pediátrica';badge.setAttribute('aria-label',badge.title);pill.appendChild(badge);
   }
  }
 }
 const old=w.renderizarPainelLeitos;
 w.renderizarPainelLeitos=function(...args){const r=old.apply(this,args);w.setTimeout(draw,50);return r};
 let queued=false;const grid=d.getElementById('painel-setores-detalhado');
 if(grid){const obs=new MutationObserver(()=>{if(queued)return;queued=true;w.setTimeout(()=>{queued=false;draw()},150)});obs.observe(grid,{childList:true,subtree:true})}
 draw();return true;
}
frame.addEventListener('load',()=>setTimeout(install,400));let n=0;const t=setInterval(()=>{if(install()||++n>120)clearInterval(t)},250);
})();
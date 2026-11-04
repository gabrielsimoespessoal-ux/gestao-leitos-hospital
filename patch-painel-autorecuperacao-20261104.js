(()=>{
 const frame=document.getElementById('appFrame');if(!frame)return;
 let bound=false;
 function start(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch{return false}
  if(!w||!d||!d.getElementById('painel-setores-detalhado')||typeof w.renderizarPainelLeitos!=='function')return false;
  if(w.__hsjPainelAutoRecuperacao20261104)return true;
  w.__hsjPainelAutoRecuperacao20261104=true;bound=true;
  const grid=d.getElementById('painel-setores-detalhado'),panel=d.getElementById('painel');
  const banner=d.createElement('div');banner.id='hsj-painel-status-reparo';banner.style.cssText='display:none;background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:8px;padding:9px 12px;font:600 12px Arial,sans-serif;color:#1e3a8a;margin:8px 0';
  banner.setAttribute('role','status');grid.before(banner);
  function notice(message){banner.textContent=message;banner.style.display='block'}
  function dismiss(){banner.style.display='none';banner.textContent=''}
  let emptyChecks=0,recovering=false,lastAttempt=0,failures=0;
  function verify(){
   if(!d.isConnected||frame.contentDocument!==d)return false;
   if(!panel.classList.contains('active'))return true;
   const sectors=Array.isArray(w.setoresData)?w.setoresData.filter(s=>Array.isArray(s.leitos)&&s.leitos.length):[];
   const confirmed=w.multiusuarioStatus!=='conflito'&&d.getElementById('hsj-bloqueio-conexao')?.style.display==='none';
   // Never render absent, cache-only or disconnected data.
   if(!sectors.length||!confirmed)return true;
   const cards=[...grid.querySelectorAll('.sector-box')];
   const beds=grid.querySelectorAll('.leito-pill').length;
   const expected=sectors.reduce((sum,s)=>sum+s.leitos.length,0);
   const allValid=sectors.every(s=>s.leitos.every(l=>l&&l.n!=null&&typeof l.status==='string'));
   if(!allValid)return true;
   if(cards.length===sectors.length&&beds===expected){
    emptyChecks=0;failures=0;
    const allHidden=cards.every(c=>d.defaultView.getComputedStyle(c).display==='none');
    if(allHidden){
     const filter=d.getElementById('hsj-leitos-pesquisa'),sector=d.getElementById('hsj-leitos-setor');
     if(filter?.value.trim()||sector?.value){
      notice('Nenhum setor corresponde aos filtros atuais. Utilize “Limpar” nos filtros do painel para visualizar todos os leitos.');
     }else{
      notice('Os leitos estão ocultos por um filtro de exibição. Tentando restaurar a visualização...');
      cards.forEach(c=>c.style.removeProperty('display'));
      const reset=d.getElementById('btn-todos-v2');if(reset)reset.click();
     }
    }else dismiss();
    return true;
   }
   if(++emptyChecks<2||recovering||Date.now()-lastAttempt<12000)return true;
   recovering=true;lastAttempt=Date.now();
   notice('Painel de leitos temporariamente indisponível. Recuperando a visualização automaticamente...');
   try{
    // Pure UI rerender, no Firebase write and no page refresh.
    w.renderizarPainelLeitos();
    const actual=grid.querySelectorAll('.leito-pill').length;
    if(actual===expected){emptyChecks=0;failures=0;dismiss()}
    else {
      // Fallback de apresentação: apenas estado já confirmado; não toca no banco.
      const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const allowed=['disponivel','ocupado','reservado','higienizacao','bloqueado'];
      const html=sectors.map(sector=>{
       const beds=sector.leitos;
       const occupied=beds.filter(l=>l.status==='ocupado').length;
       const free=beds.filter(l=>l.status==='disponivel').length;
       const reserved=beds.filter(l=>l.status==='reservado').length;
       const blocked=beds.filter(l=>l.status==='bloqueado').length;
       const percent=beds.length?Math.round(occupied*100/beds.length):0;
       return '<section class="sector-box"><div class="sector-title-row"><div><h3>'+esc(sector.nome)+'</h3><p>'+esc(sector.tipo||'')+' · Total: '+beds.length+'</p></div><span class="ocup-badge">'+percent+'% Ocup.</span></div><div class="leitos-grid">'+beds.map(l=>'<div role="button" tabindex="0" class="leito-pill leito-'+(allowed.includes(l.status)?l.status:'disponivel')+'" data-recover-sector="'+esc(sector.nome)+'" data-recover-bed="'+esc(l.n)+'" title="'+esc(l.paciente||'Leito '+l.n)+'">'+esc(l.n)+'</div>').join('')+'</div><div class="sector-summary">Total: <strong>'+beds.length+'</strong> · Livres: <strong>'+free+'</strong> · Ocupados: <strong>'+occupied+'</strong> · Reservados: <strong>'+reserved+'</strong> · Bloqueados: <strong>'+blocked+'</strong></div></section>';
      }).join('');
      if(html&&expected>0){
       grid.innerHTML=html;
       emptyChecks=0;failures=0;
       notice('Exibição dos leitos restaurada com os dados confirmados do servidor.');
      } else if(++failures>=3)notice('A exibição não pôde ser restaurada. As movimentações permanecem protegidas.');
    }
   }catch(e){failures++;notice('Erro ao reconstruir os cartões: '+String(e?.message||e).slice(0,140));w.console?.error?.('SIGMA recuperação do painel',e)}
   finally{recovering=false}
   return true;
  }
  grid.addEventListener('click',e=>{
   const bed=e.target.closest('[data-recover-bed]');if(!bed)return;
   if(typeof w.abrirHistoricoPacienteLeito==='function')w.abrirHistoricoPacienteLeito(bed.dataset.recoverSector,bed.dataset.recoverBed);
  });
  grid.addEventListener('keydown',e=>{
   const bed=e.target.closest('[data-recover-bed]');if(bed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();bed.click()}
  });
  let stopped=false;
  const timer=w.setInterval(()=>{if(stopped)return;if(!verify()){stopped=true;w.clearInterval(timer)}},5000);
  // Check after a tab change without rewrapping shared save/sync functions.
  d.addEventListener('click',e=>{if(e.target.closest('nav.subnav .nav-item'))w.setTimeout(verify,1200)});
  w.setTimeout(verify,3500);
  return true;
 }
 frame.addEventListener('load',()=>{bound=false;setTimeout(start,400)});
 let tries=0;const timer=setInterval(()=>{if(start()||++tries>100)clearInterval(timer)},250);
})();